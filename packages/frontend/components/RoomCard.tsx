// packages/frontend/components/RoomCard.tsx
import React from 'react';
import { useRouter } from 'next/router';

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    capacity: number;
    location: string;
    price: number;
    description: string;
  };
}

export const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const router = useRouter();

  return (
    <div 
      className="bg-gradient-to-b from-[#ffffff] to-[#e0e0e0] border border-[#a0a0a0] p-3 rounded-xl shadow-md hover:shadow-2xl cursor-pointer flex flex-col h-full transition-all duration-300 hover:-translate-y-2 group"
      onClick={() => router.push(`/book/${room.id}`)}
    >
      {/* Image Box with X */}
      <div className="relative w-full h-32 mb-3 bg-white border border-gray-400 overflow-hidden shadow-inner">
          <svg className="absolute inset-0 w-full h-full text-gray-800" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
              <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1" />
          </svg>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1 text-lg font-sans text-black pl-1">
          <div className="font-medium text-gray-800">Capacity: {room.capacity}</div>
          <div className="font-medium truncate text-gray-900" title={room.description || room.name}>{room.description || room.name}</div>
          <div className="font-medium text-gray-700">Location: {room.location}</div>
      </div>
    </div>
  );
};