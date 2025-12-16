import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AeroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'blue' | 'green' | 'default';
}

export const AeroButton: React.FC<AeroButtonProps> = ({ className, variant = 'default', ...props }) => {
  const baseStyles = "px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all active:translate-y-[1px] hover:brightness-110 border relative overflow-hidden group";
  
  const variants = {
    default: "bg-gradient-to-b from-[#fcfcfc] to-[#e0e0e0] border-[#707070] text-black",
    blue: "bg-gradient-to-b from-[#8bc1ff] via-[#4096ee] to-[#2583d6] border-[#134a88] text-shadow-sm",
    green: "bg-gradient-to-b from-[#d4fc79] via-[#96e6a1] to-[#42e695] border-[#4caf50] text-shadow-sm shadow-[0_4px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.6)]"
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props}>
      {/* Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/80 to-transparent rounded-t-lg pointer-events-none" />
      <span className="relative z-10 drop-shadow-md">{props.children}</span>
    </button>
  );
};
