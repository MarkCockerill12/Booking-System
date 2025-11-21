import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export const useApi = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FIX: useCallback ensures this function reference stays stable
  const callApi = useCallback(async <T>(endpoint: string, method: 'GET' | 'POST' = 'GET', payload?: any): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    const url = `${API_URL}${endpoint}`;
    
    try {
      const response = await axios({
        url,
        method,
        data: payload,
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      setData(response.data);
      setIsLoading(false);
      return response.data as T;

    } catch (e) {
      const axiosError = e as AxiosError;
      // Network Error / Offline handling
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ERR_NETWORK') {
        console.warn(`Backend Service Offline (${endpoint}). Returning mock data.`);
        setIsLoading(false);
        if (endpoint.includes('/search')) return MOCK_ROOM_DATA as unknown as T;
        if (endpoint.includes('/book')) return MOCK_BOOKING_RESPONSE as unknown as T;
        return null; 
      }
      
      setError(`API Error: ${axiosError.message}`);
      setIsLoading(false);
      return null;
    }
  }, []); // Empty dependency array = stable function

  return { data, isLoading, error, callApi };
};