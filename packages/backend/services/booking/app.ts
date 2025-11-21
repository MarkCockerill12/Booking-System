import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const isLocal = process.env.AWS_SAM_LOCAL === 'true';

const db = new DynamoDBClient({
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined
});
const lambda = new LambdaClient({});
const sqs = new SQSClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) return { statusCode: 400, body: "Missing body" };
    const { roomId, date } = JSON.parse(event.body);
    const userId = "test-user-123"; 

    // 1. Get Room Details
    const roomRes = await db.send(new GetItemCommand({
      TableName: process.env.ROOMS_TABLE,
      Key: marshall({ id: roomId })
    }));
    
    // 2. Weather Logic (Mocked inside Service or via Lambda Call)
    let temp = 20;
    if (!isLocal) {
        // Real Lambda Call
        const weatherRes = await lambda.send(new InvokeCommand({
            FunctionName: process.env.WEATHER_FUNC_NAME,
            Payload: JSON.stringify({ queryStringParameters: { location: "London", date } })
        }));
        const payloadString = new TextDecoder().decode(weatherRes.Payload);
        const weatherBody = JSON.parse(JSON.parse(payloadString).body);
        temp = weatherBody.temperature;
    } else {
        // Local Mock
        temp = 28; 
    }

    // 3. Calculate Price
    let price = 100; 
    if (temp > 25) price += 20; 

    // 4. Write Booking
    const bookingId = uuidv4();
    await db.send(new PutItemCommand({
      TableName: process.env.BOOKINGS_TABLE,
      Item: marshall({
        id: bookingId,
        userId,
        roomId,
        date,
        status: "PENDING",
        totalPrice: price,
        createdAt: new Date().toISOString()
      })
    }));

    // 5. Send to SQS
    if (!isLocal) {
        await sqs.send(new SendMessageCommand({
            QueueUrl: process.env.PAYMENTS_QUEUE_URL,
            MessageBody: JSON.stringify({ bookingId, price, userId })
        }));
    } else {
        console.log("⏩ [Local] Skipping SQS Send. Local Server will trigger Financial Service manually.");
    }

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