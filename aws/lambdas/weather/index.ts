import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const WEATHER_CACHE_TABLE = process.env.WEATHER_CACHE_TABLE || 'weather-cache';
const CACHE_TTL_HOURS = 1; // Cache weather data for 1 hour

interface WeatherData {
  location: string;
  date: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  pressure: number;
  timestamp: number;
  ttl: number;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

/**
 * Generate cache key for weather data
 */
function getCacheKey(location: string, date: string): string {
  return `${location.toLowerCase().trim()}_${date}`;
}

/**
 * Fetch weather data from cache
 */
async function getWeatherFromCache(
  location: string,
  date: string
): Promise<WeatherData | null> {
  try {
    const cacheKey = getCacheKey(location, date);
    const command = new GetItemCommand({
      TableName: WEATHER_CACHE_TABLE,
      Key: {
        cacheKey: { S: cacheKey },
      },
    });

    const result = await dynamoClient.send(command);

    if (!result.Item) {
      return null;
    }

    const cachedData = unmarshall(result.Item) as WeatherData & { cacheKey: string };
    
    // Check if cache is still valid
    const now = Date.now();
    if (cachedData.ttl && cachedData.ttl * 1000 > now) {
      console.log('Cache hit for:', cacheKey);
      return cachedData;
    }

    console.log('Cache expired for:', cacheKey);
    return null;
  } catch (error) {
    console.error('Error fetching from cache:', error);
    return null;
  }
}

/**
 * Save weather data to cache
 */
async function saveWeatherToCache(weatherData: WeatherData): Promise<void> {
  try {
    const cacheKey = getCacheKey(weatherData.location, weatherData.date);
    const ttl = Math.floor(Date.now() / 1000) + CACHE_TTL_HOURS * 3600;

    const command = new PutItemCommand({
      TableName: WEATHER_CACHE_TABLE,
      Item: marshall({
        cacheKey,
        ...weatherData,
        ttl,
      }),
    });

    await dynamoClient.send(command);
    console.log('Weather data cached for:', cacheKey);
  } catch (error) {
    console.error('Error saving to cache:', error);
    // Don't throw - caching failure shouldn't break the request
  }
}

/**
 * Generate simulated weather data based on location and date
 * This simulates a weather service for the conference room booking system
 */
async function generateSimulatedWeather(
  location: string,
  date: string
): Promise<ApiResponse> {
  try {
    // Hash location name to get consistent but varied weather per location
    const locationHash = location.split('').reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0);
    
    // Parse date to get day variation
    const targetDate = new Date(date);
    const dayOfYear = Math.floor((targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate deterministic but varied temperature (15-35°C range)
    const baseTemp = 20 + (locationHash % 10);
    const seasonalVariation = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 5;
    const dailyVariation = (dayOfYear % 7) - 3;
    const temperature = Math.round(baseTemp + seasonalVariation + dailyVariation);
    
    // Generate other weather parameters
    const humidity = 40 + ((locationHash + dayOfYear) % 40);
    const windSpeed = 3 + ((locationHash * dayOfYear) % 15);
    const pressure = 1000 + ((locationHash + dayOfYear) % 30);
    
    // Determine weather conditions based on temperature
    let description: string;
    let icon: string;
    
    if (temperature > 28) {
      description = 'Clear sky';
      icon = '01d';
    } else if (temperature > 22) {
      description = 'Partly cloudy';
      icon = '02d';
    } else if (temperature > 18) {
      description = 'Cloudy';
      icon = '03d';
    } else if (temperature > 15) {
      description = 'Light rain';
      icon = '10d';
    } else {
      description = 'Overcast';
      icon = '04d';
    }
    
    const weatherData: WeatherData = {
      location,
      date,
      temperature,
      feelsLike: temperature - 2,
      humidity,
      description,
      icon,
      windSpeed,
      pressure,
      timestamp: Date.now(),
      ttl: Math.floor(Date.now() / 1000) + CACHE_TTL_HOURS * 3600,
    };

    // Cache the simulated weather
    await saveWeatherToCache(weatherData);

    return {
      success: true,
      data: weatherData,
    };
  } catch (error) {
    console.error('Error generating simulated weather:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate weather data',
    };
  }
}

/**
 * Get weather data with caching
 */
async function getWeather(location: string, date: string): Promise<ApiResponse> {
  // Validate inputs
  if (!location || !date) {
    return {
      success: false,
      error: 'Location and date are required',
    };
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return {
      success: false,
      error: 'Invalid date format. Use YYYY-MM-DD',
    };
  }

  // Check cache first
  const cachedWeather = await getWeatherFromCache(location, date);
  if (cachedWeather) {
    return {
      success: true,
      data: { ...cachedWeather, cached: true },
    };
  }

  // Generate simulated weather data
  return await generateSimulatedWeather(location, date);
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
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

      if (!location || !date) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: 'Missing required parameters: location and date',
          }),
        };
      }

      const result = await getWeather(location, date);

      return {
        statusCode: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed',
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
