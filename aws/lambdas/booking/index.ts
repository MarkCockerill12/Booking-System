import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"
import { v4 as uuidv4 } from "uuid"

const getClientConfig = () => {
  const isLocal = process.env.AWS_SAM_LOCAL === 'true';
  const endpoint = process.env.AWS_ENDPOINT || (isLocal ? 'http://localstack:4566' : undefined);

  const config: any = {
    region: process.env.AWS_REGION || "us-east-1",
    endpoint: endpoint,
  };
  
  if (endpoint) {
    config.credentials = {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    };
  }
  
  return config;
};

const client = new DynamoDBClient(getClientConfig())
const dynamo = DynamoDBDocumentClient.from(client)
const sqsClient = new SQSClient(getClientConfig())
const lambdaClient = new LambdaClient(getClientConfig())

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE!
const ROOMS_TABLE = process.env.ROOMS_TABLE!
const PRICING_RULES_TABLE = process.env.PRICING_RULES_TABLE!
const PAYMENT_QUEUE_URL = process.env.PAYMENT_QUEUE_URL!
const WEATHER_FUNCTION_NAME = process.env.WEATHER_FUNCTION_NAME!

interface BookingEvent {
  httpMethod: string
  path: string
  body: string | null
  headers: Record<string, string>
  queryStringParameters?: Record<string, string>
  pathParameters?: Record<string, string>
  requestContext?: {
    authorizer?: {
      claims?: {
        sub?: string
        "cognito:username"?: string
        email?: string
      }
    }
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
}

// Extract user ID from Cognito Authorizer (secure method)
function getUserIdFromAuthorizer(event: BookingEvent): string | null {
  const claims = event.requestContext?.authorizer?.claims
  if (!claims) {
    // Fallback for local development/testing
    console.log("⚠️ No auth claims found, using test user ID");
    return "test-user-id";
  }
  return claims.sub || claims["cognito:username"] || null
}

/**
 * Get weather forecast by invoking Weather Lambda
 * Calls the Weather Lambda function to get temperature data
 */
async function getWeatherForecast(location: string, date: string): Promise<number> {
  try {
    const command = new InvokeCommand({
      FunctionName: WEATHER_FUNCTION_NAME,
      Payload: JSON.stringify({
        httpMethod: 'GET',
        queryStringParameters: { location, date },
      }),
    })

    const response = await lambdaClient.send(command)
    const payload = JSON.parse(new TextDecoder().decode(response.Payload))
    const weatherBody = JSON.parse(payload.body)
    const temperature = weatherBody.temperature

    console.log(`Weather forecast for ${location} on ${date}: ${temperature}°C`)
    return temperature
  } catch (error) {
    console.error('Error fetching weather forecast:', error)
    // Return default temperature if service fails
    return 20
  }
}

export const handler = async (event: BookingEvent) => {
  try {
    const method = event.httpMethod
    const path = event.path

    if (method === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders, body: "" }
    }

    const userId = getUserIdFromAuthorizer(event)

    // POST /bookings - Create booking
    if (method === "POST" && path === "/bookings") {
      if (!userId) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Not authenticated" }),
        }
      }

      const body = JSON.parse(event.body || "{}")
      const { roomId, startTime, endTime, paymentMethodId } = body

      if (!roomId || !startTime || !endTime || !paymentMethodId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Missing required fields: roomId, startTime, endTime, paymentMethodId" }),
        }
      }

      // Check for double booking
      const bookingDate = startTime.split("T")[0] // Extract date from ISO string
      
      const existingBookings = await dynamo.send(
        new QueryCommand({
          TableName: BOOKINGS_TABLE,
          IndexName: "room-date-index",
          KeyConditionExpression: "room_id = :roomId AND booking_date = :bookingDate",
          FilterExpression: "booking_status <> :cancelled AND (start_time < :endTime AND end_time > :startTime)",
          ExpressionAttributeValues: {
            ":roomId": roomId,
            ":bookingDate": bookingDate,
            ":cancelled": "CANCELLED",
            ":startTime": startTime,
            ":endTime": endTime,
          },
        })
      )

      if (existingBookings.Items && existingBookings.Items.length > 0) {
        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Room is already booked for this time slot" }),
        }
      }

      // Get room details for pricing
      const roomResult = await dynamo.send(
        new GetCommand({
          TableName: ROOMS_TABLE,
          Key: { room_id: roomId },
        })
      )

      if (!roomResult.Item) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Room not found" }),
        }
      }

      const room = roomResult.Item
      const start = new Date(startTime)
      const end = new Date(endTime)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      const basePrice = room.pricePerHour * hours

      // DYNAMIC PRICING: Fetch weather forecast for the booking date
      const temperature = await getWeatherForecast(room.location, bookingDate)

      // DYNAMIC PRICING: Fetch pricing rules from DynamoDB
      const pricingRulesResult = await dynamo.send(
        new ScanCommand({
          TableName: PRICING_RULES_TABLE,
        })
      )

      let surchargeMultiplier = 1.0
      const pricingRules = pricingRulesResult.Items || []

      // Apply temperature-based surcharge
      for (const rule of pricingRules) {
        if (rule.type === "temperature") {
          if (temperature > 25 && rule.condition === "high") {
            surchargeMultiplier += rule.surchargePercent / 100
          } else if (temperature < 15 && rule.condition === "low") {
            surchargeMultiplier += rule.surchargePercent / 100
          }
        }
      }

      const totalPrice = basePrice * surchargeMultiplier

      // Create booking with PENDING status
      const booking = {
        booking_id: uuidv4(),
        user_id: userId,
        room_id: roomId,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        booking_status: "PENDING",
        total_price: totalPrice,
        created_at: new Date().toISOString(),
      }

      await dynamo.send(
        new PutCommand({
          TableName: BOOKINGS_TABLE,
          Item: booking,
        })
      )

      // ASYNC PAYMENT: Send message to SQS payment queue
      const userEmail = event.requestContext?.authorizer?.claims?.email || "unknown@example.com"
      
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: PAYMENT_QUEUE_URL,
          MessageBody: JSON.stringify({
            type: "payment",
            data: {
              bookingId: booking.booking_id,
              amount: totalPrice,
              currency: "gbp",
              paymentMethodId,
              userId,
              userEmail,
              roomId,
              roomName: room.name,
              startTime,
              endTime,
            },
          }),
        })
      )

      console.log(`Payment message sent to queue for booking ${booking.booking_id}`)

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: { booking } }),
      }
    }

    // GET /bookings - Get user's bookings
    if (method === "GET" && path === "/bookings") {
      if (!userId) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Not authenticated" }),
        }
      }

      const result = await dynamo.send(
        new QueryCommand({
          TableName: BOOKINGS_TABLE,
          IndexName: "user-index",
          KeyConditionExpression: "user_id = :userId",
          ExpressionAttributeValues: {
            ":userId": userId,
          },
        })
      )

      // Map snake_case DB fields to camelCase API response
      const bookings = (result.Items || []).map(item => ({
        id: item.booking_id,
        userId: item.user_id,
        roomId: item.room_id,
        startTime: item.start_time,
        endTime: item.end_time,
        status: item.booking_status,
        totalPrice: item.total_price,
        createdAt: item.created_at
      }))

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: { bookings } }),
      }
    }

    // GET /bookings/:id - Get specific booking
    if (method === "GET" && event.pathParameters?.id) {
      const bookingId = event.pathParameters.id

      const result = await dynamo.send(
        new GetCommand({
          TableName: BOOKINGS_TABLE,
          Key: { booking_id: bookingId },
        })
      )

      if (!result.Item) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Booking not found" }),
        }
      }

      const item = result.Item
      const booking = {
        id: item.booking_id,
        userId: item.user_id,
        roomId: item.room_id,
        startTime: item.start_time,
        endTime: item.end_time,
        status: item.booking_status,
        totalPrice: item.total_price,
        createdAt: item.created_at
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: { booking } }),
      }
    }

    // PUT /bookings/:id - Update booking status
    if (method === "PUT" && event.pathParameters?.id) {
      if (!userId) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Not authenticated" }),
        }
      }

      const bookingId = event.pathParameters.id
      const body = JSON.parse(event.body || "{}")
      const { status } = body

      if (!status) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Status required" }),
        }
      }

      // Ensure status is uppercase for consistency
      const normalizedStatus = status.toUpperCase()

      const result = await dynamo.send(
        new UpdateCommand({
          TableName: BOOKINGS_TABLE,
          Key: { booking_id: bookingId },
          UpdateExpression: "SET booking_status = :status, updated_at = :updatedAt",
          ExpressionAttributeValues: {
            ":status": normalizedStatus,
            ":updatedAt": new Date().toISOString(),
          },
          ReturnValues: "ALL_NEW",
        })
      )

      const item = result.Attributes!
      const booking = {
        id: item.booking_id,
        userId: item.user_id,
        roomId: item.room_id,
        startTime: item.start_time,
        endTime: item.end_time,
        status: item.booking_status,
        totalPrice: item.total_price,
        createdAt: item.created_at
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: { booking } }),
      }
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Not found" }),
    }
  } catch (error: any) {
    console.error("Booking Lambda error:", error)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: error.message || "Internal server error" }),
    }
  }
}
