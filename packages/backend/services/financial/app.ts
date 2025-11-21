import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { marshall } from "@aws-sdk/util-dynamodb";

const isLocal = process.env.AWS_SAM_LOCAL === 'true';

const db = new DynamoDBClient({
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined
});
const sns = new SNSClient({});

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const { bookingId, isBypass } = body;

    console.log(`💰 Processing payment for Booking: ${bookingId}`);

    // Simulate Stripe
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update DB
    await db.send(new UpdateItemCommand({
      TableName: process.env.BOOKINGS_TABLE || 'bookings',
      Key: marshall({ id: bookingId }),
      UpdateExpression: "SET #s = :status",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: marshall({ ":status": "CONFIRMED" })
    }));

    // Publish to SNS
    if (!isLocal) {
        await sns.send(new PublishCommand({
            TopicArn: process.env.BOOKINGS_TOPIC_ARN,
            Message: JSON.stringify({ bookingId, status: "CONFIRMED" })
        }));
    } else {
        console.log("⏩ [Local] Skipping SNS Publish. (Booking Confirmed)");
    }
  }
};