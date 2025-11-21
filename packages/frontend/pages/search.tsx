// packages/frontend/pages/search.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { AeroCard } from '../components/AeroCard';

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
  }, [callApi]);

  const filteredRooms = rooms.filter(r => location === 'All' || r.location.includes(location));

  return (
    <div className="xp-background flex flex-col items-center justify-center pt-10">
      <AeroCard title="Search for Rooms" className="max-w-5xl p-6" showUserIcon={true}>
        
        {/* --- Filters Bar (Wireframe Match) --- */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/40 pb-4">
            {/* Passive Buttons (Decoration per wireframe) */}
            <div className="px-4 py-1 bg-gradient-to-b from-gray-50 to-gray-200 border border-gray-400 rounded-full text-xs font-bold text-gray-600 shadow-sm select-none">
                Filters
            </div>
            <div className="px-4 py-1 bg-gradient-to-b from-gray-50 to-gray-200 border border-gray-400 rounded-full text-xs font-bold text-gray-600 shadow-sm select-none">
                Capacity
            </div>
            
            {/* Active Dropdown */}
            <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="px-4 py-1 bg-gradient-to-b from-white to-gray-100 border border-blue-300 rounded-full text-xs font-bold text-blue-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
            >
                <option value="All">Location: All</option>
                <option value="Dundee">Location: Dundee</option>
                <option value="Glasgow">Location: Glasgow</option>
            </select>

            <div className="px-4 py-1 bg-gradient-to-b from-gray-50 to-gray-200 border border-gray-400 rounded-full text-xs font-bold text-gray-600 shadow-sm select-none">
                Day
            </div>
        </div>

        {/* --- Room Grid --- */}
        {isLoading ? (
             <div className="text-center text-blue-800 font-bold py-10">Loading Rooms...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => (
                <div 
                    key={room.id} 
                    className="bg-white border border-gray-300 p-3 rounded-lg shadow-md hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer group"
                    onClick={() => router.push(`/book/${room.id}`)}
                >
                    {/* Image Placeholder with 'X' */}
                    <div className="relative w-full h-32 mb-3 bg-white border border-gray-400 overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full text-gray-300" preserveAspectRatio="none">
                            <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
                            <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1" />
                        </svg>
                        <span className="absolute top-1 left-1 bg-white/90 px-1 text-[10px] border border-gray-300">Image Box</span>
                    </div>
                    
                    {/* Room Details */}
                    <h3 className="font-bold text-black text-lg mb-1">{room.name}</h3>
                    <div className="text-sm text-gray-700 space-y-1">
                        <p>Capacity: {room.capacity}</p>
                        <p>Location: {room.location}</p>
                    </div>
                </div>
                ))}
            </div>
        )}
        
      </AeroCard>
    </div>
  );
};

export default SearchPage;