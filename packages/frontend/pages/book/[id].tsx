// packages/frontend/pages/book/[id].tsx
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { AeroCard } from '../../components/AeroCard';
import { useApi } from '../../hooks/useApi';
import { AeroButton } from '../../components/ui/AeroButton';
import { createTimeline, stagger } from 'animejs';

const BookingPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { callApi } = useApi();
  const [room, setRoom] = useState<any>(null);
  const [status, setStatus] = useState('IDLE');

  // Refs for animation
  const imageRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
       const rooms = await callApi<any[]>('/search/rooms', 'GET');
       const r = rooms?.find((item) => item.id === id);
       if (r) setRoom(r);
    };
    fetch();
  }, [id, callApi]);

  // Entrance Animation
  useEffect(() => {
    if (room) {
        const timeline = createTimeline({
            duration: 800
        });

        timeline
        .add(imageRef.current, {
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 800
        })
        .add(infoRef.current?.children, {
            translateY: [20, 0],
            opacity: [0, 1],
            delay: stagger(100)
        }, '-=600')
        .add(buttonRef.current, {
            translateY: [20, 0],
            opacity: [0, 1]
        }, '-=400');
    }
  }, [room]);

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
        <div ref={imageRef} className="flex justify-center mb-8 opacity-0">
            <div className="border-2 border-black h-64 w-3/4 relative bg-white shadow-md">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="2" />
                    <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="2" />
                </svg>
            </div>
        </div>

        {/* Info Section */}
        <div ref={infoRef} className="grid grid-cols-2 gap-8 mb-12 px-8 text-black font-sans">
            {/* Left Column: Description */}
            <div className="flex flex-col gap-2 opacity-0">
                <p className="text-2xl font-medium">Description</p>
                <p className="text-lg text-gray-700 leading-relaxed">{room.description}</p>
            </div>

            {/* Right Column: Capacity & Location */}
            <div className="flex flex-col gap-6 text-right items-end opacity-0">
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
        <div ref={buttonRef} className="flex justify-center pb-4 opacity-0">
            <AeroButton 
                onClick={handleBook}
                variant="blue"
                className="px-16 py-3 text-2xl rounded-full"
            >
                Book Room
            </AeroButton>
        </div>
      </AeroCard>
    </div>
  );
};

export default BookingPage;