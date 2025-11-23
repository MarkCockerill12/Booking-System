// packages/frontend/components/AeroCard.tsx
import React, { useState } from 'react';
import { SideMenu } from './SideMenu';

interface AeroCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  showUserIcon?: boolean;
  padding?: boolean;
}

export const AeroCard: React.FC<AeroCardProps> = ({ children, className = '', title, showUserIcon = false, padding = true }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className={`aero-glass p-0 w-full max-w-4xl mx-auto ${className} relative`}>
        
        {/* Header Row: Title Left | Icons Right */}
        {(title || showUserIcon) && (
            <div className="flex justify-between items-start p-6 pb-2 border-b border-gray-400/50 z-20 relative">
                {title ? (
                    <h1 className="text-2xl font-bold text-black drop-shadow-sm font-sans">
                        {title}
                    </h1>
                ) : <div></div>}

                {showUserIcon && (
                    <div className="flex gap-2">
                        {/* Mail Icon (Yellow/Greenish in wireframe) */}
                        <button 
                            className="w-8 h-8 rounded-full bg-gradient-to-b from-[#e6f0a3] to-[#d2e638] border border-[#99a626] shadow-md flex items-center justify-center hover:brightness-110 active:translate-y-[1px]"
                            title="Messages"
                        >
                            <span className="text-sm">✉️</span>
                        </button>
                        
                        {/* User Icon (Purple in wireframe) */}
                        <button 
                            onClick={() => setMenuOpen(true)}
                            className="w-8 h-8 rounded-full bg-gradient-to-b from-[#eebcfc] to-[#d363f5] border border-[#9c26b0] shadow-md flex items-center justify-center hover:brightness-110 active:translate-y-[1px]"
                            title="My Bookings"
                        >
                            <span className="text-sm">👤</span>
                        </button>
                    </div>
                )}
            </div>
        )}
        
        <div className={`aero-content relative z-10 ${padding ? 'p-6' : ''}`}>
            {children}
        </div>

        {/* Side Menu inside the card - Only render if user icon is enabled */}
        {showUserIcon && (
            <SideMenu isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
        )}
      </div>
    </>
  );
};