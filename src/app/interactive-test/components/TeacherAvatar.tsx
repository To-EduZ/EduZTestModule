import React from "react";

interface TeacherAvatarProps {
  state: "idle" | "speaking" | "listening" | "thinking";
}

export default function TeacherAvatar({ state }: TeacherAvatarProps) {
  let ringColor = "border-blue-300 dark:border-blue-700";
  let pulseClass = "";
  let badgeText = "Cô Lily AI 👩‍🏫";
  let badgeTheme = "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";

  if (state === "speaking") {
    ringColor = "border-emerald-400 dark:border-emerald-600";
    pulseClass = "animate-pulse ring-4 ring-emerald-100 dark:ring-emerald-950/20";
    badgeText = "Cô Lily đang nói... 🔊";
    badgeTheme = "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900";
  } else if (state === "listening") {
    ringColor = "border-rose-400 dark:border-rose-600";
    pulseClass = "animate-pulse ring-4 ring-rose-100 dark:ring-rose-950/20";
    badgeText = "Cô đang nghe con nè... 🎤";
    badgeTheme = "bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900";
  } else if (state === "thinking") {
    ringColor = "border-amber-400 dark:border-amber-600";
    pulseClass = "animate-pulse ring-4 ring-amber-100 dark:ring-amber-950/20";
    badgeText = "Cô đang suy nghĩ... 🧠";
    badgeTheme = "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900";
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 w-full select-none">
      <div className={`relative w-12 h-12 rounded-full border-2 ${ringColor} ${pulseClass} transition-all duration-300 flex items-center justify-center bg-sky-50 dark:bg-slate-800 shadow-sm shrink-0`}>
        {/* Cute female teacher avatar SVG */}
        <svg className="w-8 h-8 text-indigo-500 fill-indigo-100 dark:text-indigo-400 dark:fill-indigo-950/30" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          <circle cx="10.5" cy="8" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
          <circle cx="13.5" cy="8" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
          <line x1="12" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1" />
        </svg>
        {state === "speaking" && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 text-[8px] items-center justify-center">🔊</span>
          </span>
        )}
        {state === "listening" && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 text-[8px] items-center justify-center">🎤</span>
          </span>
        )}
        {state === "thinking" && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 text-[8px] items-center justify-center">🧠</span>
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1">
          <span className="text-sm font-black text-slate-800 dark:text-slate-100">Cô Lily AI</span>
          <span className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-[8px] px-1 py-0.2 rounded font-mono font-black uppercase">PRO</span>
        </div>
        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black border shadow-sm ${badgeTheme}`}>
          {badgeText}
        </span>
      </div>
    </div>
  );
}
