export interface User {
  id: string
  email: string
  password?: string
  name: string
  role: "admin" | "user"
  createdAt: string
}

export interface Room {
  id: string
  name: string
  description: string
  capacity: number
  location: string
  imageUrl: string
  amenities: string[]
  pricePerHour: number
  available: boolean
}

export interface Booking {
  id: string
  userId: string
  roomId: string
  startTime: string
  endTime: string
  status: "pending" | "confirmed" | "cancelled"
  totalPrice: number
  paymentId?: string
  createdAt: string
  confirmedAt?: string
}

export interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  lastUpdated: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
