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
    <div className="xp-background flex flex-col items-center justify-center pt-10">
      <AeroCard title="Booking Page" className="max-w-lg p-8" showUserIcon={true}>
        
        {/* Image X Placeholder */}
        <div className="border border-black h-48 mb-6 relative bg-white">
           <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
              <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="1" />
           </svg>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-black">
            <div className="col-span-2">
                <p className="text-sm font-bold">Description</p>
                <p className="text-sm">{room.description}</p>
            </div>
            <div>
                <p className="text-sm font-bold">Capacity</p>
                <p className="text-sm">{room.capacity}</p>
            </div>
            <div className="text-right">
                 <p className="text-sm font-bold">Location</p>
                 <p className="text-sm">{room.location}</p>
            </div>
        </div>

        {status === 'CONFIRMED' && <div className="text-center text-green-600 font-bold mb-4">Booking Confirmed!</div>}

        <div className="flex justify-center">
            <button 
                onClick={handleBook}
                className="bg-gradient-to-b from-[#5ba1ea] to-[#1b5ea6] text-white font-bold py-2 px-8 rounded-full border border-[#134a88] shadow-md active:translate-y-1"
            >
                Book Room
            </button>
        </div>
      </AeroCard>
    </div>
  );
};

export default BookingPage;