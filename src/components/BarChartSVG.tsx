"use client";

import React, { useState } from "react";

interface BarChartData {
  label: string;
  values: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
}

interface BarChartSVGProps {
  data: BarChartData[];
  height?: number;
}

export default function BarChartSVG({ data, height = 400 }: BarChartSVGProps) {
  const [hoveredBar, setHoveredBar] = useState<{ groupIndex: number; skill: string; value: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl" style={{ height }}>
        <p className="text-slate-400 font-medium">Chưa có dữ liệu thống kê</p>
      </div>
    );
  }

  const padding = { top: 40, right: 20, bottom: 60, left: 50 };
  const width = Math.max(data.length * 150 + padding.left + padding.right, 600); // Dynamic width based on data length
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxVal = 100; // Scores are out of 100

  const skills = ["speaking", "listening", "reading", "writing"] as const;
  const colors = {
    speaking: "#3b82f6", // blue-500
    listening: "#10b981", // emerald-500
    reading: "#f59e0b", // amber-500
    writing: "#8b5cf6", // violet-500
  };
  const labels = {
    speaking: "Nói",
    listening: "Nghe",
    reading: "Đọc",
    writing: "Viết",
  };

  const groupWidth = innerWidth / data.length;
  const barWidth = (groupWidth * 0.8) / skills.length; // 80% of group width allocated to bars

  // Generate Y axis ticks
  const yTicks = [0, 20, 40, 60, 80, 100];

  return (
    <div className="relative w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
      <svg width={width} height={height} className="min-w-full">
        <defs>
          {skills.map((skill) => (
            <linearGradient key={skill} id={`grad-${skill}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[skill]} stopOpacity="0.9" />
              <stop offset="100%" stopColor={colors[skill]} stopOpacity="0.5" />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines and Y axis labels */}
          {yTicks.map((tick) => {
            const y = innerHeight - (tick / maxVal) * innerHeight;
            return (
              <g key={tick} transform={`translate(0, ${y})`}>
                <line x1={0} y1={0} x2={innerWidth} y2={0} stroke="#e2e8f0" strokeDasharray="4 4" className="dark:stroke-slate-700" />
                <text x={-10} y={4} textAnchor="end" fontSize="12" fill="#64748b" className="dark:fill-slate-400 font-medium">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X axis line */}
          <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#cbd5e1" strokeWidth="2" className="dark:stroke-slate-600" />

          {/* Bars and X axis labels */}
          {data.map((item, i) => {
            const groupX = i * groupWidth;
            return (
              <g key={i} transform={`translate(${groupX}, 0)`}>
                {/* Group Label */}
                <text
                  x={groupWidth / 2}
                  y={innerHeight + 25}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#334155"
                  className="dark:fill-slate-200"
                >
                  {item.label}
                </text>

                {/* Bars */}
                <g transform={`translate(${groupWidth * 0.1}, 0)`}>
                  {skills.map((skill, j) => {
                    const value = item.values[skill] || 0;
                    const barHeight = (value / maxVal) * innerHeight;
                    const y = innerHeight - barHeight;
                    const x = j * barWidth;
                    const isHovered = hoveredBar?.groupIndex === i && hoveredBar?.skill === skill;

                    return (
                      <g
                        key={skill}
                        onMouseEnter={() => setHoveredBar({ groupIndex: i, skill, value })}
                        onMouseLeave={() => setHoveredBar(null)}
                        className="cursor-pointer transition-all duration-300"
                        style={{ opacity: hoveredBar && !isHovered ? 0.3 : 1 }}
                      >
                        {/* The animated bar */}
                        <rect
                          x={x + 2} // small gap between bars
                          y={y}
                          width={barWidth - 4}
                          height={Math.max(barHeight, 0)}
                          fill={`url(#grad-${skill})`}
                          rx="4"
                          ry="4"
                          className="transition-all duration-700 ease-out"
                        />
                        
                        {/* Tooltip text when hovered */}
                        {isHovered && (
                          <g transform={`translate(${x + barWidth / 2}, ${y - 10})`}>
                            <rect
                              x="-20"
                              y="-20"
                              width="40"
                              height="22"
                              rx="4"
                              fill="#1e293b"
                              opacity="0.9"
                            />
                            <text
                              textAnchor="middle"
                              y="-6"
                              fill="white"
                              fontSize="12"
                              fontWeight="bold"
                            >
                              {Math.round(value)}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </g>
            );
          })}
        </g>
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
        {skills.map((skill) => (
          <div key={skill} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[skill] }} />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              {labels[skill]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
