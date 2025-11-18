import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { marshall } from "@aws-sdk/util-dynamodb";

const db = new DynamoDBClient({});
const sns = new SNSClient({});

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const { bookingId } = body;
    console.log(`Processing payment for Booking: ${bookingId}`);

    // Simulate Stripe Processing Delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update Status to CONFIRMED
    await db.send(new UpdateItemCommand({
      TableName: process.env.BOOKINGS_TABLE,
      Key: marshall({ id: bookingId }),
      UpdateExpression: "SET #s = :status",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: marshall({ ":status": "CONFIRMED" })
    }));

    // Publish "Booking Confirmed" event to SNS
    await sns.send(new PublishCommand({
      TopicArn: process.env.BOOKINGS_TOPIC_ARN,
      Message: JSON.stringify({ 
        bookingId, 
        message: "Your booking is confirmed!", 
        status: "CONFIRMED" 
      })
    }));
  }
};