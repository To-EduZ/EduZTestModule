"use client";

import React from "react";
import { Filter, Calendar, School, Users, RefreshCw } from "lucide-react";

interface AnalyticsFilterBarProps {
  schools: string[];
  classes: string[];
  selectedSchool: string;
  selectedClass: string;
  startDate: string;
  endDate: string;
  onSchoolChange: (school: string) => void;
  onClassChange: (className: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
  isApplying?: boolean;
}

export default function AnalyticsFilterBar({
  schools,
  classes,
  selectedSchool,
  selectedClass,
  startDate,
  endDate,
  onSchoolChange,
  onClassChange,
  onStartDateChange,
  onEndDateChange,
  onApply,
  isApplying = false,
}: AnalyticsFilterBarProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 w-full">
      <div className="flex flex-col md:flex-row items-end gap-4">
        {/* School Filter */}
        <div className="flex-1 w-full">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <School className="w-3.5 h-3.5" /> Trường học
          </label>
          <div className="relative">
            <select
              value={selectedSchool}
              onChange={(e) => onSchoolChange(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">Tất cả các trường</option>
              {schools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Class Filter */}
        <div className="flex-1 w-full">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Lớp học
          </label>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">Tất cả các lớp</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex-1 w-full flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" /> Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Apply Button */}
        <div className="w-full md:w-auto mt-4 md:mt-0">
          <button
            onClick={onApply}
            disabled={isApplying}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl px-6 py-2.5 font-bold transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            {isApplying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Filter className="w-4 h-4" />
            )}
            Lọc dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
}
