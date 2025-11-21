import { useRouter } from 'next/router';
import { AeroCard } from '../components/AeroCard';

const LandingPage = () => {
  const router = useRouter();

  return (
    <div className="xp-background flex flex-col items-center justify-center min-h-screen">
      
      {/* Main Container - centered and glossy */}
      <AeroCard className="max-w-3xl text-center p-12" showUserIcon={false}>
        
        {/* Title Section */}
        <h1 className="text-5xl font-extrabold mb-2 text-blue-700 drop-shadow-sm flex items-center justify-center gap-3 font-sans">
          <span>📅</span>
          <span className="tracking-tight" style={{ textShadow: '0px 2px 2px rgba(255,255,255,0.8)' }}>
            Booking System
          </span>
          <span>🌐</span>
        </h1>

        <div className="my-8 flex flex-col items-center">
            {/* Glossy Globe Graphic (CSS-only representation of the wireframe globe) */}
            <div className="w-40 h-40 bg-gradient-to-br from-[#267cc9] to-[#004e8c] rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.4),inset_0_2px_5px_rgba(255,255,255,0.5)] border-4 border-white/40 flex items-center justify-center relative overflow-hidden mb-6 group cursor-default transition-transform hover:scale-105">
                {/* Shine/Gloss effect on the globe */}
                <div className="absolute top-0 left-2 right-2 h-[45%] bg-gradient-to-b from-white/90 to-transparent rounded-t-full opacity-80 pointer-events-none"></div>
                {/* World Map Icon */}
                <span className="text-7xl text-white/90 drop-shadow-md z-10 filter group-hover:brightness-110">🌍</span>
            </div>
            
            <p className="text-2xl text-gray-700 font-medium mb-2">
              Join our worldwide conference room booking system
            </p>
            <p className="text-sm text-gray-500">
              Professional • Global • Connected
            </p>
        </div>

        {/* Action Button - Matches the 'Green Pill' from wireframe */}
        <button 
          className="btn-glossy-green px-16 py-4 text-xl rounded-full shadow-xl transform transition-all active:scale-95 hover:brightness-110 active:shadow-inner" 
          onClick={() => router.push('/login')}
        >
          Get Started
        </button>

      </AeroCard>

      {/* Footer Copyright - Typical of the era */}
      <div className="fixed bottom-4 text-white/80 text-xs font-sans text-shadow-sm">
        © 2025 Conference Corp. All rights reserved.
      </div>
    </div>
  );
};

export default LandingPage;