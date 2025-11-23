import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useBypass, setUseBypass] = useState(true); // Default to bypass for now
  const router = useRouter();
  const { isAuthenticated, login, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/search');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass the 'useBypass' state to the login hook
    login(email, password, useBypass);
  };

  return (
    // The container that holds the background
    <div className="xp-background main-layout flex items-center justify-center">
      
      {/* The Main Glass Card */}
      <div className="aero-glass w-full max-w-3xl aspect-[4/3] flex flex-col p-8 relative overflow-hidden">
        
        {/* Header Text */}
        <h2 className="text-4xl text-black font-sans mb-1 pl-2 absolute top-8 left-8 z-10 tracking-tight">
          Sign Up/ Log In
        </h2>

        {/* The Purple User Icon (Visual) */}
        <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 z-10">
           <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#d58ce6] to-[#8e24aa] border-2 border-[#6a1b9a] shadow-[0_5px_15px_rgba(0,0,0,0.3)] flex items-center justify-center relative overflow-hidden">
             {/* Shine */}
             <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent rounded-t-full"></div>
             <span className="text-white text-5xl drop-shadow-md z-10">👤</span>
           </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center flex-grow mt-20 space-y-6 w-full max-w-md mx-auto z-10">
          
          {/* Email Input */}
          <div className="flex items-center w-full gap-4">
            <label className="text-2xl text-black font-sans w-32 text-right">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 rounded-xl border border-gray-400 shadow-inner px-4 text-lg outline-none focus:ring-2 focus:ring-blue-400 bg-gradient-to-b from-[#f0f0f0] to-[#ffffff]"
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center w-full gap-4">
            <label className="text-2xl text-black font-sans w-32 text-right">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 h-12 rounded-xl border border-gray-400 shadow-inner px-4 text-lg outline-none focus:ring-2 focus:ring-blue-400 bg-gradient-to-b from-[#f0f0f0] to-[#ffffff]"
            />
          </div>

          {/* BYPASS TOGGLE (Hidden or small) */}
          <div className="flex items-center mt-2 opacity-50 hover:opacity-100 transition-opacity">
            <input 
              type="checkbox" 
              id="bypass" 
              checked={useBypass} 
              onChange={(e) => setUseBypass(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="bypass" className="text-xs text-gray-600 cursor-pointer select-none">
              Demo Mode
            </label>
          </div>

        </form>

        {/* Bottom Right Action Button (The Blue Arrow) */}
        <div className="absolute bottom-8 right-8 z-20">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-20 h-20 rounded-full bg-gradient-to-b from-[#6bb5ff] to-[#105cb6] border-2 border-[#0d47a1] shadow-[0_5px_15px_rgba(0,0,0,0.4)] flex items-center justify-center hover:brightness-110 active:scale-95 transition-all group"
            title="Log In"
          >
            {/* Inner Shine */}
            <div className="absolute top-1 left-1 right-1 h-[45%] bg-gradient-to-b from-white/70 to-transparent rounded-t-full pointer-events-none"></div>
            
            {isLoading ? (
                <span className="text-white font-bold">...</span>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white drop-shadow-md transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;