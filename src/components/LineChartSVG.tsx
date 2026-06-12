"use client";

import React, { useState } from "react";

interface LineChartData {
  date: string;
  speaking: number;
  listening: number;
  reading: number;
  writing: number;
}

interface LineChartSVGProps {
  data: LineChartData[];
  height?: number;
}

export default function LineChartSVG({ data, height = 400 }: LineChartSVGProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; skill: string; value: number; x: number; y: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl" style={{ height }}>
        <p className="text-slate-400 font-medium">Chưa có dữ liệu thống kê qua thời gian</p>
      </div>
    );
  }

  const padding = { top: 40, right: 40, bottom: 60, left: 50 };
  const width = Math.max(data.length * 100 + padding.left + padding.right, 600);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxVal = 100;

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

  // Helper to format date string to just DD/MM
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  const xStep = innerWidth / Math.max(data.length - 1, 1);
  const yTicks = [0, 20, 40, 60, 80, 100];

  return (
    <div className="relative w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
      <svg width={width} height={height} className="min-w-full">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines and Y axis labels */}
          {yTicks.map((tick) => {
            const y = innerHeight - (tick / maxVal) * innerHeight;
            return (
              <g key={`y-${tick}`} transform={`translate(0, ${y})`}>
                <line x1={0} y1={0} x2={innerWidth} y2={0} stroke="#e2e8f0" strokeDasharray="4 4" className="dark:stroke-slate-700" />
                <text x={-10} y={4} textAnchor="end" fontSize="12" fill="#64748b" className="dark:fill-slate-400 font-medium">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X axis line */}
          <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#cbd5e1" strokeWidth="2" className="dark:stroke-slate-600" />

          {/* X axis labels */}
          {data.map((item, i) => {
            const x = i * xStep;
            return (
              <text
                key={`x-${i}`}
                x={x}
                y={innerHeight + 25}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#334155"
                className="dark:fill-slate-300"
              >
                {formatDate(item.date)}
              </text>
            );
          })}

          {/* Lines and Points */}
          {skills.map((skill) => {
            // Generate path data
            let d = "";
            data.forEach((item, i) => {
              const x = i * xStep;
              const y = innerHeight - (item[skill] / maxVal) * innerHeight;
              if (i === 0) d += `M ${x} ${y} `;
              else d += `L ${x} ${y} `;
            });

            const isFaded = hoveredPoint && hoveredPoint.skill !== skill;

            return (
              <g key={skill} style={{ opacity: isFaded ? 0.2 : 1, transition: "opacity 0.3s" }}>
                {/* Line */}
                <path
                  d={d}
                  fill="none"
                  stroke={colors[skill]}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-700 ease-out drop-shadow-sm"
                  style={{
                    strokeDasharray: "2000",
                    strokeDashoffset: "0", // Could be animated from 2000 to 0
                  }}
                />

                {/* Points */}
                {data.map((item, i) => {
                  const x = i * xStep;
                  const y = innerHeight - (item[skill] / maxVal) * innerHeight;
                  const isHovered = hoveredPoint?.x === x && hoveredPoint?.y === y;

                  return (
                    <g key={`point-${skill}-${i}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 4}
                        fill="white"
                        stroke={colors[skill]}
                        strokeWidth="2"
                        className="cursor-pointer transition-all duration-200 hover:r-6"
                        onMouseEnter={() => setHoveredPoint({ date: formatDate(item.date), skill, value: item[skill], x, y })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Tooltip Overlay (drawn last so it stays on top) */}
          {hoveredPoint && (
            <g transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y - 15})`}>
              <rect x="-30" y="-35" width="60" height="30" rx="6" fill="#1e293b" opacity="0.95" />
              <text x="0" y="-22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                {labels[hoveredPoint.skill as keyof typeof labels]}: {Math.round(hoveredPoint.value)}
              </text>
              <text x="0" y="-10" textAnchor="middle" fill="#94a3b8" fontSize="10">
                {hoveredPoint.date}
              </text>
              <polygon points="-5,-5 5,-5 0,0" fill="#1e293b" opacity="0.95" />
            </g>
          )}
        </g>
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
        {skills.map((skill) => (
          <div key={skill} className="flex items-center gap-2">
            <span className="w-4 h-1 rounded-full" style={{ backgroundColor: colors[skill] }} />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              {labels[skill]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
