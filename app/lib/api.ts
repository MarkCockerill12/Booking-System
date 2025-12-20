const API_URL = "/api" // Next.js API routes are relative

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Include cookies for auth
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "Request failed")
  }

  return data
}

// Auth API
export const authAPI = {
  signup: (email: string, password: string, name: string) =>
    apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiRequest("/auth/logout", {
      method: "POST",
    }),

  getCurrentUser: () => apiRequest("/auth/me"),
}

// Rooms API
export const roomsAPI = {
  getAll: (filters?: { capacity?: number; location?: string; available?: boolean }) => {
    const params = new URLSearchParams()
    if (filters?.capacity) params.append("capacity", filters.capacity.toString())
    if (filters?.location) params.append("location", filters.location)
    if (filters?.available !== undefined) params.append("available", filters.available.toString())

    const query = params.toString()
    return apiRequest(`/rooms${query ? `?${query}` : ""}`)
  },

  getById: (id: string) => apiRequest(`/rooms/${id}`),
}

// Bookings API
export const bookingsAPI = {
  create: (roomId: string, startTime: string, endTime: string) =>
    apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        startTime,
        endTime,
      }),
    }),

  getUserBookings: () => apiRequest("/bookings"),

  getById: (id: string) => apiRequest(`/bookings/${id}`),

  updateStatus: (id: string, status: "confirmed" | "cancelled") =>
    apiRequest(`/bookings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
}

// Weather API
export const weatherAPI = {
  getByLocation: (location: string, date?: string) => {
    const params = new URLSearchParams({ location })
    if (date) params.append("date", date)
    return apiRequest(`/weather?${params.toString()}`)
  },
}
