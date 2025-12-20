import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" })
const dynamo = DynamoDBDocumentClient.from(client)

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE!
const ROOMS_TABLE = process.env.ROOMS_TABLE!

interface BookingEvent {
  httpMethod: string
  path: string
  body: string | null
  headers: Record<string, string>
  queryStringParameters?: Record<string, string>
  pathParameters?: Record<string, string>
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
}

// Extract user ID from Cognito JWT token
function getUserIdFromToken(authHeader?: string): string | null {
  if (!authHeader) return null
  const token = authHeader.replace("Bearer ", "")
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
    return payload.sub || payload["cognito:username"]
  } catch {
    return null
  }
}

export const handler = async (event: BookingEvent) => {
  try {
    const method = event.httpMethod
    const path = event.path

    if (method === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders, body: "" }
    }

    const userId = getUserIdFromToken(event.headers.Authorization || event.headers.authorization)

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
      const { roomId, startTime, endTime } = body

      if (!roomId || !startTime || !endTime) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Missing required fields" }),
        }
      }

      // Get room details for pricing
      const roomResult = await dynamo.send(
        new GetCommand({
          TableName: ROOMS_TABLE,
          Key: { id: roomId },
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

      // Create booking
      const booking = {
        id: uuidv4(),
        userId,
        roomId,
        startTime,
        endTime,
        status: "pending",
        totalPrice: basePrice,
        createdAt: new Date().toISOString(),
      }

      await dynamo.send(
        new PutCommand({
          TableName: BOOKINGS_TABLE,
          Item: booking,
        })
      )

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
          IndexName: "UserIdIndex",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId,
          },
        })
      )

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: { bookings: result.Items || [] } }),
      }
    }

    // GET /bookings/:id - Get specific booking
    if (method === "GET" && event.pathParameters?.id) {
      const bookingId = event.pathParameters.id

      const result = await dynamo.send(
        new GetCommand({
          TableName: BOOKINGS_TABLE,
          Key: { id: bookingId },
        })
      )

      if (!result.Item) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Booking not found" }),
        }
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: { booking: result.Item } }),
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

      const result = await dynamo.send(
        new UpdateCommand({
          TableName: BOOKINGS_TABLE,
          Key: { id: bookingId },
          UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": status,
            ":updatedAt": new Date().toISOString(),
          },
          ReturnValues: "ALL_NEW",
        })
      )

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: { booking: result.Attributes } }),
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
