describe("API Health Check", () => {
  it("should return ok status", async () => {
    const response = await fetch("http://localhost:3001/health")
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe("ok")
  })
})

describe("Authentication", () => {
  it("should register a new user", async () => {
    const response = await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "testpassword123",
      }),
    })

    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.token).toBeDefined()
    expect(data.user.email).toBe("test@example.com")
  })
})

describe("Rooms", () => {
  it("should fetch all rooms", async () => {
    const response = await fetch("http://localhost:3001/api/rooms")
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })
})

describe("Weather Service", () => {
  it("should return deterministic temperature in test mode", async () => {
    process.env.NODE_ENV = "test"

    const response = await fetch("http://localhost:3001/api/weather/London")
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.temperature).toBe(28)
  })
})
