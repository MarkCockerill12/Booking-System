export interface User {
  user_id: string
  email: string
  password: string
  created_at: string
}

export interface Location {
  location_id: string
  name: string
  address: string
}

export interface ConferenceRoom {
  room_id: string
  location_id: string
  name: string
  capacity: number
  description: string
  base_price: number
  image_url: string
}

export interface Booking {
  booking_id: string
  user_id: string
  room_id: string
  booking_date: string
  total_price: number
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
  created_at: string
  cancelled_at?: string
  payment_id?: string
}

export interface PricingRule {
  rule_id: string
  name: string
  description: string
  temperature_min?: number
  temperature_max?: number
  temperature_deviation_min?: number
  temperature_deviation_max?: number
  surcharge_percentage: number
}

export interface Database {
  users: User[]
  locations: Location[]
  conference_rooms: ConferenceRoom[]
  bookings: Booking[]
  pricing_rules: PricingRule[]
}

// Weather forecast response
export interface WeatherForecast {
  location: string
  temperature: number
  forecast: string
  fetched_at: string
}

// API Response types
export interface AuthResponse {
  message: string
  token: string
  user: {
    user_id: string
    email: string
  }
}

export interface BookingResponse {
  message: string
  booking: Booking
}

/* PRODUCTION AWS DYNAMODB TYPES (COMMENTED OUT)

// DynamoDB attribute types
export interface DynamoDBLocation {
  location_id: { S: string }
  name: { S: string }
  address: { S: string }
}

export interface DynamoDBRoom {
  room_id: { S: string }
  location_id: { S: string }
  name: { S: string }
  capacity: { N: string }
  description: { S: string }
  base_price: { N: string }
  image_url: { S: string }
}

export interface DynamoDBBooking {
  booking_id: { S: string }
  user_id: { S: string }
  room_id: { S: string }
  booking_date: { S: string }
  total_price: { N: string }
  status: { S: string }
  created_at: { S: string }
  payment_id?: { S: string }
}

*/
