// packages/frontend/hooks/useApi.ts
import { useState } from 'react';
import axios, { AxiosError } from 'axios';

// Get the API Gateway URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/prod';

// --- MOCK DATA ---
// Mock data structure to handle when the backend is offline
const MOCK_ROOM_DATA = [
  { id: 'R1', name: 'Executive Suite', capacity: 10, location: 'Dundee HQ', price: 120, description: 'High-end meeting space.', imageUrl: '/room-placeholder.jpg' },
  { id: 'R2', name: 'Focus Pod', capacity: 4, location: 'Glasgow Office', price: 60, description: 'Small, quiet collaboration pod.', imageUrl: '/room-placeholder.jpg' },
];

const MOCK_BOOKING_RESPONSE = {
  bookingId: "mock-12345",
  status: "PENDING",
  message: "Mock booking initiated. Waiting for payment simulation...",
  totalPrice: 130
};
// -----------------

export const useApi = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = async <T>(endpoint: string, method: 'GET' | 'POST' = 'GET', payload?: any): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    const url = `${API_URL}${endpoint}`;
    
    // --- MOCKING/ERROR HANDLING CORE ---
    try {
      const response = await axios({
        url,
        method,
        data: payload,
        headers: {
          // Add auth token here in real implementation: 'Authorization': `Bearer ${token}`
          'Content-Type': 'application/json',
        },
        timeout: 5000, // Timeout after 5 seconds to catch offline services quickly
      });

      setData(response.data);
      setIsLoading(false);
      return response.data as T;

    } catch (e) {
      const axiosError = e as AxiosError;
      
      // If a network error or timeout occurs (microservice is likely offline)
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ERR_NETWORK') {
        setError(`Backend Service Offline. Returning mock data for demo. (Error: ${axiosError.code})`);
        setIsLoading(false);
        
        // Return appropriate mock data based on the endpoint
        if (endpoint.startsWith('/search')) return MOCK_ROOM_DATA as T;
        if (endpoint.startsWith('/book')) return MOCK_BOOKING_RESPONSE as T;
        
        // Fallback for other endpoints
        return null; 
      }
      
      // Handle actual API errors (e.g., 404, 500 from the microservice)
      setError(`API Error: ${axiosError.message}`);
      setIsLoading(false);
      return null;
    }
  };

  return { data, isLoading, error, callApi };
};