import React, { useState } from 'react';
import { SideMenu } from './SideMenu';

interface AeroCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  showUserIcon?: boolean;
}

export const AeroCard: React.FC<AeroCardProps> = ({ children, className = '', title, showUserIcon = false }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className={`aero-glass p-8 w-full max-w-3xl mx-auto ${className}`}>
        
        {showUserIcon && (
          <button 
            onClick={() => setMenuOpen(true)}
            className="absolute top-4 right-4 text-3xl hover:scale-110 transition-transform z-20"
            title="My Bookings"
          >
            👤
          </button>
        )}

        {title && (
          <h1 className="text-3xl font-bold mb-6 text-blue-900 border-b border-white/60 pb-3 drop-shadow-sm">
            {title}
          </h1>
        )}
        
        <div className="relative z-10">
            {children}
        </div>
      </div>

      <SideMenu isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};