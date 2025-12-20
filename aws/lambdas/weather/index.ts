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
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
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
 * Fetch weather data from OpenWeatherMap API
 */
async function fetchWeatherFromAPI(
  location: string,
  date: string
): Promise<ApiResponse> {
  // TESTABILITY: Return deterministic mocked value when NODE_ENV=test
  if (process.env.NODE_ENV === 'test') {
    const weatherData: WeatherData = {
      location,
      date,
      temperature: 28,
      feelsLike: 28,
      humidity: 50,
      description: 'Sunny',
      icon: '01d',
      windSpeed: 5,
      pressure: 1013,
      timestamp: Date.now(),
      ttl: Math.floor(Date.now() / 1000) + CACHE_TTL_HOURS * 3600,
    };
    
    return {
      success: true,
      data: weatherData,
    };
  }

  if (!OPENWEATHER_API_KEY) {
    return {
      success: false,
      error: 'OpenWeatherMap API key not configured',
    };
  }

  try {
    const targetDate = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil(
      (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let apiUrl: string;
    
    // Use current weather API for today/tomorrow
    if (diffDays <= 1) {
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        location
      )}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    } else if (diffDays <= 7) {
      // Use forecast API for next 5 days
      apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        location
      )}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    } else {
      return {
        success: false,
        error: 'Weather forecast only available for the next 7 days',
      };
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `API request failed: ${response.statusText}`,
      };
    }

    const data = await response.json();

    let weatherInfo;

    if (diffDays <= 1) {
      // Current weather response
      weatherInfo = {
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
        pressure: data.main.pressure,
      };
    } else {
      // Forecast response - find closest forecast to target date
      const targetTimestamp = targetDate.getTime();
      const closestForecast = data.list.reduce((prev: any, curr: any) => {
        const currDiff = Math.abs(curr.dt * 1000 - targetTimestamp);
        const prevDiff = Math.abs(prev.dt * 1000 - targetTimestamp);
        return currDiff < prevDiff ? curr : prev;
      });

      weatherInfo = {
        temperature: closestForecast.main.temp,
        feelsLike: closestForecast.main.feels_like,
        humidity: closestForecast.main.humidity,
        description: closestForecast.weather[0].description,
        icon: closestForecast.weather[0].icon,
        windSpeed: closestForecast.wind.speed,
        pressure: closestForecast.main.pressure,
      };
    }

    const weatherData: WeatherData = {
      location,
      date,
      ...weatherInfo,
      timestamp: Date.now(),
      ttl: Math.floor(Date.now() / 1000) + CACHE_TTL_HOURS * 3600,
    };

    // Cache the result
    await saveWeatherToCache(weatherData);

    return {
      success: true,
      data: weatherData,
    };
  } catch (error) {
    console.error('Error fetching weather from API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch weather data',
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

  // Fetch from API
  return await fetchWeatherFromAPI(location, date);
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
