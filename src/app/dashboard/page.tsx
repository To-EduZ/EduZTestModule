"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Home, PieChart, Users, TrendingUp, Target, Award, Search } from "lucide-react";
import AnalyticsFilterBar from "@/components/AnalyticsFilterBar";
import BarChartSVG from "@/components/BarChartSVG";
import LineChartSVG from "@/components/LineChartSVG";
import OverlayRadarChart from "@/components/OverlayRadarChart";

// Type definitions based on API returns
interface SummaryStats {
  totalStudents: number;
  totalTests: number;
  avgOverallScore: number;
  topStudents: {
    id: string;
    name: string;
    school: string;
    className: string;
    score: number;
    testsTaken: number;
  }[];
}

interface ChartDataPoint {
  label?: string; // For Bar chart
  date?: string; // For Line chart
  values?: { speaking: number; listening: number; reading: number; writing: number };
  speaking?: number;
  listening?: number;
  reading?: number;
  writing?: number;
}

export default function AnalyticsDashboard() {
  // Filters State
  const [schools, setSchools] = useState<string[]>(["TH Nguyễn Trãi", "TH Lê Quý Đôn", "TH Trần Quốc Toản"]);
  const [classes, setClasses] = useState<string[]>(["3A1", "3A2", "4A1", "4A2", "5A1", "5A2"]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  
  // Date defaults: Last 3 months
  const defaultTo = new Date().toISOString().split('T')[0];
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const defaultFrom = threeMonthsAgo.toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(defaultFrom);
  const [endDate, setEndDate] = useState(defaultTo);

  // Data State
  const [isApplying, setIsApplying] = useState(false);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  
  // Bar Chart State
  const [barChartMode, setBarChartMode] = useState<"class" | "school">("class");
  const [barData, setBarData] = useState<ChartDataPoint[]>([]);
  
  // Student Detail State
  const [searchStudentTerm, setSearchStudentTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentTimeline, setStudentTimeline] = useState<ChartDataPoint[]>([]);
  const [classAverageData, setClassAverageData] = useState<number[]>([0, 0, 0, 0]);

  // Initial Fetch & Apply Filters
  const fetchSummary = async () => {
    try {
      const url = new URL("/api/analytics/aggregate", window.location.origin);
      url.searchParams.append("groupBy", "summary");
      if (selectedSchool) url.searchParams.append("school", selectedSchool);
      if (selectedClass) url.searchParams.append("className", selectedClass);
      if (startDate) url.searchParams.append("from", startDate);
      if (endDate) url.searchParams.append("to", endDate);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        // Also auto-select the top student for the detail view if none selected
        if (!selectedStudent && data.summary.topStudents.length > 0) {
          selectStudentForDetail(data.summary.topStudents[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBarData = async (mode: "class" | "school") => {
    try {
      const url = new URL("/api/analytics/aggregate", window.location.origin);
      url.searchParams.append("groupBy", mode);
      if (selectedSchool) url.searchParams.append("school", selectedSchool);
      if (selectedClass) url.searchParams.append("className", selectedClass);
      if (startDate) url.searchParams.append("from", startDate);
      if (endDate) url.searchParams.append("to", endDate);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setBarData(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClassAverage = async (className: string) => {
    try {
      const url = new URL("/api/analytics/aggregate", window.location.origin);
      url.searchParams.append("groupBy", "class");
      url.searchParams.append("className", className);
      if (startDate) url.searchParams.append("from", startDate);
      if (endDate) url.searchParams.append("to", endDate);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const classVal = data.data[0].values;
        setClassAverageData([
          classVal.speaking || 0,
          classVal.listening || 0,
          classVal.reading || 0,
          classVal.writing || 0,
        ]);
      } else {
        setClassAverageData([0, 0, 0, 0]);
      }
    } catch (e) {
      console.error(e);
      setClassAverageData([0, 0, 0, 0]);
    }
  };

  const selectStudentForDetail = async (student: any) => {
    setSelectedStudent(student);
    try {
      const url = new URL("/api/analytics/aggregate", window.location.origin);
      url.searchParams.append("groupBy", "student");
      url.searchParams.append("studentId", student.id || student._id);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setStudentTimeline(data.data);
      }

      if (student && student.className) {
        await fetchClassAverage(student.className);
      } else {
        setClassAverageData([0, 0, 0, 0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyFilters = async () => {
    setIsApplying(true);
    const promises: Promise<any>[] = [
      fetchSummary(),
      fetchBarData(barChartMode)
    ];
    if (selectedStudent) {
      promises.push(selectStudentForDetail(selectedStudent));
    }
    await Promise.all(promises);
    setIsApplying(false);
  };

  useEffect(() => {
    handleApplyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load

  useEffect(() => {
    fetchBarData(barChartMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barChartMode]); // When switching tabs

  // Calculate Radar Data from timeline
  let radarBase = [0, 0, 0, 0];
  let radarCurrent = [0, 0, 0, 0];
  
  if (studentTimeline.length > 0) {
    // Get average of first half for base, and second half for current
    const mid = Math.floor(studentTimeline.length / 2) || 1;
    const firstHalf = studentTimeline.slice(0, mid);
    const sliced = studentTimeline.slice(mid);
    const secondHalf = sliced.length > 0 ? sliced : studentTimeline; // if only 1 item, both are same

    const getAvg = (arr: any[], key: string) => 
      arr.length === 0 ? 0 : arr.reduce((sum, item) => sum + (item[key] || 0), 0) / arr.length;
    
    radarBase = [
      getAvg(firstHalf, "speaking"),
      getAvg(firstHalf, "listening"),
      getAvg(firstHalf, "reading"),
      getAvg(firstHalf, "writing"),
    ];

    radarCurrent = [
      getAvg(secondHalf, "speaking"),
      getAvg(secondHalf, "listening"),
      getAvg(secondHalf, "reading"),
      getAvg(secondHalf, "writing"),
    ];
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 font-sans pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Breadcrumb */}
        <div>
          <nav className="flex text-sm text-slate-500 font-medium mb-4">
            <Link href="/" className="hover:text-indigo-600 flex items-center gap-1"><Home className="w-4 h-4"/> Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
            <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
            <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
            <span className="text-slate-800 dark:text-slate-200">Analytics</span>
          </nav>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <PieChart className="w-8 h-8 text-indigo-500" />
                EduZ Analytics Dashboard
              </h1>
              <p className="text-slate-500 font-medium mt-1">Phân tích chuyên sâu dữ liệu bài kiểm tra đầu vào và lộ trình phát triển.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Live Data Synchronized</span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
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
          onApply={handleApplyFilters}
          isApplying={isApplying}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Học sinh tham gia</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{summary?.totalStudents || 0}</h3>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Tổng lượt thi</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{summary?.totalTests || 0}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Điểm trung bình</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{summary?.avgOverallScore || 0}<span className="text-lg text-slate-400">/100</span></h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Top Học viên</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{summary?.topStudents?.[0]?.name || "N/A"}</h3>
            </div>
          </div>
        </div>

        {/* Global Statistics Section (Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Thống kê kỹ năng trung bình
              </h2>
              <p className="text-sm text-slate-500 mt-1">Phân bổ điểm số 4 kỹ năng theo nhóm.</p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setBarChartMode("class")}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${barChartMode === "class" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Theo Lớp học
              </button>
              <button
                onClick={() => setBarChartMode("school")}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${barChartMode === "school" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Theo Trường
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-x-auto">
            {/* Using arbitrary cast since barData structure maps perfectly to BarChartData when fetched from API */}
            <BarChartSVG data={barData as any} height={350} />
          </div>
        </div>

        {/* Individual Student Progression Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Leaderboard / Student Selector */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Bảng Xếp Hạng & Chọn Học sinh</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm học sinh..."
                  value={searchStudentTerm}
                  onChange={(e) => setSearchStudentTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[500px] p-2 custom-scrollbar">
              {summary?.topStudents
                .filter(s => s.name.toLowerCase().includes(searchStudentTerm.toLowerCase()))
                .map((student, idx) => (
                <button
                  key={student.id}
                  onClick={() => selectStudentForDetail(student)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all ${selectedStudent?.id === student.id ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"} border border-transparent`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? "bg-amber-100 text-amber-600" : idx === 1 ? "bg-slate-200 text-slate-600" : idx === 2 ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-blue-600"}`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{student.name}</p>
                    <p className="text-xs text-slate-500 truncate">{student.className} • {student.school}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-indigo-600 dark:text-indigo-400">{student.score}</p>
                    <p className="text-[10px] text-slate-400">{student.testsTaken} bài</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Individual Charts */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Top Right: Line Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Đường cong phát triển cá nhân: <span className="text-indigo-600">{selectedStudent?.name || "..."}</span>
                </h2>
                <p className="text-sm text-slate-500">Tiến độ điểm số 4 kỹ năng qua các bài kiểm tra gần đây.</p>
              </div>
              
              <LineChartSVG data={studentTimeline as any} height={300} />
            </div>

            {/* Grid for Radar Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Radar Chart 1: Internal Progress */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    So sánh tiến bộ nội tại
                  </h2>
                  <p className="text-sm text-slate-500">Giai đoạn đầu lộ trình vs. Giai đoạn hiện tại</p>
                </div>
                
                <div className="flex justify-center py-4">
                  {studentTimeline.length > 0 ? (
                    <OverlayRadarChart
                      baseData={radarBase}
                      currentData={radarCurrent}
                      labels={["Speaking", "Listening", "Reading", "Writing"]}
                      size={300}
                      baseLabel="Kỳ đánh giá trước"
                      currentLabel="Kỳ gần nhất"
                    />
                  ) : (
                    <p className="text-slate-400 font-medium py-10">Chọn học sinh để xem dữ liệu</p>
                  )}
                </div>
              </div>

              {/* Radar Chart 2: Comparison with Class Average */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    So sánh với trung bình lớp
                  </h2>
                  <p className="text-sm text-slate-500">
                    Trung bình lớp {selectedStudent?.className || "..."} vs. Học viên hiện tại
                  </p>
                </div>
                
                <div className="flex justify-center py-4">
                  {studentTimeline.length > 0 ? (
                    <OverlayRadarChart
                      baseData={classAverageData}
                      currentData={radarCurrent}
                      labels={["Speaking", "Listening", "Reading", "Writing"]}
                      size={300}
                      colors={{ base: "#3b82f6", current: "#8b5cf6" }}
                      baseLabel="Trung bình lớp"
                      currentLabel="Học viên"
                    />
                  ) : (
                    <p className="text-slate-400 font-medium py-10">Chọn học sinh để xem dữ liệu</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
