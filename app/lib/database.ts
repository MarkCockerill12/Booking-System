import fs from "node:fs/promises"
import path from "node:path"
import bcrypt from "bcryptjs"
import type { User, Room, Booking, WeatherData } from "./index"

// Local JSON database (for development)
const DB_PATH = path.join(process.cwd(), "data", "db.json")

interface Database {
  users: User[]
  rooms: Room[]
  bookings: Booking[]
  weather: WeatherData[]
}

async function readDB(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    // Initialize empty database if file doesn't exist
    const emptyDB: Database = {
      users: [],
      rooms: [
        {
          id: "1",
          name: "Azure Conference Room",
          description: "Large conference room with video conferencing capabilities",
          capacity: 20,
          location: "Building A, Floor 3",
          imageUrl: "/modern-conference-room-blue.jpg",
          amenities: ["Projector", "Whiteboard", "Video Conferencing", "WiFi"],
          pricePerHour: 50,
          available: true,
        },
        {
          id: "2",
          name: "Vista Meeting Space",
          description: "Medium-sized meeting room perfect for team collaboration",
          capacity: 10,
          location: "Building B, Floor 2",
          imageUrl: "/modern-meeting-room-green.jpg",
          amenities: ["TV Screen", "Whiteboard", "WiFi"],
          pricePerHour: 35,
          available: true,
        },
        {
          id: "3",
          name: "Aero Huddle Room",
          description: "Small intimate space for quick meetings",
          capacity: 5,
          location: "Building A, Floor 1",
          imageUrl: "/small-huddle-room.jpg",
          amenities: ["TV Screen", "WiFi"],
          pricePerHour: 20,
          available: true,
        },
      ],
      bookings: [],
      weather: [],
    }
    await writeDB(emptyDB)
    return emptyDB
  }
}

async function writeDB(data: Database): Promise<void> {
  const dir = path.dirname(DB_PATH)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2))
}

// User operations
export async function createUser(email: string, password: string, name: string): Promise<User> {
  const db = await readDB()

  const existingUser = db.users.find((u) => u.email === email)
  if (existingUser) {
    throw new Error("User already exists")
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser: User = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
    name,
    role: "user",
    createdAt: new Date().toISOString(),
  }

  db.users.push(newUser)
  await writeDB(db)

  const { password: _, ...userWithoutPassword } = newUser
  return userWithoutPassword as User
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await readDB()
  return db.users.find((u) => u.email === email) || null
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await readDB()
  const user = db.users.find((u) => u.id === id)
  if (user) {
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }
  return null
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Room operations
export async function getRooms(filters?: {
  capacity?: number
  location?: string
  available?: boolean
}): Promise<Room[]> {
  const db = await readDB()
  let rooms = db.rooms

  if (filters?.capacity) {
    rooms = rooms.filter((r) => r.capacity >= filters.capacity!)
  }
  if (filters?.location) {
    rooms = rooms.filter((r) => r.location.toLowerCase().includes(filters.location!.toLowerCase()))
  }
  if (filters?.available !== undefined) {
    rooms = rooms.filter((r) => r.available === filters.available)
  }

  return rooms
}

export async function getRoomById(id: string): Promise<Room | null> {
  const db = await readDB()
  return db.rooms.find((r) => r.id === id) || null
}

// Booking operations
export async function createBooking(
  userId: string,
  roomId: string,
  startTime: string,
  endTime: string,
): Promise<Booking> {
  const db = await readDB()

  // Check if room exists
  const room = db.rooms.find((r) => r.id === roomId)
  if (!room) {
    throw new Error("Room not found")
  }

  // Check for conflicts
  const hasConflict = db.bookings.some(
    (b) =>
      b.roomId === roomId &&
      b.status !== "cancelled" &&
      ((startTime >= b.startTime && startTime < b.endTime) ||
        (endTime > b.startTime && endTime <= b.endTime) ||
        (startTime <= b.startTime && endTime >= b.endTime)),
  )

  if (hasConflict) {
    throw new Error("Room is already booked for this time slot")
  }

  // Calculate duration and total price
  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  const totalPrice = durationHours * room.pricePerHour

  const newBooking: Booking = {
    id: Date.now().toString(),
    userId,
    roomId,
    startTime,
    endTime,
    status: "pending",
    totalPrice,
    createdAt: new Date().toISOString(),
  }

  db.bookings.push(newBooking)
  await writeDB(db)

  return newBooking
}

export async function getBookingsByUserId(userId: string): Promise<Booking[]> {
  const db = await readDB()
  return db.bookings.filter((b) => b.userId === userId)
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const db = await readDB()
  return db.bookings.find((b) => b.id === id) || null
}

export async function updateBookingStatus(id: string, status: "confirmed" | "cancelled"): Promise<Booking> {
  const db = await readDB()
  const booking = db.bookings.find((b) => b.id === id)

  if (!booking) {
    throw new Error("Booking not found")
  }

  booking.status = status
  if (status === "confirmed") {
    booking.confirmedAt = new Date().toISOString()
  }

  await writeDB(db)
  return booking
}

// Weather operations
export async function getWeatherByLocation(location: string): Promise<WeatherData | null> {
  const db = await readDB()
  return db.weather.find((w) => w.location.toLowerCase() === location.toLowerCase()) || null
}

export async function updateWeather(location: string, data: Partial<WeatherData>): Promise<WeatherData> {
  const db = await readDB()
  const existingIndex = db.weather.findIndex((w) => w.location.toLowerCase() === location.toLowerCase())

  const weatherData: WeatherData = {
    location,
    temperature: data.temperature || 20,
    condition: data.condition || "Sunny",
    humidity: data.humidity || 50,
    lastUpdated: new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    db.weather[existingIndex] = weatherData
  } else {
    db.weather.push(weatherData)
  }

  await writeDB(db)
  return weatherData
}

/* 
// PRODUCTION: AWS DynamoDB Integration
// Uncomment when deploying to AWS

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names from environment
const USERS_TABLE = process.env.USERS_TABLE_NAME || 'BookingSystem-Users';
const ROOMS_TABLE = process.env.ROOMS_TABLE_NAME || 'BookingSystem-Rooms';
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE_NAME || 'BookingSystem-Bookings';
const WEATHER_TABLE = process.env.WEATHER_TABLE_NAME || 'BookingSystem-Weather';

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user: User = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
    name,
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: user,
  }));

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await docClient.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email,
    },
  }));

  return result.Items?.[0] as User || null;
}

// ... other DynamoDB operations
*/
