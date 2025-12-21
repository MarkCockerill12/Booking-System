import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

/**
 * Generate deterministic temperature based on location
 * Simple hash-based generator for consistent results
 */
function generateTemperature(location: string): number {
  // Hash the location string to get a consistent value
  const hash = location.split('').reduce((acc, char) => {
    return acc + (char.charCodeAt(0) || 0);
  }, 0);
  
  // Generate temperature in range 15-30°C
  const temperature = 15 + (hash % 15);
  
  return temperature;
}

/**
 * Main Lambda handler
 * Works with both API Gateway and direct Lambda invocation
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const method = event.httpMethod;

    // GET /weather?location=X&date=Y
    if (method === 'GET') {
      const location = event.queryStringParameters?.location;
      const date = event.queryStringParameters?.date;

      if (!location) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Missing required parameter: location',
          }),
        };
      }

      const temperature = generateTemperature(location);

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature }),
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Method not allowed',
      }),
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};
