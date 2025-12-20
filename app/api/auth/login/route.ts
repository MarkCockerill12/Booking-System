import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, verifyPassword } from "@/lib/database"
import { createToken, setAuthCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Missing email or password" }, { status: 400 })
    }

    // Get user from database
    const user = await getUserByEmail(email)
    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = await createToken(user.id, user.email)

    // Set cookie
    await setAuthCookie(token)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: { user: userWithoutPassword, token },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Login failed" }, { status: 500 })
  }
}
