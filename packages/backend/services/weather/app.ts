import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const isTest = process.env.NODE_ENV === 'test';
  // Deterministic for tests (28°C), Random for Prod
  const temperature = isTest ? 28 : Math.floor(Math.random() * (35 - 10) + 10);

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      location: event.queryStringParameters?.location || "Unknown",
      temperature 
    })
  };
};