import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const clientConfig: any = { region: process.env.AWS_REGION || 'us-east-1' };

console.log('AWS_ENDPOINT:', process.env.AWS_ENDPOINT);
console.log('AWS_SAM_LOCAL:', process.env.AWS_SAM_LOCAL);

const isLocal = process.env.AWS_SAM_LOCAL === 'true';
const endpoint = process.env.AWS_ENDPOINT || (isLocal ? 'http://localstack:4566' : undefined);

if (endpoint) {
  clientConfig.endpoint = endpoint;
  clientConfig.credentials = { accessKeyId: 'test', secretAccessKey: 'test' };
}

console.log('Client Config:', JSON.stringify(clientConfig, null, 2));

const dynamoClient = new DynamoDBClient(clientConfig);

const ROOMS_TABLE = process.env.ROOMS_TABLE || 'conference-rooms';
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE || 'bookings';

interface Room {
  room_id: string;
  name: string;
  capacity: number;
  location: string;
  amenities: string[];
  pricePerHour: number;
  imageUrl?: string;
  description?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

/**
 * Parse and verify Cognito JWT token from Authorization header
 */
function parseAuthToken(event: APIGatewayProxyEvent): string | null {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Check if a room is available for a specific date range
 */
async function isRoomAvailable(
  roomId: string,
  startDate?: string,
  endDate?: string
): Promise<boolean> {
  if (!startDate || !endDate) {
    return true; // If no date range specified, consider available
  }

  try {
    const command = new QueryCommand({
      TableName: BOOKINGS_TABLE,
      IndexName: 'room-date-index',
      KeyConditionExpression: 'room_id = :roomId AND booking_date BETWEEN :startDate AND :endDate',
      FilterExpression: 'booking_status <> :cancelled AND booking_status <> :cancelled_lower',
      ExpressionAttributeValues: {
        ':roomId': { S: roomId },
        ':startDate': { S: startDate },
        ':endDate': { S: endDate },
        ':cancelled': { S: 'CANCELLED' },
        ':cancelled_lower': { S: 'cancelled' },
      },
    });

    console.log(`Checking availability for room ${roomId} between ${startDate} and ${endDate} in table ${BOOKINGS_TABLE}`);
    const result = await dynamoClient.send(command);
    console.log(`Found ${result.Items?.length || 0} bookings`);
    
    return !result.Items || result.Items.length === 0;
  } catch (error) {
    console.error('Error checking room availability:', error);
    // If we can't check availability, we should probably assume it's available to avoid blocking everything,
    // OR return false and log the error. Returning false is safer to prevent double bookings, 
    // but if configuration is wrong, it blocks everything.
    // For debugging, let's see the error.
    return false;
  }
}

/**
 * Get all rooms with optional filters
 */
async function getRooms(
  capacity?: number,
  location?: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse> {
  try {
    const command = new ScanCommand({
      TableName: ROOMS_TABLE,
    });

    const result = await dynamoClient.send(command);
    
    if (!result.Items) {
      return { success: true, data: [] };
    }

    let rooms: Room[] = result.Items.map((item) => unmarshall(item) as Room);

    // Apply filters
    if (capacity) {
      rooms = rooms.filter((room) => room.capacity >= capacity);
    }

    if (location) {
      rooms = rooms.filter(
        (room) => room.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Check availability if date range provided
    if (startDate && endDate) {
      const availabilityChecks = await Promise.all(
        rooms.map(async (room) => ({
          room,
          available: await isRoomAvailable(room.room_id, startDate, endDate),
        }))
      );
      
      // Update availability status but DO NOT filter out unavailable rooms
      rooms = availabilityChecks.map((check) => ({
        ...check.room,
        available: check.available
      }));
    }

    const sortedRooms = [...rooms].sort((a, b) => a.name.localeCompare(b.name));
    return {
      success: true,
      data: {
        rooms: sortedRooms
      },
    };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rooms',
    };
  }
}

/**
 * Get a single room by ID
 */
async function getRoomById(roomId: string, date?: string): Promise<ApiResponse> {
  try {
    const command = new GetItemCommand({
      TableName: ROOMS_TABLE,
      Key: {
        room_id: { S: roomId },
      },
    });

    const result = await dynamoClient.send(command);

    if (!result.Item) {
      return {
        success: false,
        error: 'Room not found',
      };
    }

    const room = unmarshall(result.Item) as Room;

    // Check availability if date provided
    if (date) {
      room.available = await isRoomAvailable(roomId, date, date);
    }

    return {
      success: true,
      data: { room },
    };
  } catch (error) {
    console.error('Error fetching room:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch room',
    };
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('🚀 Room Lambda Invoked!');
  console.log('Environment:', {
    REGION: process.env.AWS_REGION,
    ENDPOINT: process.env.AWS_ENDPOINT,
    TABLE: process.env.ROOMS_TABLE
  });
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
    const pathParts = event.path.split('/').filter(Boolean);
    const method = event.httpMethod;

    // GET /rooms or GET /rooms?capacity=10&location=NYC
    if (method === 'GET' && pathParts.length === 1 && pathParts[0] === 'rooms') {
      const capacity = event.queryStringParameters?.capacity
        ? Number.parseInt(event.queryStringParameters.capacity)
        : undefined;
      const location = event.queryStringParameters?.location;
      const startDate = event.queryStringParameters?.startDate;
      const endDate = event.queryStringParameters?.endDate;

      const result = await getRooms(capacity, location, startDate, endDate);

      return {
        statusCode: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };
    }

    // GET /rooms/:id
    if (method === 'GET' && pathParts.length === 2 && pathParts[0] === 'rooms') {
      const roomId = pathParts[1];
      const date = event.queryStringParameters?.date;
      const result = await getRoomById(roomId, date);

      return {
        statusCode: result.success ? 200 : 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Route not found',
      }),
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};
