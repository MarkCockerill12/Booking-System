// packages/frontend/pages/search.tsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { AeroCard } from '../components/AeroCard';
import { RoomCard } from '../components/RoomCard';
import { AeroButton } from '../components/ui/AeroButton';
import { animate, stagger } from 'animejs';

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
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Staggered animation for room cards when they load or change
  useEffect(() => {
    if (gridRef.current && rooms.length > 0) {
      animate(gridRef.current.children, {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(100),
        easing: 'spring(1, 80, 10, 0)',
        duration: 800
      });
    }
  }, [rooms, location]);

  const filteredRooms = rooms.filter(r => location === 'All' || r.location.includes(location));

  return (
    <div className="xp-background main-layout">
      <AeroCard title="Search for Rooms" showUserIcon={true} className="max-w-6xl w-full">
        
        {/* Filters Bar */}
        <div className="flex items-center gap-3 mb-2 mt-2">
            <button className="px-4 py-1 bg-gradient-to-b from-[#fcfcfc] to-[#e0e0e0] border border-[#707070] rounded-lg text-sm font-medium text-black shadow-sm hover:brightness-105 active:translate-y-[1px]">Filters</button>
            <button className="px-4 py-1 bg-gradient-to-b from-[#fcfcfc] to-[#e0e0e0] border border-[#707070] rounded-lg text-sm font-medium text-black shadow-sm hover:brightness-105 active:translate-y-[1px]">Capacity</button>
            
            {/* Location Filter (Styled as button) */}
            <div className="relative">
                <select 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="appearance-none pl-4 pr-8 py-1 bg-gradient-to-b from-[#fcfcfc] to-[#e0e0e0] border border-[#707070] rounded-lg text-sm font-medium text-black shadow-sm cursor-pointer hover:brightness-105 active:translate-y-[1px] outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                    <option value="All">Location</option>
                    <option value="Dundee">Dundee</option>
                    <option value="Glasgow">Glasgow</option>
                </select>
                {/* Custom Arrow */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-xs text-gray-600">▼</div>
            </div>

            <button className="px-4 py-1 bg-gradient-to-b from-[#fcfcfc] to-[#e0e0e0] border border-[#707070] rounded-lg text-sm font-medium text-black shadow-sm hover:brightness-105 active:translate-y-[1px]">Day</button>
            
        </div>

        {/* Divider Line */}
        <div className="h-1.5 w-full bg-gray-400/50 rounded-full mb-6 shadow-inner"></div>

        {/* Grid Results */}
        {isLoading ? (
             <div className="text-center text-black py-10 text-xl flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Loading...
             </div>
        ) : (
            <div 
                ref={gridRef}
                className="grid gap-6 px-2 pb-4"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%' }}
            >
                {filteredRooms.map((room) => (
                    <div key={room.id} className="opacity-0"> {/* Wrapper for animation initial state */}
                        <RoomCard room={room} />
                    </div>
                ))}
            </div>
        )}
      </AeroCard>
    </div>
  );
};

export default SearchPage;