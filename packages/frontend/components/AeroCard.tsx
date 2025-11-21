// packages/frontend/components/AeroCard.tsx
import React from 'react';
import styles from '../styles/AeroTheme.module.css';

interface AeroCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const AeroCard: React.FC<AeroCardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`${styles.aeroCard} p-6 w-full max-w-2xl mx-auto ${className}`}>
      {title && (
        <h1 className="text-2xl font-bold mb-4 text-blue-800 border-b pb-2">
          {title}
        </h1>
      )}
      {children}
    </div>
  );
};