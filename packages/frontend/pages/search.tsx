// packages/frontend/pages/search.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { AeroCard } from '../components/AeroCard';
import { RoomCard } from '../components/RoomCard';

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

  // Frutiger Aero / Windows Button Style
  const btnClass = "px-4 py-1 bg-gradient-to-b from-[#fcfcfc] to-[#e0e0e0] border border-[#707070] rounded-lg text-sm font-medium text-black shadow-sm cursor-pointer hover:brightness-105 active:translate-y-[1px] select-none";

  return (
    <div className="xp-background main-layout">
      <AeroCard title="Search for Rooms" showUserIcon={true} className="max-w-6xl w-full">
        
        {/* Filters Bar */}
        <div className="flex items-center gap-3 mb-2 mt-2">
            <button className={btnClass}>Filters</button>
            <button className={btnClass}>Capacity</button>
            
            {/* Location Filter (Styled as button) */}
            <div className="relative">
                <select 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`${btnClass} appearance-none pr-8 outline-none`}
                >
                    <option value="All">Location</option>
                    <option value="Dundee">Dundee</option>
                    <option value="Glasgow">Glasgow</option>
                </select>
                {/* Custom Arrow */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-xs text-gray-600">▼</div>
            </div>

            <button className={btnClass}>Day</button>
            
            {/* Globe Icon with Magnifying Glass */}
            <div className="ml-2 relative">
                <span className="text-3xl filter drop-shadow-sm">🌍</span>
                <span className="text-xl absolute -bottom-1 -right-1 transform -scale-x-100">🔍</span>
            </div>
        </div>

        {/* Divider Line */}
        <div className="h-1.5 w-full bg-gray-400/50 rounded-full mb-6 shadow-inner"></div>

        {/* Grid Results */}
        {isLoading ? (
             <div className="text-center text-black py-10 text-xl">Loading...</div>
        ) : (
            <div 
                className="grid gap-6 px-2 pb-4"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%' }}
            >
                {filteredRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                ))}
            </div>
        )}
      </AeroCard>
    </div>
  );
};

export default SearchPage;