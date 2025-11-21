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
      // Mock Data for Demo
      setBookings([
        { id: 'B-101', roomName: 'Executive Suite', date: '2025-11-20', status: 'CONFIRMED', price: 120 },
        { id: 'B-102', roomName: 'Focus Pod', date: '2025-12-05', status: 'PENDING', price: 60 }
      ]);
    }
  }, [isOpen]);

  return (
    <div className="relative z-[9999]">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div 
        className="fixed top-0 right-0 h-full w-80 aero-drawer transition-transform duration-300 ease-in-out flex flex-col"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-blue-200/50 bg-white/50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-900">My Bookings</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-600 font-bold text-2xl">×</button>
          </div>
          <p className="text-sm text-gray-600 mt-1 flex items-center">
             <span className="mr-1">👤</span> {user?.username || 'Guest'}
          </p>
        </div>

        {/* List of Bookings (The "Card" Component you wanted) */}
        <div className="p-4 space-y-3 overflow-y-auto flex-grow bg-white/30">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border border-blue-200 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              {/* Decorative blue strip */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
              
              <div className="pl-3">
                <h3 className="font-bold text-blue-900 text-sm">{b.roomName}</h3>
                <p className="text-xs text-gray-500">{b.date}</p>
                <div className="flex justify-between items-center mt-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}>
                    {b.status}
                    </span>
                    <span className="text-sm font-bold text-gray-700">£{b.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-200/50 bg-white/50">
          <button 
            onClick={logout} 
            className="w-full py-2 rounded border border-red-200 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};