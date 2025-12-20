import { type NextRequest, NextResponse } from "next/server"
import { getWeatherByLocation, updateWeather } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get("location")

    if (!location) {
      return NextResponse.json({ success: false, error: "Location parameter required" }, { status: 400 })
    }

    let weather = await getWeatherByLocation(location)

    // If no weather data or data is old (> 1 hour), fetch new data
    if (!weather || Date.now() - new Date(weather.lastUpdated).getTime() > 3600000) {
      /* 
      // PRODUCTION: OpenWeatherMap API Integration
      // Uncomment when deploying with weather API
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );
      const data = await response.json();
      
      weather = await updateWeather(location, {
        temperature: data.main.temp,
        condition: data.weather[0].main,
        humidity: data.main.humidity,
      });
      */

      // Mock data for local development
      weather = await updateWeather(location, {
        temperature: 20 + Math.random() * 10,
        condition: ["Sunny", "Cloudy", "Rainy"][Math.floor(Math.random() * 3)],
        humidity: 40 + Math.random() * 30,
      })
    }

    return NextResponse.json({
      success: true,
      data: { weather },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch weather" }, { status: 500 })
  }
}
