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
    <div className="xp-background">
      
      {/* The Main Glass Card */}
      <div className="aero-glass w-[500px] h-[350px] flex flex-col p-6 relative">
        
        {/* Header Text */}
        <h2 className="text-2xl text-gray-800 font-sans mb-1 pl-2">
          Sign Up / Log In
        </h2>

        {/* The Purple User Icon (Visual) */}
        <div className="absolute top-10 right-10 bg-gradient-to-b from-purple-400 to-purple-800 rounded-full p-1 border-2 border-white shadow-lg">
           <div className="w-12 h-12 flex items-center justify-center text-white text-3xl">
             👤
           </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col justify-center flex-grow mt-4 px-8 space-y-4">
          
          {/* Email Input */}
          <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-700 mb-1 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="aero-input w-full"
              placeholder="user@example.com"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-700 mb-1 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="aero-input w-full"
              placeholder="••••••••"
            />
          </div>

          {/* BYPASS TOGGLE (For your testing) */}
          <div className="flex items-center mt-2">
            <input 
              type="checkbox" 
              id="bypass" 
              checked={useBypass} 
              onChange={(e) => setUseBypass(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="bypass" className="text-xs text-gray-600 cursor-pointer select-none">
              Demo Mode (Bypass Cognito)
            </label>
          </div>

        </form>

        {/* Bottom Right Action Button (The Blue Arrow) */}
        <div className="absolute bottom-6 right-6">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-glossy-blue w-14 h-14 text-2xl transition-transform active:scale-90"
            title="Log In"
          >
            {isLoading ? '...' : '➔'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;