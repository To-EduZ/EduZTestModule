"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Home, Search, Calendar, User, Star, Award, 
  MessageSquare, Clock, Loader2, Sparkles, ChevronRight, BarChart3, Download, FileText, Share2
} from "lucide-react";
import { toPng, toBlob } from "html-to-image";
import jsPDF from "jspdf";
import { useRef } from "react";
import AnalyticsFilterBar from "@/components/AnalyticsFilterBar";

interface InteractiveSession {
  _id: string;
  kidName: string;
  kidAge: number;
  scores: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
  chatHistory: {
    role: "ai" | "user";
    content: string;
    stage: string;
    timestamp?: string;
  }[];
  studentStars: number | null;
  overallLevel: string;
  createdAt: string;
  updatedAt: string;
  school?: string;
  className?: string;
  phone?: string;
}

interface SummaryStats {
  totalTests: number;
  avgOverallScore: number;
  avgStars: number;
  starDistribution: Record<number, number>;
  ratedCount: number;
}

export default function InteractiveDashboard() {
  const [sessions, setSessions] = useState<InteractiveSession[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<InteractiveSession | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filters State
  const [schools, setSchools] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const withExpandedChat = async (callback: () => Promise<void>) => {
    const chatContainer = document.getElementById("chat-history-container");
    const origMaxHeight = chatContainer?.style.maxHeight;
    const origOverflow = chatContainer?.style.overflow;
    
    const wrapper = resultsRef.current;
    const origWrapperOverflow = wrapper?.style.overflow;
    const origWrapperHeight = wrapper?.style.height;
    
    if (chatContainer) {
      chatContainer.style.maxHeight = 'none';
      chatContainer.style.overflow = 'visible';
    }
    
    if (wrapper) {
      wrapper.style.overflow = 'visible';
      wrapper.style.height = 'max-content';
    }
    
    // Wait a tick for DOM layout update
    await new Promise(r => setTimeout(r, 150));
    
    try {
      await callback();
    } finally {
      if (chatContainer) {
        chatContainer.style.maxHeight = origMaxHeight || '';
        chatContainer.style.overflow = origOverflow || '';
      }
      if (wrapper) {
        wrapper.style.overflow = origWrapperOverflow || '';
        wrapper.style.height = origWrapperHeight || '';
      }
    }
  };

  const exportToImage = async () => {
    if (!resultsRef.current || !selectedSession) return;
    await withExpandedChat(async () => {
      try {
        const dataUrl = await toPng(resultsRef.current!, { cacheBust: true, pixelRatio: 2 });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `Chi_Tiet_Test_${selectedSession.kidName}_${new Date().getTime()}.png`;
        link.click();
      } catch (err) {
        console.error("Lỗi xuất ảnh:", err);
      }
    });
  };

  const exportToPDF = async () => {
    if (!resultsRef.current || !selectedSession) return;
    await withExpandedChat(async () => {
      try {
        const dataUrl = await toPng(resultsRef.current!, { cacheBust: true, pixelRatio: 2 });
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (resultsRef.current!.offsetHeight * pdfWidth) / resultsRef.current!.offsetWidth;
        
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Chi_Tiet_Test_${selectedSession.kidName}_${new Date().getTime()}.pdf`);
      } catch (err) {
        console.error("Lỗi xuất PDF:", err);
      }
    });
  };

  const shareToZalo = async () => {
    if (!resultsRef.current || !selectedSession) return;
    await withExpandedChat(async () => {
      try {
        const blob = await toBlob(resultsRef.current!, { cacheBust: true, pixelRatio: 2 });
        if (!blob) return;
        const file = new File([blob], `Ket_Qua_Test_${selectedSession.kidName}.png`, { type: "image/png" });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Kết quả bài kiểm tra',
              text: `Xem kết quả bài kiểm tra tiếng Anh của bé ${selectedSession.kidName}!`,
              files: [file]
            });
            return;
          } catch (err) {
            console.log("Share cancelled or failed", err);
          }
        }
        
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          alert("Đã sao chép ảnh kết quả! Bạn có thể dán (Ctrl+V) trực tiếp vào đoạn chat Zalo.");
        } catch (clipboardErr) {
          console.error("Clipboard error", clipboardErr);
          alert("Trình duyệt không hỗ trợ chia sẻ trực tiếp. Vui lòng 'Tải Ảnh' và gửi qua Zalo.");
        }
      } catch (err) {
        console.error("Lỗi tạo ảnh chia sẻ:", err);
      }
    });
  };

  const fetchSessions = async (currentSearch = searchTerm) => {
    try {
      setIsApplying(true);
      if (sessions.length === 0) setIsLoading(true);
      const url = new URL("/api/interactive-sessions", window.location.origin);
      if (currentSearch) url.searchParams.append("search", currentSearch);
      if (selectedSchool) url.searchParams.append("school", selectedSchool);
      if (selectedClass) url.searchParams.append("className", selectedClass);
      if (startDate) url.searchParams.append("from", startDate);
      if (endDate) url.searchParams.append("to", endDate);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Lỗi lấy danh sách phiên làm bài:", e);
    } finally {
      setIsLoading(false);
      setIsApplying(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/app-config");
      const data = await res.json();
      if (data.success) {
        setSchools(data.data.schools || []);
        setClasses(data.data.classes || []);
      }
    } catch (error) {
      console.error("Lỗi lấy config:", error);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchSessions();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(searchTerm);
  };

  const handleExportExcel = async () => {
    if (sessions.length === 0) return;
    try {
      const XLSX = await import("xlsx");
      const exportData = sessions.map((s, index) => {
        const overallScore = getOverallAvgScore(s.scores);
        return {
          "STT": index + 1,
          "Tên Học Viên": s.kidName,
          "Tuổi": s.kidAge,
          "Trường": s.school || "Chưa cập nhật",
          "Lớp": s.className || "Chưa cập nhật",
          "SĐT": s.phone || "Chưa cập nhật",
          "Ngày Thi": formatDate(s.createdAt),
          "Trình độ đánh giá": s.overallLevel,
          "Nghe": s.scores.listening,
          "Nói": s.scores.speaking,
          "Đọc": s.scores.reading,
          "Viết": s.scores.writing,
          "Điểm Trung Bình": overallScore,
          "Mức độ hài lòng": s.studentStars ? `${s.studentStars} Sao` : "Chưa đánh giá"
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Lich_Su_Hoi_Thoai_AI");
      XLSX.writeFile(workbook, `Bao_Cao_Hoi_Thoai_AI_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error);
    }
  };

  const getOverallAvgScore = (scores: InteractiveSession["scores"]) => {
    return Math.round((scores.speaking + scores.listening + scores.reading + scores.writing) / 4);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-10 font-sans pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <nav className="flex text-sm text-slate-500 font-medium mb-4">
          <Link href="/" className="hover:text-indigo-600 flex items-center gap-1">
            <Home className="w-4 h-4" /> Home
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          <Link href="/dashboard" className="hover:text-indigo-600">Báo Cáo</Link>
          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          <span className="text-slate-800 dark:text-slate-200">Hội Thoại AI</span>
        </nav>

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-sky-500 animate-pulse" />
              Lịch Sử Hội Thoại Cô Giáo AI 👩‍🏫
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Xem chi tiết trải nghiệm hội thoại, điểm số 4 kỹ năng và đánh giá sao từ các học sinh.
            </p>
          </div>
          <Link 
            href="/dashboard"
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
          </Link>
        </div>

        {/* Filters */}
        <AnalyticsFilterBar
          schools={schools}
          classes={classes}
          selectedSchool={selectedSchool}
          selectedClass={selectedClass}
          startDate={startDate}
          endDate={endDate}
          onSchoolChange={setSelectedSchool}
          onClassChange={setSelectedClass}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onApply={() => fetchSessions()}
          isApplying={isApplying}
        />

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stat 1: Total Tests */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Tổng lượt test</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white block mt-0.5">{stats.totalTests}</span>
              </div>
              <div className="absolute right-0 bottom-0 text-sky-100/30 dark:text-sky-950/10 text-7xl font-black select-none pointer-events-none transform translate-y-4">💬</div>
            </div>

            {/* Stat 2: Avg Score */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Điểm trung bình</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white block mt-0.5">{stats.avgOverallScore}/100</span>
              </div>
              <div className="absolute right-0 bottom-0 text-emerald-100/30 dark:text-emerald-950/10 text-7xl font-black select-none pointer-events-none transform translate-y-4">📊</div>
            </div>

            {/* Stat 3: Avg Stars */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Độ hài lòng của bé</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white block mt-0.5">
                  {stats.avgStars > 0 ? `${stats.avgStars} ★` : "Chưa có"}
                </span>
              </div>
              <div className="absolute right-0 bottom-0 text-amber-100/30 dark:text-amber-950/10 text-7xl font-black select-none pointer-events-none transform translate-y-4">⭐</div>
            </div>

            {/* Stat 4: Star Rating Distribution Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2 md:col-span-1">
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Phân bố khảo sát bé</span>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((starNum) => {
                  const count = stats.starDistribution[starNum] || 0;
                  const pct = stats.ratedCount > 0 ? (count / stats.ratedCount) * 100 : 0;
                  return (
                    <div key={starNum} className="flex items-center gap-2 text-[10px]">
                      <span className="w-8 text-right font-black text-slate-600 dark:text-slate-400">{starNum} Sao</span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-left font-black text-slate-550 dark:text-slate-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar Form */}
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex-1 flex gap-2.5 max-w-md">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên học sinh..."
                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2.5 rounded-full text-sm font-extrabold shadow-sm focus:border-indigo-400 focus:outline-none transition-colors dark:text-white"
              />
            </div>
            <button type="submit" className="btn-3d-indigo px-6 py-2.5 text-xs font-black rounded-full shrink-0">
              Tìm kiếm
            </button>
          </form>
          
          <button 
            onClick={handleExportExcel}
            className="px-5 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold rounded-full flex justify-center items-center gap-2 transition-all shadow-sm shrink-0 border border-emerald-200 dark:border-emerald-800"
            title="Xuất Báo Cáo Excel"
          >
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
        </div>

        {/* Sessions Table Layout */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <span className="text-sm font-black text-slate-550 dark:text-slate-400">Đang tải danh sách bài thi...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-20 text-center text-slate-450 dark:text-slate-500 font-extrabold space-y-2">
              <p className="text-3xl">📭</p>
              <p className="text-sm">Không tìm thấy phiên làm bài nào phù hợp.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-550 font-black">
                    <th className="py-4.5 px-6">Ngày thi</th>
                    <th className="py-4.5 px-6">Học sinh</th>
                    <th className="py-4.5 px-6">Tuổi</th>
                    <th className="py-4.5 px-6">Điểm TB</th>
                    <th className="py-4.5 px-6">Trình độ YLE</th>
                    <th className="py-4.5 px-6 text-center">Bé đánh giá</th>
                    <th className="py-4.5 px-6 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {sessions.map((session) => {
                    const avg = getOverallAvgScore(session.scores);
                    return (
                      <tr key={session._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="py-4 px-6 text-slate-500 font-mono">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {formatDate(session.createdAt)}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-black text-slate-800 dark:text-slate-100">
                          {session.kidName}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-extrabold">
                          {session.kidAge} tuổi
                        </td>
                        <td className="py-4 px-6 font-black">
                          <span className={`inline-block px-2.5 py-0.8 rounded-lg ${avg >= 85 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : avg >= 60 ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                            {avg}/100
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-850 px-2 py-0.5 rounded-lg text-indigo-600 dark:text-indigo-400 font-extrabold">
                            {session.overallLevel}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {session.studentStars !== null && session.studentStars !== undefined ? (
                            <span className="text-amber-400 text-sm tracking-wide">
                              {"★".repeat(session.studentStars)}
                              <span className="text-slate-200 dark:text-slate-700">
                                {"★".repeat(5 - session.studentStars)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600 italic text-[10px]">Chưa chấm</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white px-3 py-1.5 rounded-xl transition-all font-black text-[11px] cursor-pointer"
                          >
                            Xem Chi Tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Details Side-Drawer Modal Overlay */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 z-50 flex justify-end animate-fade-in select-none">
          {/* Backdrop Closer */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedSession(null)} />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-slide-in overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-6 border-b-2 border-slate-100 dark:border-slate-850 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center border border-sky-100">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                    Bài thi của {selectedSession.kidName}
                  </h2>
                  <p className="text-xs text-slate-450 dark:text-slate-500 font-extrabold flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {formatDate(selectedSession.createdAt)} • {selectedSession.kidAge} tuổi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900" ref={resultsRef}>
              
              {/* Star Rating & YLE Certificate Level Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Level Badge */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-150 dark:border-indigo-900/50 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <span className="text-[10px] font-black text-indigo-405 uppercase tracking-wider block">Trình độ Cambridge</span>
                    <span className="text-base font-black text-slate-805 dark:text-white">{selectedSession.overallLevel}</span>
                  </div>
                </div>

                {/* Stars Rating */}
                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-150 dark:border-amber-900/50 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-3xl">⭐</span>
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">Độ hài lòng của bé</span>
                    <span className="text-base font-black text-slate-805 dark:text-white">
                      {selectedSession.studentStars !== null && selectedSession.studentStars !== undefined ? (
                        <span className="text-amber-400 tracking-wide">
                          {"★".repeat(selectedSession.studentStars)}
                          <span className="text-slate-200 dark:text-slate-700">
                            {"★".repeat(5 - selectedSession.studentStars)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa đánh giá</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills Score breakdown */}
              <div className="bg-slate-50 dark:bg-slate-850/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-3.5">
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-500" /> Điểm số chi tiết 4 kỹ năng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Speaking */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-650 dark:text-slate-350">Speaking (Nói) 🎤</span>
                      <span className="font-extrabold">{selectedSession.scores.speaking}/100</span>
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectedSession.scores.speaking}%` }} />
                    </div>
                  </div>

                  {/* Listening */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-650 dark:text-slate-350">Listening (Nghe) 🎧</span>
                      <span className="font-extrabold">{selectedSession.scores.listening}/100</span>
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${selectedSession.scores.listening}%` }} />
                    </div>
                  </div>

                  {/* Reading */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-650 dark:text-slate-350">Reading (Đọc) 📖</span>
                      <span className="font-extrabold">{selectedSession.scores.reading}/100</span>
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${selectedSession.scores.reading}%` }} />
                    </div>
                  </div>

                  {/* Writing */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-650 dark:text-slate-350">Writing (Viết) ✍️</span>
                      <span className="font-extrabold">{selectedSession.scores.writing}/100</span>
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${selectedSession.scores.writing}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Chat History Transcript */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-sky-500" /> Nhật ký hội thoại AI chi tiết
                </h3>

                <div id="chat-history-container" className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-96 overflow-y-auto space-y-4 font-sans text-xs">
                  {selectedSession.chatHistory.length === 0 ? (
                    <p className="text-center italic text-slate-400 py-10">Không ghi nhận được đoạn chat nào.</p>
                  ) : (
                    selectedSession.chatHistory.map((msg, index) => {
                      const isAi = msg.role === "ai";
                      return (
                        <div key={index} className={`flex flex-col ${isAi ? "items-start" : "items-end"}`}>
                          {/* Stage details */}
                          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1.5 mb-1 block">
                            {msg.stage.toUpperCase()}
                          </span>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-bold leading-relaxed shadow-sm ${isAi ? "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none" : "bg-indigo-600 text-white rounded-tr-none"}`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-850 shrink-0 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={exportToImage}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-black py-3 rounded-2xl flex justify-center items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" /> Tải Ảnh
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-black py-3 rounded-2xl flex justify-center items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Xuất PDF
                </button>
                <button
                  onClick={shareToZalo}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-black py-3 rounded-2xl flex justify-center items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-4 h-4" /> Gửi Zalo
                </button>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full bg-slate-100 hover:bg-slate-250 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-black py-3 rounded-2xl cursor-pointer"
              >
                Đóng chi tiết
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
