// Force Port 3000 for local development to hit AWS SAM
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // Ensure we don't have double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  console.log(`📡 Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check if we got HTML back (common error when hitting frontend instead of backend)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const text = await response.text();
      console.error('❌ API Error: Received HTML instead of JSON.', text.substring(0, 100));
      throw new Error(`API returned HTML instead of JSON. Check NEXT_PUBLIC_API_URL is pointing to Port 3000.`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorBody}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    return response.json();
  } catch (error) {
    console.error(`❌ Fetch failed for ${url}:`, error);
    throw error;
  }
}

// Legacy compatibility wrapper
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return fetchAPI(endpoint, options);
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
  getAll: async (filters?: { capacity?: number; location?: string; available?: boolean; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams()
    if (filters?.capacity) params.append("capacity", filters.capacity.toString())
    if (filters?.location) params.append("location", filters.location)
    if (filters?.available !== undefined) params.append("available", filters.available.toString())
    if (filters?.startDate) params.append("startDate", filters.startDate)
    if (filters?.endDate) params.append("endDate", filters.endDate)

    const query = params.toString()
    const endpoint = query ? `/rooms?${query}` : "/rooms"
    const response = await apiRequest(endpoint)
    
    // Map backend room_id to frontend id
    if (response.success && response.data?.rooms) {
      response.data.rooms = response.data.rooms.map((room: any) => ({
        ...room,
        id: room.room_id || room.id
      }))
    }
    return response
  },

  getById: async (id: string, date?: string) => {
    const params = date ? `?date=${date}` : ""
    const response = await apiRequest(`/rooms/${id}${params}`)
    
    // Map backend room_id to frontend id
    if (response.success && response.data?.room) {
      response.data.room = {
        ...response.data.room,
        id: response.data.room.room_id || response.data.room.id
      }
    }
    return response
  },
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

  updateStatus: (id: string, status: "confirmed" | "cancelled" | "CANCELLED") =>
    apiRequest(`/bookings/${id}`, {
      method: "PUT",
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
