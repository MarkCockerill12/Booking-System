// packages/frontend/pages/index.tsx
import { useRouter } from 'next/router';
import { AeroCard } from '../components/AeroCard';
import styles from '../styles/AeroTheme.module.css';

const LandingPage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <AeroCard className="p-10 text-center">
        <h1 className="text-5xl text-blue-700 font-extrabold mb-4 flex items-center justify-center">
          <span className="mr-4">📅</span>
          Booking System
          <span className="ml-4">🌐</span>
        </h1>
        
        <p className="text-xl text-gray-700 mb-8">
          Join our worldwide conference room booking system
        </p>

        <button 
          className={`${styles.aeroButton} px-8 py-3 text-lg font-semibold`} 
          onClick={() => router.push('/login')}
        >
          Get Started
        </button>
      </AeroCard>
    </div>
  );
};

export default LandingPage;