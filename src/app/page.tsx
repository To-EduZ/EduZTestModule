"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, BarChart3, Mic, Upload, Settings, UserPlus, Phone, Building, GraduationCap, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const voices = [
    { code: "en-US-AriaNeural", name: "Mỹ (Nữ) 🇺🇸" },
    { code: "en-US-GuyNeural", name: "Mỹ (Nam) 🇺🇸" },
    { code: "en-GB-SoniaNeural", name: "Anh (Nữ) 🇬🇧" },
    { code: "en-GB-RyanNeural", name: "Anh (Nam) 🇬🇧" },
    { code: "en-AU-NatashaNeural", name: "Úc (Nữ) 🇦🇺" },
  ];

  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-AriaNeural");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const router = useRouter();

  // User Info Form State
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [pendingTestRoute, setPendingTestRoute] = useState<string>("");
  const [userInfo, setUserInfo] = useState({
    name: "",
    schoolName: "",
    className: "",
    age: "",
    parentPhone: ""
  });
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const handleStartTest = (route: string) => {
    // Check if user info already exists (optional, but requirement says "luôn hiển thị")
    // If the requirement is to ALWAYS show it, we don't check localStorage here.
    // If we want to skip if they already filled it, we could check here.
    // The prompt says "tôi muốn phần form hiển thị ngay khi người dùng bấm nút làm bài", so we show it every time.
    setPendingTestRoute(route);
    setIsUserFormOpen(true);
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo),
      });
      const data = await res.json();
      if (data.success && data.userId) {
        localStorage.setItem("eduz_user_id", data.userId);
        setIsUserFormOpen(false);
        router.push(pendingTestRoute);
      } else {
        alert(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối đến máy chủ.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferred_accent_voice");
      if (saved) {
        setSelectedVoice(saved);
      }
      const savedDevMode = localStorage.getItem("dev_mode_enabled");
      if (savedDevMode === "true") {
        setDevModeEnabled(true);
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
            
            <div className="w-full relative z-10">
              <button 
                onClick={() => handleStartTest("/interactive-test")}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl px-6 py-4 font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg hover:shadow-pink-500/20 text-sm cursor-pointer border-b-4 border-rose-700"
              >
                <Mic className="w-4 h-4 animate-pulse" />
                Mở Module Tương Tác
              </button>
            </div>
          </section>

          {/* Cambridge YLE Test */}
          <section className="relative overflow-hidden backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between group hover:-translate-y-1 transition-all">
            <div>
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] md:text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-amber-500/20 inline-flex items-center gap-1.5 mb-4 shadow-sm">
                <BarChart3 className="w-3.5 h-3.5" />
                Cambridge Young Learners
              </span>
              <h3 className="text-xl md:text-2xl font-black text-slate-850 dark:text-slate-100 leading-tight mb-2">
                Bài Test Cambridge YLE 🏆
              </h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Đánh giá trình độ theo chuẩn Cambridge với 30 câu hỏi (Language Use + Listening). Xếp loại CEFR từ Pre-A1 đến B1.
              </p>
            </div>
            
            <div className="w-full relative z-10">
              <button 
                onClick={() => handleStartTest("/cambridge-test")}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl px-6 py-4 font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg hover:shadow-amber-500/20 text-sm cursor-pointer border-b-4 border-orange-800"
              >
                <BarChart3 className="w-4 h-4 animate-pulse" />
                Mở Bài Test Cambridge
              </button>
            </div>
          </section>
        </div>

      </main>

      {/* Hidden Settings Button (low opacity, bottom right) */}
      <button 
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-4 right-4 text-slate-400/20 hover:text-slate-400 hover:scale-110 transition-all duration-300 z-50 cursor-pointer p-2 rounded-full"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Cấu Hình Hệ Thống</span>
                <span className="bg-amber-100 dark:bg-amber-955 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded font-mono font-black uppercase">DEV</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-extrabold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-left">
              <div>
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Chế Độ Phát Triển (Develop Mode)</p>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-955/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-705 dark:text-slate-200 mb-0.5">Sử dụng DeepSeek API</h4>
                    <p className="text-xs text-slate-450 dark:text-slate-500 font-bold">DeepSeek Chat làm chính, Gemini làm dự phòng.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 ml-4">
                    <input 
                      type="checkbox" 
                      checked={devModeEnabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDevModeEnabled(checked);
                        localStorage.setItem("dev_mode_enabled", checked ? "true" : "false");
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-750 text-white rounded-2xl py-3 font-extrabold text-sm tracking-wider uppercase cursor-pointer transition-all duration-200 border-b-4 border-indigo-800"
            >
              Lưu & Đóng
            </button>
          </div>
        </div>
      )}

      {/* User Info Form Modal */}
      {isUserFormOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => !isSubmittingUser && setIsUserFormOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl dark:bg-indigo-900/50 dark:text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </span>
                Thông Tin Học Viên
              </h3>
              <button 
                type="button"
                onClick={() => !isSubmittingUser && setIsUserFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
                disabled={isSubmittingUser}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              Phụ huynh vui lòng nhập thông tin để bé bắt đầu bài kiểm tra nhé! 🌟
            </p>

            <form onSubmit={handleUserFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Tên của bé</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Tuổi</label>
                  <input
                    required
                    type="number"
                    min="4"
                    max="18"
                    value={userInfo.age}
                    onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                    placeholder="VD: 8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Lớp</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <input
                      required
                      type="text"
                      value={userInfo.className}
                      onChange={(e) => setUserInfo({ ...userInfo, className: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      placeholder="VD: 3A1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Trường học</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type="text"
                    value={userInfo.schoolName}
                    onChange={(e) => setUserInfo({ ...userInfo, schoolName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                    placeholder="VD: TH Lê Quý Đôn"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">SĐT Phụ Huynh</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type="tel"
                    pattern="[0-9]{10,11}"
                    value={userInfo.parentPhone}
                    onChange={(e) => setUserInfo({ ...userInfo, parentPhone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                    placeholder="VD: 0912345678"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingUser}
                className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl py-4 font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25 border-b-4 border-blue-800 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmittingUser ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>Bắt Đầu Làm Bài 🚀</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
