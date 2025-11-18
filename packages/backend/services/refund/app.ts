import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!event.body) return { statusCode: 400, body: "Missing body" };
  
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.REFUNDS_QUEUE_URL,
    MessageBody: event.body
  }));

  return {
    statusCode: 202,
    body: JSON.stringify({ message: "Refund request received." })
  };
};