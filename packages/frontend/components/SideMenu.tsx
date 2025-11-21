// packages/frontend/components/SideMenu.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setBookings([
        { id: 'B-101', roomName: 'Executive Suite', date: '2025-11-20', status: 'CONFIRMED', price: 120 },
        { id: 'B-102', roomName: 'Focus Pod', date: '2025-12-05', status: 'PENDING', price: 60 }
      ]);
    }
  }, [isOpen]);

  return (
    <div className="relative z-[100]">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel - Forced inline style for reliability */}
      <div 
        className="fixed top-0 right-0 h-full w-80 bg-white/90 border-l border-white shadow-2xl transition-transform duration-300 ease-out backdrop-blur-md"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="p-4 border-b border-gray-300 bg-gradient-to-b from-white to-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">My Bookings</h2>
            <button onClick={onClose} className="font-bold text-gray-500 hover:text-red-600 px-2">X</button>
          </div>
          <div className="flex items-center mt-2 text-sm text-gray-600">
             <span className="mr-2">👤</span> {user?.email || 'Guest'}
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border border-gray-300 p-3 rounded shadow-sm">
              <h3 className="font-bold text-blue-900">{b.roomName}</h3>
              <div className="flex justify-between text-sm mt-1">
                <span>{b.date}</span>
                <span className="font-bold">£{b.price}</span>
              </div>
              <div className={`text-xs mt-1 font-bold ${b.status === 'CONFIRMED' ? 'text-green-600' : 'text-yellow-600'}`}>
                {b.status}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-300 bg-gray-50">
           <button onClick={logout} className="w-full py-1 px-3 bg-gray-200 border border-gray-400 rounded hover:bg-gray-300 shadow-sm text-sm">
             Sign Out
           </button>
           <button onClick={onClose} className="w-full mt-2 py-1 px-3 bg-gray-200 border border-gray-400 rounded hover:bg-gray-300 shadow-sm text-sm">
             Close
           </button>
        </div>
      </div>
    </div>
  );
};