import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function createToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(SECRET_KEY)
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY)
    return verified.payload as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")

  if (!token) {
    return null
  }

  return verifyToken(token.value)
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}
