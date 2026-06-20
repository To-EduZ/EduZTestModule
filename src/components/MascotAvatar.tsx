"use client";

import React from "react";
import Image from "next/image";
import { MascotState } from "@/types/mascot";
import { useMascot } from "@/contexts/MascotContext";

interface MascotAvatarProps {
  state: MascotState;
  className?: string;
}

export const MascotAvatar = ({ state, className = "" }: MascotAvatarProps) => {
  const { currentMascot } = useMascot();

  let ringColor = currentMascot.themeColors.ring;
  let pulseClass = "";
  let badgeText = `${currentMascot.name} 👩‍🏫`;
  let badgeTheme = "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-955/40 dark:text-blue-300 dark:border-blue-850";

  if (state === "speaking") {
    ringColor = "border-emerald-400 dark:border-emerald-600";
    pulseClass = "animate-pulse ring-4 ring-emerald-100 dark:ring-emerald-950/20";
    badgeText = currentMascot.dialogue.speaking || "Đang nói... 🔊";
    badgeTheme = "bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-955/40 dark:text-emerald-350 dark:border-emerald-900";
  } else if (state === "listening") {
    ringColor = "border-rose-400 dark:border-rose-600";
    pulseClass = "animate-pulse ring-4 ring-rose-100 dark:ring-rose-950/20";
    badgeText = currentMascot.dialogue.listening || "Đang nghe... 🎤";
    badgeTheme = "bg-rose-50 text-rose-600 border-rose-255 dark:bg-rose-955/40 dark:text-rose-350 dark:border-rose-900";
  } else if (state === "thinking") {
    ringColor = "border-amber-400 dark:border-amber-600";
    pulseClass = "animate-pulse ring-4 ring-amber-100 dark:ring-amber-950/20";
    badgeText = currentMascot.dialogue.thinking || "Đang suy nghĩ... 🧠";
    badgeTheme = "bg-amber-50 text-amber-600 border-amber-250 dark:bg-amber-955/40 dark:text-amber-350 dark:border-amber-900";
  }

  // Ensure fallback SVG exists in case of image load error
  const [imageError, setImageError] = React.useState(false);

  const currentImage = currentMascot.images[state] || currentMascot.avatarUrl;

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 w-full select-none ${className}`}>
      <div className={`relative w-16 h-16 sm:w-12 sm:h-12 rounded-full border-2 ${ringColor} ${pulseClass} transition-all duration-300 flex items-center justify-center ${currentMascot.themeColors.bg} shadow-sm shrink-0 overflow-hidden`}>
        {!imageError && currentImage ? (
          <Image
            src={currentImage}
            alt={currentMascot.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 64px, 48px"
          />
        ) : (
          <svg className={`w-8 h-8 ${currentMascot.themeColors.text}`} viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        )}
        
        {state === "speaking" && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 text-[8px] items-center justify-center text-white">🔊</span>
          </span>
        )}
        {state === "listening" && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 text-[8px] items-center justify-center text-white">🎤</span>
          </span>
        )}
        {state === "thinking" && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 text-[8px] items-center justify-center text-white">🧠</span>
          </span>
        )}
      </div>
      <div className={`px-4 py-2 rounded-full border text-sm font-medium ${badgeTheme} transition-colors duration-300 w-full text-center sm:text-left sm:w-auto`}>
        {badgeText}
      </div>
    </div>
  );
};
