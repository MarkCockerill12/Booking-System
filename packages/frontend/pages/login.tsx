import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { AeroInput } from '../components/ui/AeroInput';
import { createTimeline, stagger } from 'animejs';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useBypass, setUseBypass] = useState(true); // Default to bypass for now
  const router = useRouter();
  const { isAuthenticated, login, isLoading } = useAuth();

  // Refs for animation
  const cardRef = useRef<HTMLDivElement>(null);
  const userIconRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/search');
    }
  }, [isAuthenticated, router]);

  // Entrance Animation
  useEffect(() => {
    const timeline = createTimeline({
      duration: 1000
    });

    timeline
    .add(cardRef.current, {
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 800
    })
    .add(userIconRef.current, {
      translateY: [-50, 0],
      opacity: [0, 1],
      duration: 800
    }, '-=600')
    .add(formRef.current?.children, {
      translateY: [20, 0],
      opacity: [0, 1],
      delay: stagger(100)
    }, '-=600')
    .add(buttonRef.current, {
      scale: [0, 1],
      opacity: [0, 1],
      rotate: '1turn'
    }, '-=400');

  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass the 'useBypass' state to the login hook
    login(email, password, useBypass);
  };

  return (
    // The container that holds the background
    <div className="xp-background main-layout flex items-center justify-center">
      
      {/* The Main Glass Card */}
      <div ref={cardRef} className="aero-glass w-full max-w-3xl aspect-[4/3] flex flex-col p-8 relative overflow-hidden opacity-0">
        
        {/* Header Text */}
        <h2 className="text-4xl text-black font-sans mb-1 pl-2 absolute top-8 left-8 z-10 tracking-tight drop-shadow-sm">
          Sign Up/ Log In
        </h2>

        {/* The Purple User Icon (Visual) */}
        <div ref={userIconRef} className="absolute top-[20%] left-1/2 transform -translate-x-1/2 z-10 opacity-0">
           <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#d58ce6] to-[#8e24aa] border-2 border-[#6a1b9a] shadow-[0_5px_15px_rgba(0,0,0,0.3)] flex items-center justify-center relative overflow-hidden">
             {/* Shine */}
             <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent rounded-t-full"></div>
             <span className="text-white text-5xl drop-shadow-md z-10">👤</span>
           </div>
        </div>

        {/* Form Container */}
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col justify-center items-center flex-grow mt-20 space-y-6 w-full max-w-md mx-auto z-10">
          
          {/* Email Input */}
          <div className="flex items-center w-full gap-4 opacity-0">
            <label className="text-2xl text-black font-sans w-32 text-right drop-shadow-sm">Email</label>
            <div className="flex-1">
                <AeroInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-lg"
                />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex items-center w-full gap-4 opacity-0">
            <label className="text-2xl text-black font-sans w-32 text-right drop-shadow-sm">Password</label>
            <div className="flex-1">
                <AeroInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-lg"
                />
            </div>
          </div>

          {/* BYPASS TOGGLE (Hidden or small) */}
          <div className="flex items-center mt-2 opacity-0 hover:opacity-100 transition-opacity">
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
            ref={buttonRef}
            onClick={handleSubmit}
            disabled={isLoading}
            className="hover:brightness-110 active:scale-95 transition-all opacity-0 bg-transparent border-0 p-0"
            title="Log In"
          >
            {isLoading ? (
                <div className="rounded-full bg-gradient-to-b from-[#6bb5ff] to-[#105cb6] flex items-center justify-center" style={{ width: '48px', height: '48px' }}>
                    <span className="text-white font-bold text-xs">...</span>
                </div>
            ) : (
                <img 
                    src="/Aero Circle 01.png" 
                    alt="Log In" 
                    style={{ width: '48px', height: '48px' }}
                    className="drop-shadow-lg"
                />
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;