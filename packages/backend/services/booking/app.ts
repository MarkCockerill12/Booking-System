import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const db = new DynamoDBClient({});
const lambda = new LambdaClient({});
const sqs = new SQSClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) return { statusCode: 400, body: "Missing body" };
    const { roomId, date } = JSON.parse(event.body);
    const userId = "test-user-123"; // In real auth, get from event.requestContext

    // 1. Get Room Details
    const roomRes = await db.send(new GetItemCommand({
      TableName: process.env.ROOMS_TABLE,
      Key: marshall({ id: roomId })
    }));
    // Note: In a real app, handle !roomRes.Item error here

    // 2. Call Weather Service (Synchronous)
    const weatherRes = await lambda.send(new InvokeCommand({
      FunctionName: process.env.WEATHER_FUNC_NAME,
      Payload: JSON.stringify({ queryStringParameters: { location: "London", date } })
    }));
    // Parse the nested JSON response from Lambda
    const weatherPayload = JSON.parse(new TextDecoder().decode(weatherRes.Payload));
    const weatherBody = JSON.parse(weatherPayload.body);
    const temp = weatherBody.temperature;

    // 3. Calculate Price
    let price = 100; // Default base price
    if (temp > 25) price += 20; // Hot weather surcharge

    // 4. Write PENDING Booking to DB
    const bookingId = uuidv4();
    await db.send(new PutItemCommand({
      TableName: process.env.BOOKINGS_TABLE,
      Item: marshall({
        id: bookingId,
        userId,
        roomId,
        date,
        status: "PENDING",
        totalPrice: price
      })
    }));

    // 5. Send to SQS for Payment
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.PAYMENTS_QUEUE_URL,
      MessageBody: JSON.stringify({ bookingId, price, userId })
    }));

    return {
      statusCode: 202,
      body: JSON.stringify({ 
        bookingId, 
        status: "PENDING", 
        message: "Booking initiated. Processing payment..." 
      })
    };

  } catch (err: any) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};