import { useRouter } from 'next/router';
import { AeroCard } from '../components/AeroCard';

const LandingPage = () => {
  const router = useRouter();

  return (
    <div className="xp-background main-layout flex flex-col items-center justify-center min-h-screen">
      
      {/* 1. Increased width to 'max-w-6xl' to take up more screen space.
        2. Removed 'title' prop so the "booking thing" header bar is gone.
      */}
      <AeroCard className="max-w-6xl p-0 overflow-hidden relative" showUserIcon={false} padding={false}>
        
        {/* Info Icon (Top Right) */}
        <div className="absolute top-4 right-4 z-20">
            <button className="text-blue-600 hover:text-blue-800 transition-colors drop-shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            </button>
        </div>

        <div className="flex flex-col h-full min-h-[500px]">
            
            {/* HEADER SECTION: Spanning full width */}
            <div className="w-full pt-8 pb-4 text-center z-10">
                <div className="flex items-center justify-center gap-4">
                    <span className="text-5xl filter drop-shadow-md transform -rotate-12">📅</span>
                    <h1 className="text-6xl font-extrabold text-[#5f9ea0] tracking-tight font-sans drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                        Booking System
                    </h1>
                    <span className="text-5xl filter drop-shadow-md transform rotate-12">📋</span>
                </div>
            </div>

            {/* CONTENT ROW */}
            <div 
                className="flex flex-row w-full h-full items-center"
                style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap' }}
            >
                
                {/* LEFT COLUMN: The Image (Globe & People) */}
                <div 
                    className="flex-1 flex items-center justify-center p-8 relative h-full"
                    style={{ flex: '1 1 50%', maxWidth: '50%' }}
                >
                    <img 
                        src="/globe-people.png" 
                        alt="World Map with Users" 
                        className="w-full max-w-[350px] h-auto object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-700"
                    />
                </div>

                {/* RIGHT COLUMN: Text & Actions */}
                <div 
                    className="flex-1 p-12 flex flex-col justify-center text-left h-full"
                    style={{ flex: '1 1 50%', maxWidth: '50%' }}
                >
                    
                    {/* Main Text */}
                    <div className="mb-10 pr-8">
                        <p className="text-4xl text-black font-medium leading-tight mb-6" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                            Join our worldwide conference room booking system
                        </p>
                        <p className="text-xl text-gray-600 font-sans">
                            Connect, Collaborate, and Schedule with the ease of Frutiger Aero.
                        </p>
                    </div>

                    {/* Action Button */}
                    <div>
                        <button 
                            className="btn-glossy-green px-12 py-4 text-2xl rounded-full shadow-xl hover:shadow-2xl transform transition-all active:scale-95 hover:brightness-110" 
                            onClick={() => router.push('/login')}
                        >
                            Get Started
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