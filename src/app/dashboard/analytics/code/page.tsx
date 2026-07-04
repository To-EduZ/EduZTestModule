"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Trophy, Search, Users, Star, ArrowLeft, Download, FileSpreadsheet, 
  HelpCircle, CheckCircle2, AlertCircle, BarChart3, Clock, GraduationCap
} from "lucide-react";
import DevelopmentRadarChart from "@/components/DevelopmentRadarChart";

interface StudentReport {
  _id: string;
  kidName: string;
  kidAge: number;
  scores: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
  overallLevel: string;
  studentStars: number | null;
  createdAt: string;
}

interface AnalyticsData {
  testCode: string;
  totalSubmissions: number;
  avgSpeaking: number;
  avgListening: number;
  avgReading: number;
  avgWriting: number;
  avgStars: number | null;
  students: StudentReport[];
}

export default function ExamAnalytics() {
  const [testCodeInput, setTestCodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCodeInput.trim()) return;

    setLoading(true);
    setError("");
    setAnalytics(null);

    try {
      const res = await fetch(`/api/analytics/test-code?code=${encodeURIComponent(testCodeInput.trim())}`);
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tải thống kê cho mã thi này!");
      }

      setAnalytics(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!analytics || analytics.students.length === 0) return;

    // Build CSV Content
    const headers = ["Tên học sinh", "Tuổi", "Điểm Nói (Speaking)", "Điểm Nghe (Listening)", "Điểm Đọc (Reading)", "Điểm Viết (Writing)", "Trình độ chung", "Đánh giá sao", "Thời gian nộp"];
    const rows = analytics.students.map(s => [
      s.kidName,
      s.kidAge,
      s.scores.speaking,
      s.scores.listening,
      s.scores.reading,
      s.scores.writing,
      s.overallLevel,
      s.studentStars !== null ? s.studentStars : "Chưa đánh giá",
      new Date(s.createdAt).toLocaleString("vi-VN")
    ]);

    const csvContent = "\uFEFF" + [ // BOM for UTF-8 Excel support
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Báo_cáo_phòng_thi_${analytics.testCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = analytics?.students.filter(s => 
    s.kidName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.overallLevel.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const radarData = analytics ? [
    { label: "Speaking", value: analytics.avgSpeaking, emoji: "🗣️" },
    { label: "Listening", value: analytics.avgListening, emoji: "🎧" },
    { label: "Reading", value: analytics.avgReading, emoji: "📖" },
    { label: "Writing", value: analytics.avgWriting, emoji: "✏️" }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 text-slate-800 dark:text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <Link href="/dashboard/import" className="inline-flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-indigo-500 mb-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> QUAY LẠI TRANG QUẢN TRỊ
            </Link>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-indigo-500" /> Báo Cáo Thống Kê Phòng Thi
            </h1>
          </div>
          
          {/* Search bar room code */}
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <input 
              required
              type="text" 
              value={testCodeInput} 
              onChange={e => setTestCodeInput(e.target.value)} 
              className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold text-sm flex-1 sm:w-64 focus:border-indigo-500 transition-colors" 
              placeholder="Nhập mã phòng thi (testCode)..." 
            />
            <button 
              type="submit" 
              disabled={loading}
              className="btn-3d-blue px-5 font-black text-sm shrink-0 flex items-center gap-1"
            >
              <Search className="w-4 h-4" /> TẢI BÁO CÁO
            </button>
          </form>
        </div>

        {/* Loading/Error states */}
        {loading && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-850 shadow-md">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
            <p className="font-bold text-slate-500">Đang truy xuất và phân tích số liệu phòng thi...</p>
          </div>
        )}

        {error && (
          <div className="p-5 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 text-red-800 dark:text-red-400 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-extrabold text-sm">Có lỗi xảy ra!</p>
              <p className="text-xs font-semibold mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state when no report loaded yet */}
        {!analytics && !loading && !error && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border-4 border-dashed border-slate-200 dark:border-slate-800 max-w-2xl mx-auto">
            <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-bounce" style={{ animationDuration: "3s" }} />
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">Nhập mã phòng thi để phân tích</h3>
            <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
              Nhập mã testCode mà bạn đã thiết lập cho đề thi (ví dụ: MID_TERM_A). Hệ thống sẽ tổng hợp tất cả kết quả nộp bài của học sinh để vẽ biểu đồ và xuất báo cáo.
            </p>
          </div>
        )}

        {/* Report Content */}
        {analytics && (
          <div className="space-y-6">
            
            {/* Quick stats and chart grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Radar Chart */}
              <div className="lg:col-span-1 flex flex-col justify-between">
                {analytics.totalSubmissions > 0 ? (
                  <DevelopmentRadarChart 
                    data={radarData} 
                    size={300}
                    colorScheme="violet"
                    title={`NĂNG LỰC TRUNG BÌNH (${analytics.totalSubmissions} BÀI)`}
                  />
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-center h-80">
                    <p className="text-xs font-bold text-slate-400 text-center">Chưa có bài thi nào được hoàn thành để vẽ biểu đồ.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Key Metrics & summarycards */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Metric Submissions */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng số bài nộp</span>
                    <span className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5 block">
                      {analytics.totalSubmissions}
                    </span>
                  </div>
                </div>

                {/* Metric Stars feedback */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl border border-amber-100 dark:border-amber-900">
                    <Star className="w-7 h-7 fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Đánh giá trung bình</span>
                    <span className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5 block">
                      {analytics.avgStars ? `${analytics.avgStars} / 5` : "Chưa có"}
                    </span>
                  </div>
                </div>

                {/* Detailed Skills averages list */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-100 dark:border-slate-800 shadow-sm sm:col-span-2 space-y-3">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Điểm trung bình chi tiết các kỹ năng:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    
                    {/* Speaking */}
                    <div className="bg-violet-50/50 dark:bg-violet-950/20 p-3 rounded-2xl border border-violet-100 dark:border-violet-900 text-center">
                      <span className="text-[10px] font-black text-violet-500 block uppercase">Speaking</span>
                      <span className="text-2xl font-black text-violet-700 dark:text-violet-400 font-mono mt-1 block">
                        {analytics.avgSpeaking}
                      </span>
                    </div>

                    {/* Listening */}
                    <div className="bg-sky-50/50 dark:bg-sky-950/20 p-3 rounded-2xl border border-sky-100 dark:border-sky-900 text-center">
                      <span className="text-[10px] font-black text-sky-500 block uppercase">Listening</span>
                      <span className="text-2xl font-black text-sky-700 dark:text-sky-400 font-mono mt-1 block">
                        {analytics.avgListening}
                      </span>
                    </div>

                    {/* Reading */}
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900 text-center">
                      <span className="text-[10px] font-black text-emerald-500 block uppercase">Reading</span>
                      <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1 block">
                        {analytics.avgReading}
                      </span>
                    </div>

                    {/* Writing */}
                    <div className="bg-pink-50/50 dark:bg-pink-950/20 p-3 rounded-2xl border border-pink-100 dark:border-pink-900 text-center">
                      <span className="text-[10px] font-black text-pink-500 block uppercase">Writing</span>
                      <span className="text-2xl font-black text-pink-700 dark:text-pink-400 font-mono mt-1 block">
                        {analytics.avgWriting}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Students submissions table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 dark:border-slate-800 p-6 shadow-md flex flex-col space-y-4">
              
              {/* Table search & Export Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Danh sách học sinh làm bài
                  </h3>
                  <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs px-2.5 py-0.5 rounded-full">
                    {filteredStudents.length} bài thi
                  </span>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-1.5 font-bold text-xs w-full sm:w-48 focus:border-indigo-400 transition-colors" 
                    placeholder="Tìm tên hoặc level..." 
                  />
                  <button 
                    onClick={handleExportCSV}
                    disabled={analytics.students.length === 0}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm hover:scale-105 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> XUẤT EXCEL (CSV)
                  </button>
                </div>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-black uppercase">
                      <th className="p-3">Học sinh</th>
                      <th className="p-3 text-center">Tuổi</th>
                      <th className="p-3 text-center">Speaking</th>
                      <th className="p-3 text-center">Listening</th>
                      <th className="p-3 text-center">Reading</th>
                      <th className="p-3 text-center">Writing</th>
                      <th className="p-3">Xếp loại</th>
                      <th className="p-3 text-center">Sao</th>
                      <th className="p-3">Ngày nộp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                          Không tìm thấy kết quả phù hợp!
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-extrabold text-slate-700 dark:text-slate-100">{s.kidName}</td>
                          <td className="p-3 text-center font-bold text-slate-500">{s.kidAge}</td>
                          <td className="p-3 text-center font-bold font-mono text-violet-600">{s.scores.speaking}</td>
                          <td className="p-3 text-center font-bold font-mono text-sky-600">{s.scores.listening}</td>
                          <td className="p-3 text-center font-bold font-mono text-emerald-600">{s.scores.reading}</td>
                          <td className="p-3 text-center font-bold font-mono text-pink-600">{s.scores.writing}</td>
                          <td className="p-3 font-black">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                              s.overallLevel.includes("Flyers") 
                                ? "bg-violet-100 text-violet-700" 
                                : s.overallLevel.includes("Movers")
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}>
                              {s.overallLevel}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-amber-500">
                            {s.studentStars ? `⭐ ${s.studentStars}` : "Chưa đánh giá"}
                          </td>
                          <td className="p-3 text-slate-400 font-medium">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(s.createdAt).toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit"
                              })}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
