import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      console.log("📂 [SideMenu] Loading My Bookings...");
      // Mock Data
      setBookings([
        { id: 'B-101', roomName: 'Executive Suite', date: '2025-11-20', status: 'CONFIRMED', price: 120 },
        { id: 'B-102', roomName: 'Focus Pod', date: '2025-12-05', status: 'PENDING', price: 60 }
      ]);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[9999] overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sliding Drawer - From Left */}
      <div 
        className={`absolute top-0 left-0 h-full w-80 border-r border-[#aabccf] transition-transform duration-500 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
            background: 'linear-gradient(to bottom, #f0f8ff 0%, #e6f2ff 100%)',
            boxShadow: '10px 0 30px rgba(0, 0, 0, 0.3)',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-b from-white/80 to-[#dbeeff]/80 border-b border-[#aabccf]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#1e3a8a] drop-shadow-sm font-sans">My Bookings</h2>
            <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-red-600 font-bold text-2xl leading-none transition-colors"
            >
                &times;
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-white/50 p-2 rounded border border-blue-100 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]"></div>
            <span className="font-medium">{user?.email || 'Guest User'}</span>
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-grow">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border border-[#8fbbe3] p-3 rounded-lg shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
              <div className="pl-3">
                  <h3 className="font-bold text-[#0f4c81] text-sm group-hover:text-blue-600 transition-colors">{b.roomName}</h3>
                  <p className="text-xs text-gray-500 mb-2">{b.date}</p>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm ${
                        b.status === 'CONFIRMED' 
                        ? 'bg-gradient-to-b from-green-50 to-green-100 text-green-700 border-green-300' 
                        : 'bg-gradient-to-b from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-300'
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
        <div className="p-4 bg-[#eef6ff] border-t border-[#aabccf]">
          <button 
            onClick={logout} 
            className="w-full py-2 rounded-md border border-red-300 bg-gradient-to-b from-red-50 to-red-100 text-red-600 font-bold hover:from-red-100 hover:to-red-200 transition-all shadow-sm active:translate-y-[1px]"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};