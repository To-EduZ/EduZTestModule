import React from "react";

interface SkillShieldProps {
  filled: boolean;
}

export default function SkillShield({ filled }: SkillShieldProps) {
  return (
    <svg 
      className={`w-6 h-8 drop-shadow-sm transition-all duration-300 ${
        filled 
          ? "text-amber-500 fill-amber-400 scale-110 animate-bounce-subtle" 
          : "text-slate-200 fill-slate-100"
      }`} 
      viewBox="0 0 24 30"
    >
      <path 
        d="M12 2 L2 5 C2 15, 6 24, 12 28 C18 24, 22 15, 22 5 Z" 
        stroke="currentColor" 
        strokeWidth="2" 
      />
      {filled && (
        <path 
          d="M12 7 L14 11 L19 11 L15 14 L17 19 L12 16 L7 19 L9 14 L5 11 L10 11 Z" 
          fill="white" 
          transform="translate(4, 5) scale(0.65)"
        />
      )}
    </svg>
  );
}
