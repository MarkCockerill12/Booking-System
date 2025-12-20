import { type NextRequest, NextResponse } from "next/server"
import { getRooms } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const capacity = searchParams.get("capacity")
    const location = searchParams.get("location")
    const available = searchParams.get("available")

    const filters: any = {}
    if (capacity) filters.capacity = Number.parseInt(capacity)
    if (location) filters.location = location
    if (available) filters.available = available === "true"

    const rooms = await getRooms(filters)

    return NextResponse.json({
      success: true,
      data: { rooms },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch rooms" }, { status: 500 })
  }
}
