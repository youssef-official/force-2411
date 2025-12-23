
import React from 'react';

export const Logo = ({ className = "w-8 h-8", color = "currentColor" }: { className?: string, color?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Anvil Top */}
    <path 
      d="M10 30 L20 30 L20 25 L80 25 L80 30 L90 30 L80 50 L65 50 L60 65 L40 65 L35 50 L20 50 Z" 
      fill={color} 
      stroke={color} 
      strokeWidth="2"
      strokeLinejoin="round"
    />
    
    {/* Base/Circuit connection */}
    <path 
      d="M35 70 L65 70 L70 80 L30 80 Z" 
      fill={color}
    />
    
    {/* Circuit Lines Left */}
    <circle cx="25" cy="60" r="4" fill="none" stroke={color} strokeWidth="2" />
    <path d="M29 60 L40 65" stroke={color} strokeWidth="2" />
    <circle cx="40" cy="75" r="4" fill="none" stroke={color} strokeWidth="2" />
    <path d="M44 75 L50 70" stroke={color} strokeWidth="2" />

    {/* Circuit Lines Right */}
    <circle cx="75" cy="60" r="4" fill="none" stroke={color} strokeWidth="2" />
    <path d="M71 60 L60 65" stroke={color} strokeWidth="2" />
    
    {/* Bottom Trace */}
    <path d="M50 80 L50 90 L60 95" stroke={color} strokeWidth="2" fill="none" />
  </svg>
);
