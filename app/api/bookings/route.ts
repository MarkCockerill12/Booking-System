import { type NextRequest, NextResponse } from "next/server"
import { createBooking, getBookingsByUserId } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { roomId, startTime, endTime } = body

    if (!roomId || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const booking = await createBooking(session.userId, roomId, startTime, endTime)

    /* 
    // PRODUCTION: Stripe Payment Integration
    // Uncomment when deploying with Stripe
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        userId: session.userId,
      },
    });

    booking.paymentId = paymentIntent.id;
    */

    return NextResponse.json({
      success: true,
      data: { booking },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create booking" }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const bookings = await getBookingsByUserId(session.userId)

    return NextResponse.json({
      success: true,
      data: { bookings },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch bookings" }, { status: 500 })
  }
}
