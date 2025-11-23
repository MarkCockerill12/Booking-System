// packages/frontend/pages/book/[id].tsx
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { AeroCard } from '../../components/AeroCard';
import { useApi } from '../../hooks/useApi';

const BookingPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { callApi } = useApi();
  const [room, setRoom] = useState<any>(null);
  const [status, setStatus] = useState('IDLE');

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
       const rooms = await callApi<any[]>('/search/rooms', 'GET');
       const r = rooms?.find((item) => item.id === id);
       if (r) setRoom(r);
    };
    fetch();
  }, [id, callApi]);

  const handleBook = async () => {
     if(!room) return;
     setStatus('PROCESSING');
     const res = await callApi<any>('/book', 'POST', { 
        roomId: room.id, 
        date: new Date().toISOString(), 
        isBypass: process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' 
     });
     if(res?.status === 'PENDING') setStatus('CONFIRMED');
  };

  if (!room) return null;

  return (
    <div className="xp-background main-layout flex items-center justify-center">
      <AeroCard title="Booking Page" className="max-w-3xl p-8 min-h-[600px]" showUserIcon={true}>
        
        {/* Image X Placeholder - Centered and Large */}
        <div className="flex justify-center mb-8">
            <div className="border-2 border-black h-64 w-3/4 relative bg-white shadow-md">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="2" />
                    <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="2" />
                </svg>
            </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-2 gap-8 mb-12 px-8 text-black font-sans">
            {/* Left Column: Description */}
            <div className="flex flex-col gap-2">
                <p className="text-2xl font-medium">Description</p>
                <p className="text-lg text-gray-700 leading-relaxed">{room.description}</p>
            </div>

            {/* Right Column: Capacity & Location */}
            <div className="flex flex-col gap-6 text-right items-end">
                <div>
                    <p className="text-2xl font-medium">Capacity</p>
                    <p className="text-xl text-gray-700">{room.capacity}</p>
                </div>
                <div>
                    <p className="text-2xl font-medium">Location</p>
                    <p className="text-xl text-gray-700">{room.location}</p>
                </div>
            </div>
        </div>

        {status === 'CONFIRMED' && (
            <div className="text-center text-green-600 font-bold text-xl mb-6 animate-bounce">
                Booking Confirmed!
            </div>
        )}

        {/* Book Button */}
        <div className="flex justify-center pb-4">
            <button 
                onClick={handleBook}
                className="btn-glossy-blue px-16 py-3 text-2xl rounded-full shadow-lg hover:shadow-xl transform transition-all active:scale-95 hover:brightness-110"
            >
                Book Room
            </button>
        </div>
      </AeroCard>
    </div>
  );
};

export default BookingPage;