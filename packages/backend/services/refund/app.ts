import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const isLocal = process.env.AWS_SAM_LOCAL === 'true';
const sqs = new SQSClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!event.body) return { statusCode: 400, body: "Missing body" };
  
  if (!isLocal) {
      await sqs.send(new SendMessageCommand({
        QueueUrl: process.env.REFUNDS_QUEUE_URL,
        MessageBody: event.body
      }));
  } else {
      console.log("⏩ [Local] Skipping Refund Queue push.");
  }

  return {
    statusCode: 202,
    body: JSON.stringify({ message: "Refund request received." })
  };
};