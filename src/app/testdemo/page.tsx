"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, RotateCcw, Code, Settings, LayoutGrid, CheckCircle2,
  ChevronRight, ArrowRight, Eye, RefreshCw, Undo2, Info, Check, HelpCircle
} from "lucide-react";
import Link from "next/link";

// Helper to shuffle letters
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TestDemoPage() {
  const [activeTab, setActiveTab] = useState<"demo" | "compare" | "docs">("demo");
  
  // Custom word testing state
  const [testWord, setTestWord] = useState("crocodile");
  const [wordInput, setWordInput] = useState("crocodile");
  const [availableLetters, setAvailableLetters] = useState<{letter: string, id: number}[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<{letter: string, id: number}[]>([]);
  const [writingSubmitted, setWritingSubmitted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Configuration Mode for comparison tab
  const [compareMode, setCompareMode] = useState<"hybrid" | "scroll" | "shrink">("hybrid");
  const [compareWord, setCompareWord] = useState("hippopotamus");
  const [compareWordInput, setCompareWordInput] = useState("hippopotamus");
  const [compareAvailable, setCompareAvailable] = useState<{letter: string, id: number}[]>([]);
  const [compareSelected, setCompareSelected] = useState<{letter: string, id: number}[]>([]);
  
  // References for scrolling
  const demoAnswerZoneRef = useRef<HTMLDivElement>(null);
  const compareAnswerZoneRef = useRef<HTMLDivElement>(null);

  // Initialize letters for Tab 1 (Demo)
  const initDemoLetters = (word: string) => {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return;
    const correctLetters = cleanWord.split("");
    // Generate distractors
    const distractors = "bcdfghjklmnpqrstvwxyzaeiou".split("").filter(l => !correctLetters.includes(l));
    const numDistractors = Math.min(3, distractors.length);
    const shuffledDistractors = shuffleArray(distractors).slice(0, numDistractors);
    const allLetters = [...correctLetters, ...shuffledDistractors].map((letter, i) => ({ letter, id: i }));
    
    setAvailableLetters(shuffleArray(allLetters));
    setSelectedLetters([]);
    setWritingSubmitted(false);
    setIsSuccess(false);
  };

  // Initialize letters for Tab 2 (Compare)
  const initCompareLetters = (word: string) => {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return;
    const correctLetters = cleanWord.split("");
    const distractors = "bcdfghjklmnpqrstvwxyzaeiou".split("").filter(l => !correctLetters.includes(l));
    const numDistractors = Math.min(3, distractors.length);
    const shuffledDistractors = shuffleArray(distractors).slice(0, numDistractors);
    const allLetters = [...correctLetters, ...shuffledDistractors].map((letter, i) => ({ letter, id: i }));
    
    setCompareAvailable(shuffleArray(allLetters));
    setCompareSelected([]);
  };

  // Run on mount or when testWord/compareWord changes
  useEffect(() => {
    initDemoLetters(testWord);
  }, [testWord]);

  useEffect(() => {
    initCompareLetters(compareWord);
  }, [compareWord]);

  // Trigger auto-scroll for Demo Tab
  useEffect(() => {
    if (demoAnswerZoneRef.current) {
      demoAnswerZoneRef.current.scrollTo({
        left: demoAnswerZoneRef.current.scrollWidth,
        behavior: "smooth"
      });
    }
  }, [selectedLetters]);

  // Trigger auto-scroll for Compare Tab
  useEffect(() => {
    if (compareAnswerZoneRef.current && (compareMode === "hybrid" || compareMode === "scroll")) {
      compareAnswerZoneRef.current.scrollTo({
        left: compareAnswerZoneRef.current.scrollWidth,
        behavior: "smooth"
      });
    }
  }, [compareSelected, compareMode]);

  // Handlers for Demo Tab
  const handleDemoLetterTap = (tile: {letter: string, id: number}) => {
    setAvailableLetters(prev => prev.filter(t => t.id !== tile.id));
    setSelectedLetters(prev => [...prev, tile]);
  };

  const handleDemoAnswerTap = (tile: {letter: string, id: number}) => {
    setSelectedLetters(prev => prev.filter(t => t.id !== tile.id));
    setAvailableLetters(prev => [...prev, tile]);
  };

  const handleDemoReset = () => {
    setAvailableLetters(prev => [...prev, ...selectedLetters]);
    setSelectedLetters([]);
    setWritingSubmitted(false);
    setIsSuccess(false);
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const builtWord = selectedLetters.map(t => t.letter).join("");
    const isCorrect = builtWord.toLowerCase() === testWord.toLowerCase();
    setIsSuccess(isCorrect);
    setWritingSubmitted(true);
  };

  // Handlers for Compare Tab
  const handleCompareLetterTap = (tile: {letter: string, id: number}) => {
    setCompareAvailable(prev => prev.filter(t => t.id !== tile.id));
    setCompareSelected(prev => [...prev, tile]);
  };

  const handleCompareAnswerTap = (tile: {letter: string, id: number}) => {
    setCompareSelected(prev => prev.filter(t => t.id !== tile.id));
    setCompareAvailable(prev => [...prev, tile]);
  };

  const handleCompareReset = () => {
    setCompareAvailable(prev => [...prev, ...compareSelected]);
    setCompareSelected([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation back to main app */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/interactive-test" 
            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-sm"
          >
            <Undo2 className="w-4 h-4" /> Quay lại Thử thách chính
          </Link>
          <div className="text-xs bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 px-3 py-1 rounded-full font-black uppercase tracking-wider">
            EduZ Spelling Demo Room
          </div>
        </div>

        {/* Hero Title Header */}
        <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform translate-x-20 -translate-y-20 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 mb-2">
              <span>🎯</span> Demo Ghép Chữ &amp; Ô Chữ EduZ
            </h1>
            <p className="text-indigo-100 max-w-2xl text-sm md:text-base leading-relaxed">
              Trang kiểm thử giải pháp khắc phục lỗi tràn chữ ngang. 
              Bạn có thể thử nhập từ bất kỳ (ngắn hay siêu dài) để kiểm tra cơ chế 
              <strong> Tự động cuộn (Auto-scroll)</strong> và <strong>Thu nhỏ thông minh (Dynamic Scale)</strong>.
            </p>
          </div>
        </header>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab("demo")}
            className={`flex items-center gap-2 px-4 py-3 border-b-4 text-sm font-extrabold transition-all ${
              activeTab === "demo"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" /> 1. Chạy Thử (Demo Sandbox)
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`flex items-center gap-2 px-4 py-3 border-b-4 text-sm font-extrabold transition-all ${
              activeTab === "compare"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> 2. So Sánh Cấu Hình
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 px-4 py-3 border-b-4 text-sm font-extrabold transition-all ${
              activeTab === "docs"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Code className="w-4 h-4" /> 3. Chi Tiết Kỹ Thuật (Docs)
          </button>
        </div>

        {/* Tab Content 1: Demo Sandbox */}
        {activeTab === "demo" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Panel left */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 text-base">
                  <Settings className="w-5 h-5 text-indigo-500" /> Cấu hình từ ghép
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Nhập từ kiểm thử (Ví dụ: ant, elephant, hippopotamus)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={wordInput}
                        onChange={(e) => setWordInput(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                        placeholder="Nhập từ..."
                      />
                      <button
                        onClick={() => setTestWord(wordInput)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1 transition-all"
                      >
                        Tạo ô chữ
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-bold mb-1 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Giải pháp kết hợp (Hybrid):
                    </p>
                    <ul className="list-disc pl-4 space-y-1 mt-1 font-medium">
                      <li>Từ có <strong>dưới 6 chữ</strong>: Kích thước ô chuẩn <code className="bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded">52px</code>.</li>
                      <li>Từ có <strong>trên 6 chữ</strong>: Tự động thu nhỏ nhẹ các ô xuống <code className="bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded">40px</code> để vừa màn hình.</li>
                      <li>Từ <strong>siêu dài</strong> (vượt quá khung): Tự động cuộn mượt (scroll) sang phải cùng để theo chữ cái mới nhất.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Spelling Sandbox Area right */}
            <div className="lg:col-span-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800 flex flex-col items-center min-h-[400px]">
                
                {/* Title */}
                <h3 className="font-extrabold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                  ✍️ Thử thách đánh vần từ: <span className="underline decoration-indigo-500 font-black text-indigo-900 dark:text-indigo-200 text-base">{testWord}</span>
                </h3>

                {/* Info Pills */}
                <div className="flex gap-2 mb-6 text-xs font-bold text-slate-500">
                  <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                    Kích thước từ: {testWord.length} chữ cái
                  </span>
                  <span className={`px-3 py-1.5 rounded-full ${selectedLetters.length > 6 ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300" : "bg-slate-100 dark:bg-slate-800"}`}>
                    Trạng thái: {selectedLetters.length > 6 ? "Đã thu nhỏ (scale-down)" : "Kích thước chuẩn"}
                  </span>
                </div>

                {/* 1. Answer zone (spelling answer board) */}
                <div 
                  ref={demoAnswerZoneRef}
                  className={`answer-zone w-full max-w-md mb-6 transition-all duration-200 ${
                    selectedLetters.length > 0 ? "has-letters" : ""
                  } ${selectedLetters.length > 6 ? "scale-down" : ""}`}
                >
                  {selectedLetters.length === 0 ? (
                    <span className="text-xs font-bold text-slate-400 italic">
                      Bấm vào các ô chữ cái phía dưới để chọn... ✨
                    </span>
                  ) : (
                    selectedLetters.map((tile, idx) => (
                      <button
                        key={`ans-${tile.id}`}
                        onClick={() => !writingSubmitted && handleDemoAnswerTap(tile)}
                        className={`letter-tile in-answer transition-all duration-100`}
                        type="button"
                        disabled={writingSubmitted}
                      >
                        {tile.letter}
                      </button>
                    ))
                  )}
                </div>

                {/* 2. Available letter tiles */}
                <div className="flex flex-wrap gap-2.5 justify-center mb-8 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 w-full max-w-md">
                  {availableLetters.map((tile) => (
                    <button
                      key={`avail-${tile.id}`}
                      onClick={() => handleDemoLetterTap(tile)}
                      className="letter-tile transition-all duration-100"
                      type="button"
                      disabled={writingSubmitted}
                    >
                      {tile.letter}
                    </button>
                  ))}
                </div>

                {/* 3. Actions */}
                <form onSubmit={handleDemoSubmit} className="w-full max-w-md flex gap-3">
                  <button
                    type="button"
                    onClick={handleDemoReset}
                    disabled={selectedLetters.length === 0 || writingSubmitted}
                    className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-4 h-4" /> Xếp lại
                  </button>
                  <button
                    type="submit"
                    disabled={selectedLetters.length === 0 || writingSubmitted}
                    className="flex-[2] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Nộp bài 🚀
                  </button>
                </form>

                {/* Feedback status */}
                {writingSubmitted && (
                  <div className="mt-6 animate-bounce-subtle text-sm font-black text-center w-full max-w-md">
                    {isSuccess ? (
                      <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 rounded-2xl border-2 border-emerald-200 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> 🎉 Xuất sắc! Con đã ghép đúng từ rồi!
                      </span>
                    ) : (
                      <span className="text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-4 py-2.5 rounded-2xl border-2 border-rose-200 flex items-center justify-center gap-2">
                        ❌ Gần đúng rồi, con hãy bấm &quot;Xếp lại&quot; và thử lại nhé!
                      </span>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* Tab Content 2: Compare Configurations */}
        {activeTab === "compare" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-lg">
                  So sánh trực quan 3 Phương án thiết kế
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập một từ siêu dài và chọn phương án để xem phản hồi giao diện thực tế.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={compareWordInput}
                  onChange={(e) => setCompareWordInput(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="Từ siêu dài..."
                />
                <button
                  onClick={() => setCompareWord(compareWordInput)}
                  className="bg-slate-800 hover:bg-slate-950 dark:bg-indigo-600 text-white font-extrabold text-xs px-3 py-2 rounded-xl transition-all"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              
              <button
                onClick={() => setCompareMode("scroll")}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  compareMode === "scroll"
                    ? "border-amber-500 bg-amber-50/20 dark:bg-amber-950/10 ring-2 ring-amber-100"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-sm text-slate-800 dark:text-slate-200">1. Chỉ Cuộn (Scroll only)</span>
                  {compareMode === "scroll" && <span className="text-amber-500 text-xs font-bold">Đang xem</span>}
                </div>
                <p className="text-xs text-slate-500">
                  Ô chữ cái giữ nguyên size 52px. Tự động cuộn sang phải khi từ quá dài. Chữ luôn to rõ ràng.
                </p>
              </button>

              <button
                onClick={() => setCompareMode("shrink")}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  compareMode === "shrink"
                    ? "border-rose-500 bg-rose-50/20 dark:bg-rose-950/10 ring-2 ring-rose-100"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-sm text-slate-800 dark:text-slate-200">2. Chỉ Thu Nhỏ (Shrink only)</span>
                  {compareMode === "shrink" && <span className="text-rose-500 text-xs font-bold">Đang xem</span>}
                </div>
                <p className="text-xs text-slate-500">
                  Không cuộn, không thanh trượt. Tất cả ô tự co nhỏ chiều ngang để xếp khít. Nhược điểm: rất khó nhấn khi từ dài.
                </p>
              </button>

              <button
                onClick={() => setCompareMode("hybrid")}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  compareMode === "hybrid"
                    ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 ring-2 ring-emerald-100"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    🌟 3. Kết hợp (Hybrid)
                  </span>
                  {compareMode === "hybrid" && <span className="text-emerald-500 text-xs font-bold">Đang chọn</span>}
                </div>
                <p className="text-xs text-slate-500">
                  Thu nhỏ nhẹ khi vượt quá 6 ký tự để hiển thị tốt nhất. Nếu vẫn quá dài, tự động kích hoạt cuộn mượt.
                </p>
              </button>
            </div>

            {/* Play Area */}
            <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 bg-slate-50/40 dark:bg-slate-950/30 flex flex-col items-center">
              
              <div className="mb-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Chế độ thử nghiệm: {compareMode === "scroll" ? "Chỉ cuộn tự động" : compareMode === "shrink" ? "Chỉ co nhỏ" : "Kết hợp tối ưu"}
              </div>

              {/* Dynamic Styling wrapper for the comparison answer-zone */}
              <div className="w-full max-w-md flex justify-center mb-6">
                
                {/* 
                  We override classes inline or using local class mapping to simulate
                  what each choice looks like! 
                */}
                <div
                  ref={compareAnswerZoneRef}
                  className={`
                    answer-zone w-full transition-all duration-300
                    ${compareSelected.length > 0 ? "has-letters" : ""}
                    ${compareMode === "shrink" ? "shrink-only-flex" : ""}
                    ${compareMode === "hybrid" && compareSelected.length > 6 ? "scale-down" : ""}
                  `}
                  style={compareMode === "shrink" ? {
                    display: "flex",
                    flexWrap: "nowrap",
                    overflowX: "hidden", // Disable scroll for shrink
                    justifyContent: compareSelected.length > 0 ? "flex-start" : "center"
                  } : {}}
                >
                  {compareSelected.length === 0 ? (
                    <span className="text-xs font-bold text-slate-400 italic">
                      Bấm chữ cái bên dưới để xếp từ dài &quot;{compareWord}&quot;...
                    </span>
                  ) : (
                    compareSelected.map((tile, idx) => (
                      <button
                        key={`comp-ans-${tile.id}`}
                        onClick={() => handleCompareAnswerTap(tile)}
                        className={`letter-tile in-answer transition-all duration-100`}
                        style={compareMode === "shrink" ? {
                          // Force shrinking down depending on length
                          width: `${Math.max(24, 100 / Math.max(5, compareSelected.length))}%`,
                          maxWidth: "52px",
                          minWidth: "16px",
                          fontSize: `${Math.max(0.7, 1.5 - (compareSelected.length * 0.05))}rem`,
                          height: "48px",
                          padding: "0"
                        } : {}}
                        type="button"
                      >
                        {tile.letter}
                      </button>
                    ))
                  )}
                </div>

              </div>

              {/* Compare available letter tiles */}
              <div className="flex flex-wrap gap-2.5 justify-center mb-6 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl w-full max-w-md">
                {compareAvailable.map((tile) => (
                  <button
                    key={`comp-avail-${tile.id}`}
                    onClick={() => handleCompareLetterTap(tile)}
                    className="letter-tile transition-all duration-100"
                    type="button"
                  >
                    {tile.letter}
                  </button>
                ))}
              </div>

              <div className="w-full max-w-md flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleCompareReset}
                  disabled={compareSelected.length === 0}
                  className="px-4 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl disabled:opacity-50 hover:bg-slate-300 transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Xếp lại từ này
                </button>
                <div className="text-xs text-slate-500 font-medium">
                  Số chữ đã chọn: <strong className="text-slate-800 dark:text-slate-200 font-bold">{compareSelected.length}</strong> / {compareWord.length}
                </div>
              </div>

            </div>

            {/* Analysis report */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
              <div className="p-4 bg-amber-500/5 dark:bg-slate-950 rounded-xl border border-amber-500/20">
                <h4 className="font-extrabold text-xs text-amber-600 uppercase mb-2">Đánh giá Option 1 (Cuộn)</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  <strong>Trực quan tốt:</strong> Phù hợp trên mọi loại màn hình. Ô chữ to đẹp dễ bấm.
                  <br /><strong className="text-rose-500">Điểm yếu:</strong> Chữ bị cuộn khuất, học sinh không nhìn thấy trọn vẹn toàn bộ từ khi đang ghép dở ở đoạn cuối.
                </p>
              </div>
              <div className="p-4 bg-rose-500/5 dark:bg-slate-950 rounded-xl border border-rose-500/20">
                <h4 className="font-extrabold text-xs text-rose-600 uppercase mb-2">Đánh giá Option 2 (Thu nhỏ)</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  <strong>Trực quan tốt:</strong> Nhìn thấy toàn bộ từ. 
                  <br /><strong className="text-rose-500">Điểm yếu:</strong> Khi từ dài, các nút bị co lại siêu bé. Ngón tay học sinh to khó thao tác, dễ click nhầm và gây ức chế khi học.
                </p>
              </div>
              <div className="p-4 bg-emerald-500/5 dark:bg-slate-950 rounded-xl border border-emerald-500/20">
                <h4 className="font-extrabold text-xs text-emerald-600 uppercase mb-2">Đánh giá Option 3 (Kết hợp)</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  <strong>Khuyên dùng:</strong> Đảm bảo dung hòa cả 2 tiêu chí. Giảm nhẹ kích thước để tối đa hoá số lượng chữ hiển thị trên màn hình. Nếu từ quá dài thì mới cuộn. Đạt điểm 10 về UX!
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Tab Content 3: Technical Details */}
        {activeTab === "docs" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-lg mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-500" /> Cách triển khai code trong dự án
            </h3>

            <div className="space-y-6 text-slate-700 dark:text-slate-300 text-sm">
              <div>
                <p className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">1. Kích hoạt tự động cuộn (React Hook / useRef):</p>
                <p className="mb-2 text-xs leading-relaxed font-medium text-slate-500">
                  Khi danh sách `selectedLetters` thay đổi, React Effect lắng nghe và cuộn container `.answer-zone` mượt mà về bên phải cùng (`scrollWidth`).
                </p>
                <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono">
{`const answerZoneRef = useRef<HTMLDivElement>(null);

// Lắng nghe thay đổi danh sách chữ để tự cuộn sang phải cùng
useEffect(() => {
  if (answerZoneRef.current) {
    answerZoneRef.current.scrollTo({
      left: answerZoneRef.current.scrollWidth,
      behavior: "smooth",
    });
  }
}, [selectedLetters]);`}
                </pre>
              </div>

              <div>
                <p className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">2. Triển khai Class CSS co nhỏ chữ cái:</p>
                <p className="mb-2 text-xs leading-relaxed font-medium text-slate-500">
                  Khi từ có nhiều hơn 6 chữ cái, thêm lớp class `.scale-down` vào `.answer-zone` để tự động điều chỉnh style kích cỡ các ô chữ.
                </p>
                <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono">
{`/* globals.css */

/* Co nhỏ khi có nhiều chữ cái */
.answer-zone.scale-down {
  gap: 4px;
  padding: 8px 12px;
}

.answer-zone.scale-down .letter-tile.in-answer {
  width: 40px;
  height: 46px;
  font-size: 1.1rem;
  border-width: 2px;
  border-bottom-width: 4px;
  border-radius: 10px;
}`}
                </pre>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800/40 p-4 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-black text-xs text-indigo-800 dark:text-indigo-300 mb-1 uppercase tracking-wide">Lưu ý bảo trì code</p>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Giải pháp này đã được cập nhật thành công vào mã nguồn chính tại 
                    <Link href="/interactive-test" className="text-indigo-600 dark:text-indigo-400 hover:underline"> src/app/interactive-test/page.tsx</Link> và 
                    <Link href="/globals.css" className="text-indigo-600 dark:text-indigo-400 hover:underline"> globals.css</Link>. Bạn có thể test trực tiếp trên cả hai đường dẫn `/interactive-test` và `/testdemo`.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
