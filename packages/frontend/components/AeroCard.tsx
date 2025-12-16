// packages/frontend/components/AeroCard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { SideMenu } from './SideMenu';
import { animate } from 'animejs';

interface AeroCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  showUserIcon?: boolean;
  padding?: boolean;
}

export const AeroCard: React.FC<AeroCardProps> = ({ children, className = '', title, showUserIcon = false, padding = true }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance Animation
    if (cardRef.current) {
      animate(cardRef.current, {
        opacity: [0, 1],
        scale: [0.95, 1],
        translateY: [20, 0],
        easing: 'easeOutExpo',
        duration: 800,
        delay: 100
      });
    }
  }, []);

  return (
    <>
      <div ref={cardRef} className={`aero-glass p-0 w-full max-w-4xl mx-auto ${className} relative opacity-0`}>
        
        {/* Icons positioned at top right of card */}
        {showUserIcon && (
            <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 9999, display: 'flex', gap: '8px', padding: '16px' }}>
                {/* Bookings Icon*/}
                <button 
                    onClick={() => setMenuOpen(true)}
                    className="hover:brightness-110 active:translate-y-[1px] transition-all bg-transparent border-0 p-0"
                    title="My Bookings"
                >
                    <img 
                        src="/Aero Circle 9.png" 
                        alt="My Bookings" 
                        style={{ width: '65px', height: '65px' }}
                        className="drop-shadow-sm"
                    />
                </button>
                
                {/* Account Icon*/}
                <button 
                    className="hover:brightness-110 active:translate-y-[1px] transition-all bg-transparent border-0 p-0"
                    title="Account"
                >
                    <img 
                        src="/Aero Circle 10.png" 
                        alt="Account" 
                        style={{ width: '65px', height: '65px' }}
                        className="drop-shadow-sm"
                    />
                </button>
            </div>
        )}
        
        {/* Header Row: Title Left */}
        <div className="flex justify-between items-center p-3 px-4 border-b border-gray-400/50 z-20 relative bg-gradient-to-r from-transparent via-white/20 to-transparent">
            <div className="flex items-center gap-3">
                
                {title && (
                    <h1 className="text-lg font-bold text-black/80 drop-shadow-sm font-sans ml-2">
                        {title}
                    </h1>
                )}
            </div>
        </div>
        
        <div className={`aero-content relative z-10 ${padding ? 'p-6' : ''}`}>
            {children}
        </div>
      </div>

      {/* Side Menu rendered outside card as portal to body */}
      {showUserIcon && (
        <SideMenu isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
};