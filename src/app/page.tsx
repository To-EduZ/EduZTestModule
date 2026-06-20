"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, BarChart3, Mic, Upload, Activity } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Dashboard() {
  const voices = [
    { code: "en-US-AriaNeural", name: "Mỹ (Nữ) 🇺🇸" },
    { code: "en-US-GuyNeural", name: "Mỹ (Nam) 🇺🇸" },
    { code: "en-GB-SoniaNeural", name: "Anh (Nữ) 🇬🇧" },
    { code: "en-GB-RyanNeural", name: "Anh (Nam) 🇬🇧" },
    { code: "en-AU-NatashaNeural", name: "Úc (Nữ) 🇦🇺" },
  ];

  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-AriaNeural");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferred_accent_voice");
      if (saved) {
        setSelectedVoice(saved);
      }
    }
  }, []);

  const handleVoiceChange = (voiceCode: string) => {
    setSelectedVoice(voiceCode);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_accent_voice", voiceCode);
    }
  };

  return (
    <div className="w-full min-h-screen pb-20 relative bg-pastel-bg dark:bg-dark-bg font-sans">
      
      {/* 1. Playful Welcome Header */}
      <header className="w-full bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800 shadow-sm py-4 px-4 md:px-8 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Top Row on Mobile: Logo & ThemeToggle */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-2xl md:text-3xl animate-bounce" style={{ animationDuration: "2.5s" }}>🚀</span>
              <div>
                <h1 className="text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1">
                  EduZ <span className="text-emerald-500">TestModule</span>
                </h1>
                <p className="text-[8px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                  AI Placement & Analytics
                </p>
              </div>
            </div>
            
            {/* Theme Toggle on mobile right */}
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>

          {/* Bottom Row on Mobile (or right side on Desktop): Actions */}
          <div className="flex flex-row flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto justify-start md:justify-end">
            
            {/* Action Buttons: Import & Dashboard */}
            <div className="flex flex-1 md:flex-none items-center gap-2">
              <Link href="/dashboard/import" className="flex-1 md:flex-none">
                <button className="w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-[10px] md:text-xs font-black tracking-wider uppercase transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Số hóa <span className="hidden sm:inline">(Import)</span>
                </button>
              </Link>

              <Link href="/dashboard" className="flex-1 md:flex-none">
                <button className="w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-750 text-slate-700 dark:text-slate-200 text-[10px] md:text-xs font-black tracking-wider uppercase transition-all duration-200 shadow-sm cursor-pointer">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                  Thống kê
                </button>
              </Link>
            </div>

            {/* AI Accent Selector */}
            <div className="relative flex-none">
              <select
                value={selectedVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-250/50 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10px] md:text-xs font-extrabold rounded-full pl-7 md:pl-8 pr-6 md:pr-8 py-2 md:py-2.5 transition-all shadow-sm focus:outline-none cursor-pointer"
              >
                {voices.map((v) => (
                  <option key={v.code} value={v.code} className="dark:bg-slate-900 dark:text-slate-200">
                    {v.name}
                  </option>
                ))}
              </select>
              <span className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-[10px] md:text-xs pointer-events-none">🌐</span>
              <span className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none opacity-60">▼</span>
            </div>

            {/* Theme Toggle on desktop */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 mt-6 md:mt-12">
        
        {/* Welcome Section */}
        <section className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 rounded-3xl shadow-xl p-6 md:p-10 overflow-hidden mb-8 border border-indigo-400/20">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative z-10 text-white text-center">
            <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-[10px] md:text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-4 shadow-sm animate-bounce-subtle">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              Hệ Thống Kiểm Tra Tiếng Anh
            </span>
            
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Bài Kiểm Tra Đầu Vào<br className="hidden sm:inline" /> Thông Minh
            </h2>
            <p className="text-sm md:text-lg font-bold text-slate-100/95 mt-4 leading-relaxed max-w-2xl mx-auto">
              Giúp các bé đánh giá trình độ tiếng Anh một cách vui nhộn, tự nhiên và nhanh chóng thông qua trò chuyện trực tiếp với cô giáo AI và các câu hỏi thông minh!
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Interactive Test */}
          <section className="relative overflow-hidden backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between group hover:-translate-y-1 transition-all">
            <div>
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] md:text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-indigo-500/20 inline-flex items-center gap-1.5 mb-4 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-indigo-400/40" />
                Kiểm tra theo ngữ cảnh
              </span>
              <h3 className="text-xl md:text-2xl font-black text-slate-850 dark:text-slate-100 leading-tight mb-2">
                Bài Test Tương Tác 👩‍🏫
              </h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Khảo sát toàn diện 4 kỹ năng tiếng Anh (Nghe, Nói, Đọc, Viết) thông qua hội thoại tương tác trực tiếp với cô giáo AI.
              </p>
            </div>
            
            <Link href="/interactive-test" className="w-full relative z-10">
              <button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl px-6 py-4 font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg hover:shadow-pink-500/20 text-sm cursor-pointer border-b-4 border-rose-700">
                <Mic className="w-4 h-4 animate-pulse" />
                Mở Module Tương Tác
              </button>
            </Link>
          </section>

          {/* Adaptive Test */}
          <section className="relative overflow-hidden backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between group hover:-translate-y-1 transition-all">
            <div>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5 mb-4 shadow-sm">
                <Activity className="w-3.5 h-3.5" />
                Kiểm tra thích ứng (CAT)
              </span>
              <h3 className="text-xl md:text-2xl font-black text-slate-850 dark:text-slate-100 leading-tight mb-2">
                Bài Test Thích Ứng 🎯
              </h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Thuật toán tinh chỉnh câu hỏi tự động dựa trên câu trả lời trước đó, giúp xác định đúng trình độ chỉ trong thời gian ngắn.
              </p>
            </div>
            
            <Link href="/adaptive-test" className="w-full relative z-10">
              <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl px-6 py-4 font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg hover:shadow-emerald-500/20 text-sm cursor-pointer border-b-4 border-teal-800">
                <Activity className="w-4 h-4 animate-pulse" />
                Mở Module Thích Ứng
              </button>
            </Link>
          </section>
        </div>

      </main>
    </div>
  );
}
