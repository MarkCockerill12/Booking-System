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
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { isLoading, error, callApi } = useApi();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [location, setLocation] = useState('All');
  
  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchRooms = async () => {
      const fetchedRooms = await callApi<Room[]>('/search/rooms', 'GET');
      if (fetchedRooms) setRooms(fetchedRooms);
    };
    fetchRooms();
  }, [callApi]); // callApi is now stable

  const filteredRooms = rooms.filter(r => location === 'All' || r.location.includes(location));

  return (
    <div className="xp-background flex flex-col items-center justify-center pt-10">
      <AeroCard title="Search for Rooms" className="max-w-5xl p-6" showUserIcon={true}>
        
        {/* Filters Bar - Wireframe Style */}
        <div className="flex space-x-2 mb-6 border-b border-gray-300 pb-4">
            <div className="bg-gradient-to-b from-white to-gray-200 border border-gray-400 rounded-full px-4 py-1 text-sm shadow-sm font-bold text-gray-700 cursor-default">
                Filters
            </div>
            <div className="bg-gradient-to-b from-white to-gray-200 border border-gray-400 rounded-full px-4 py-1 text-sm shadow-sm font-bold text-gray-700 cursor-default">
                Capacity
            </div>
            {/* Interactive Location Filter */}
            <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-gradient-to-b from-white to-gray-200 border border-gray-400 rounded-full px-4 py-1 text-sm shadow-sm font-bold text-blue-900 outline-none"
            >
                <option value="All">Location: All</option>
                <option value="Dundee">Location: Dundee</option>
                <option value="Glasgow">Location: Glasgow</option>
            </select>
            <div className="bg-gradient-to-b from-white to-gray-200 border border-gray-400 rounded-full px-4 py-1 text-sm shadow-sm font-bold text-gray-700 cursor-default">
                Day
            </div>
            <div className="ml-auto text-2xl">🌐</div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div 
                key={room.id} 
                className="bg-white border border-gray-400 p-3 rounded-lg shadow-md cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => router.push(`/book/${room.id}`)}
              >
                {/* Wireframe 'X' Image Placeholder */}
                <div className="border border-black h-32 mb-2 relative bg-white overflow-hidden">
                   <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
                      <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="1" />
                   </svg>
                   <span className="absolute top-1 left-1 text-xs bg-white px-1">Image Box</span>
                </div>
                
                {/* Room Text */}
                <h3 className="font-bold text-black mb-1">{room.name}</h3>
                <div className="text-sm text-black space-y-1">
                    <p>Capacity: {room.capacity}</p>
                    <p>Description: {room.description}</p>
                    <p>Location: {room.location}</p>
                </div>
              </div>
            ))}
        </div>
      </AeroCard>
    </div>
  );
};

export default SearchPage;