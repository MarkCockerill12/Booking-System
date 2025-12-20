import { type NextRequest, NextResponse } from "next/server"
import { getRoomById } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const room = await getRoomById(id)

    if (!room) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { room },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch room" }, { status: 500 })
  }
}
