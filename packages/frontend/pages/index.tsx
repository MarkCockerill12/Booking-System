import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { AeroCard } from '../components/AeroCard';
import { AeroButton } from '../components/ui/AeroButton';
import { animate, stagger } from 'animejs';

const LandingPage = () => {
  const router = useRouter();
  const globeRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Floating Globe Animation
    if (globeRef.current) {
      animate(globeRef.current, {
        translateY: [-10, 10],
        rotate: [0, 2],
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
        duration: 3000
      });
    }

    // Text Entrance
    if (textRef.current) {
      animate(textRef.current.children, {
        opacity: [0, 1],
        translateX: [20, 0],
        delay: stagger(100, { start: 500 }),
        easing: 'easeOutQuad'
      });
    }
  }, []);

  return (
    <div className="xp-background main-layout flex flex-col items-center justify-center min-h-screen">
      
      <AeroCard className="max-w-6xl p-0 overflow-hidden relative" showUserIcon={false} padding={false}>
        
        {/* Info Icon (Top Right) */}
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px' }}>
            <button className="hover:brightness-110 active:translate-y-1 transition-all bg-transparent border-0 p-0">
              <img 
                                src="/image 4.png" 
                                alt="info" 
                                style={{ height: '48px', width: 'auto' }}
                                className="drop-shadow-lg"
                            />
            </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
            
            {/* HEADER SECTION: Spanning full width */}
            <div className="w-full pt-4 pb-2 text-center z-10">
                <div className="flex items-center justify-center gap-4">
                    <span className="text-5xl filter drop-shadow-md transform -rotate-12">📅</span>
                    <h1 className="text-6xl font-extrabold text-[#5f9ea0] tracking-tight font-sans drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)', display: 'inline', whiteSpace: 'nowrap' }}>Booking System</h1>
                    <span className="text-5xl filter drop-shadow-md transform rotate-12">📋</span>
                </div>
            </div>

            {/* CONTENT ROW */}
            <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', alignItems: 'center' }}>
                
                {/* LEFT COLUMN: The Image (Globe & People) */}
                <div 
                    style={{ flex: '1 1 50%', maxWidth: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative', height: '100%' }}
                >
                    <img 
                        ref={globeRef}
                        src="/globe-people.png" 
                        alt="World Map with Users" 
                        style={{ maxWidth: '300px', width: '100%', height: 'auto' }}
                        className="object-contain drop-shadow-2xl"
                    />
                </div>

                {/* RIGHT COLUMN: Text & Actions */}
                <div 
                    ref={textRef}
                    style={{ flex: '1 1 50%', maxWidth: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1.5rem', height: '100%', position: 'relative' }}
                >
                    
                    {/* Main Text */}
                    <div className="mb-6 pr-4 text-left">
                        <p className="text-4xl text-black font-medium leading-tight mb-6" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                            Join our worldwide conference room booking system
                        </p>
                        <p className="text-xl text-gray-600 font-sans">
                            Connect, Collaborate, and Schedule with the ease of Frutiger Aero.
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="text-left">
                        <button
                            onClick={() => router.push('/login')}
                            className="hover:brightness-110 active:translate-y-1 transition-all duration-150 bg-transparent border-0 p-0"
                        >
                            <img 
                                src="/Skeumorphic Button 01.png" 
                                alt="Get Started" 
                                style={{ height: '48px', width: 'auto' }}
                                className="drop-shadow-lg"
                            />
                        </button>
                    </div>

                </div>
            </div>
        </div>

      </AeroCard>

      <div className="fixed bottom-4 text-white/90 text-sm font-bold font-sans drop-shadow-md tracking-wide">
        © 2025 Conference Corp.
      </div>
    </div>
  );
};

export default LandingPage;