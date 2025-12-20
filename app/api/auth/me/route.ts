import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserById } from "@/lib/database"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await getUserById(session.userId)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { user },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to get user" }, { status: 500 })
  }
}
