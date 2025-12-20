import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/database"
import { createToken, setAuthCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Create user in database
    const user = await createUser(email, password, name)

    // Create JWT token
    const token = await createToken(user.id, user.email)

    // Set cookie
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      data: { user, token },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create user" }, { status: 400 })
  }
}
