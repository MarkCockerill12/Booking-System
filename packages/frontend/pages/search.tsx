// packages/frontend/pages/search.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { AeroCard } from '../components/AeroCard';
import styles from '../styles/AeroTheme.module.css';

interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  price: number;
  description: string;
  imageUrl: string;
}

const SearchPage = () => {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { data, isLoading, error, callApi } = useApi();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Initial data fetch (simulates search for all available rooms)
    const fetchRooms = async () => {
      const fetchedRooms = await callApi<Room[]>('/search/rooms', 'GET');
      if (fetchedRooms) {
        setRooms(fetchedRooms);
      }
    };
    fetchRooms();
  }, [callApi]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call with search term
    const endpoint = `/search/rooms?term=${searchTerm}`;
    const fetchedRooms = await callApi<Room[]>(endpoint, 'GET');
    if (fetchedRooms) {
      setRooms(fetchedRooms);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && rooms.length === 0) return (
    <p className="text-white text-center mt-10">
      Loading available rooms... (Attempting connection to backend)
    </p>
  );

  return (
    <div className="flex flex-col items-center justify-center pt-10">
      <AeroCard title="Search for Rooms" className="max-w-4xl p-8">
        {/* User Icons (Top Right Corner) */}
        <div className="absolute top-2 right-2 flex space-x-2">
          <button className="text-3xl text-yellow-600" onClick={() => { /* Placeholder for Email/Notifications */ }}>
            📧
          </button>
          <button className="text-3xl text-purple-600" onClick={logout}>
            👤
          </button>
        </div>

        {/* Filters Section (WIP Placeholder) */}
        <div className="flex space-x-4 mb-6">
          <button className={`${styles.aeroButton} px-4 py-1 text-sm bg-gray-200 text-gray-700`}>Filters</button>
          <button className={`${styles.aeroButton} px-4 py-1 text-sm bg-gray-200 text-gray-700`}>Capacity</button>
          <button className={`${styles.aeroButton} px-4 py-1 text-sm bg-gray-200 text-gray-700`}>Location</button>
          <button className={`${styles.aeroButton} px-4 py-1 text-sm bg-gray-200 text-gray-700`}>Day</button>
          <button className="text-2xl text-green-600">🌐</button>
        </div>

        {/* Error/Mocking Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {error}
          </div>
        )}

        {/* Room Results Grid */}
        <div className="grid grid-cols-3 gap-6 mt-4">
          {filteredRooms.map((room) => (
            <div 
              key={room.id} 
              className={`${styles.aeroCard} p-4 cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => router.push(`/book/${room.id}`)}
            >
              <div className="h-20 bg-gray-300 mb-2">
                <p className="text-sm p-1">Image Box</p>
              </div>
              <h3 className="font-bold text-lg text-blue-700">{room.name}</h3>
              <p className="text-gray-600">Capacity: {room.capacity}</p>
              <p className="text-gray-600">Location: {room.location}</p>
            </div>
          ))}
        </div>
        
        {filteredRooms.length === 0 && !isLoading && (
          <p className="text-center text-gray-500 mt-8">No rooms found. Try a different search.</p>
        )}
      </AeroCard>
    </div>
  );
};

export default SearchPage;