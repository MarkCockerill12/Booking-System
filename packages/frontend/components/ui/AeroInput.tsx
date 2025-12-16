import React from 'react';
import { cn } from './AeroButton';

interface AeroInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const AeroInput: React.FC<AeroInputProps> = ({ className, ...props }) => {
  return (
    <input 
      className={cn(
        "w-full px-4 py-2 rounded border border-[#8899aa] bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] outline-none focus:ring-2 focus:ring-blue-400/50 transition-all text-gray-800 placeholder:text-gray-400",
        className
      )}
      {...props}
    />
  );
};
