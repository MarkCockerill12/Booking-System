import { type NextRequest, NextResponse } from "next/server"
import { getBookingById, updateBookingStatus } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const booking = await getBookingById(id)

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 })
    }

    // Only allow user to view their own bookings
    if (booking.userId !== session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: { booking },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch booking" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !["confirmed", "cancelled"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    const booking = await getBookingById(id)
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 })
    }

    // Only allow user to update their own bookings
    if (booking.userId !== session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const updatedBooking = await updateBookingStatus(id, status)

    return NextResponse.json({
      success: true,
      data: { booking: updatedBooking },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update booking" }, { status: 500 })
  }
}
