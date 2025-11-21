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
      // Mock Data
      setBookings([
        { id: 'B-101', roomName: 'Executive Suite', date: '2025-11-20', status: 'CONFIRMED', price: 120 },
        { id: 'B-102', roomName: 'Focus Pod', date: '2025-12-05', status: 'PENDING', price: 60 }
      ]);
    }
  }, [isOpen]);

  return (
    <div className="relative z-50">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 aero-drawer transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-blue-200/50 bg-white/30">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-900">My Bookings</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-600 font-bold text-2xl">×</button>
          </div>
          <p className="text-sm text-gray-600 mt-1">User: {user?.username || 'Guest'}</p>
        </div>

        {/* List */}
        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-130px)]">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white/70 border border-white/80 p-3 rounded-md shadow-sm">
              <h3 className="font-bold text-blue-800 text-sm">{b.roomName}</h3>
              <p className="text-xs text-gray-600">{b.date}</p>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  b.status === 'CONFIRMED' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {b.status}
                </span>
                <span className="text-sm font-bold">£{b.price}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-blue-200/50 bg-white/30">
          <button 
            onClick={logout} 
            className="w-full py-2 rounded-md bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};