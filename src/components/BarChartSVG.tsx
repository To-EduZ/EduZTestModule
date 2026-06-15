"use client";

import React, { useState, useEffect, useRef } from "react";

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

const SKILLS = ["speaking", "listening", "reading", "writing"] as const;
type Skill = (typeof SKILLS)[number];

const COLORS: Record<Skill, { bar: string; glow: string; gradient: [string, string] }> = {
  speaking: {
    bar: "#3b82f6",
    glow: "rgba(59,130,246,0.25)",
    gradient: ["#60a5fa", "#1d4ed8"],
  },
  listening: {
    bar: "#10b981",
    glow: "rgba(16,185,129,0.25)",
    gradient: ["#34d399", "#047857"],
  },
  reading: {
    bar: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
    gradient: ["#fbbf24", "#b45309"],
  },
  writing: {
    bar: "#8b5cf6",
    glow: "rgba(139,92,246,0.25)",
    gradient: ["#a78bfa", "#6d28d9"],
  },
};

const LABELS: Record<Skill, string> = {
  speaking: "Nói",
  listening: "Nghe",
  reading: "Đọc",
  writing: "Viết",
};

export default function BarChartSVG({ data, height = 400 }: BarChartSVGProps) {
  const [hoveredBar, setHoveredBar] = useState<{
    groupIndex: number;
    skill: Skill;
    value: number;
    x: number;
    y: number;
  } | null>(null);
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger bar grow animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl gap-3"
        style={{ height, background: "var(--chart-empty-bg)" }}
      >
        <span className="text-4xl opacity-30">📊</span>
        <p className="font-semibold" style={{ color: "var(--chart-text)" }}>
          Chưa có dữ liệu thống kê
        </p>
      </div>
    );
  }

  const padding = { top: 48, right: 24, bottom: 70, left: 54 };
  const minWidth = 560;
  const width = Math.max(data.length * 160 + padding.left + padding.right, minWidth);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxVal = 100;
  const groupWidth = innerWidth / data.length;
  const totalBarArea = groupWidth * 0.78;
  const barWidth = totalBarArea / SKILLS.length;
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="relative w-full overflow-x-auto overflow-y-hidden custom-scrollbar" ref={containerRef}>
      <svg width={width} height={height} className="min-w-full block">
        <defs>
          {SKILLS.map((skill) => (
            <linearGradient key={skill} id={`bar-grad-${skill}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS[skill].gradient[0]} stopOpacity="1" />
              <stop offset="100%" stopColor={COLORS[skill].gradient[1]} stopOpacity="0.85" />
            </linearGradient>
          ))}
          {/* Drop shadow filter for hovered bars */}
          <filter id="bar-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.35" />
          </filter>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Y-axis grid lines + labels */}
          {yTicks.map((tick) => {
            const y = innerHeight - (tick / maxVal) * innerHeight;
            return (
              <g key={tick} transform={`translate(0, ${y})`}>
                <line
                  x1={0}
                  y1={0}
                  x2={innerWidth}
                  y2={0}
                  stroke="var(--chart-grid)"
                  strokeDasharray={tick === 0 ? "0" : "5 4"}
                  strokeWidth={tick === 0 ? 2 : 1}
                />
                <text
                  x={-12}
                  y={4}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight="600"
                  fill="var(--chart-text)"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X-axis line */}
          <line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={innerHeight}
            stroke="var(--chart-axis)"
            strokeWidth="2"
          />

          {/* Bars per group */}
          {data.map((item, i) => {
            const groupX = i * groupWidth + groupWidth * 0.11;
            return (
              <g key={i}>
                {/* Group label */}
                <text
                  x={i * groupWidth + groupWidth / 2}
                  y={innerHeight + 30}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="var(--chart-text-strong)"
                >
                  {item.label}
                </text>

                {/* Individual skill bars */}
                {SKILLS.map((skill, j) => {
                  const value = item.values[skill] || 0;
                  const animatedValue = animated ? value : 0;
                  const barHeight = (animatedValue / maxVal) * innerHeight;
                  const y = innerHeight - barHeight;
                  const x = groupX + j * barWidth;
                  const isHovered =
                    hoveredBar?.groupIndex === i && hoveredBar?.skill === skill;
                  const isOtherHovered =
                    hoveredBar !== null && !isHovered;

                  return (
                    <g
                      key={skill}
                      style={{
                        opacity: isOtherHovered ? 0.25 : 1,
                        transition: "opacity 0.25s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={() =>
                        setHoveredBar({
                          groupIndex: i,
                          skill,
                          value,
                          x: x + barWidth / 2 + padding.left,
                          y: y + padding.top,
                        })
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Glow background behind bar when hovered */}
                      {isHovered && (
                        <rect
                          x={x - 2}
                          y={y - 4}
                          width={barWidth}
                          height={barHeight + 8}
                          rx="7"
                          ry="7"
                          fill={COLORS[skill].glow}
                        />
                      )}
                      {/* The bar itself */}
                      <rect
                        x={x + 1}
                        y={y}
                        width={barWidth - 4}
                        height={Math.max(barHeight, 2)}
                        rx="5"
                        ry="5"
                        fill={`url(#bar-grad-${skill})`}
                        filter={isHovered ? "url(#bar-glow)" : undefined}
                        style={{ transition: "height 0.7s cubic-bezier(0.34,1.56,0.64,1), y 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}
                      />
                      {/* Value label on top */}
                      {isHovered && barHeight > 12 && (
                        <text
                          x={x + barWidth / 2 - 2}
                          y={y - 8}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="800"
                          fill={COLORS[skill].bar}
                        >
                          {Math.round(value)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>

        {/* Floating tooltip */}
        {hoveredBar && (() => {
          const tx = hoveredBar.x;
          const ty = hoveredBar.y;
          const tooltipW = 72;
          const tooltipH = 44;
          // Clamp x so tooltip doesn't overflow SVG
          const clampedTx = Math.min(Math.max(tx - tooltipW / 2, 4), width - tooltipW - 4);
          const tooltipY = Math.max(ty - tooltipH - 10, 4);

          return (
            <g>
              <rect
                x={clampedTx}
                y={tooltipY}
                width={tooltipW}
                height={tooltipH}
                rx="8"
                ry="8"
                fill="var(--chart-tooltip-bg)"
              />
              <text
                x={clampedTx + tooltipW / 2}
                y={tooltipY + 16}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="var(--chart-tooltip-text)"
              >
                {LABELS[hoveredBar.skill]}
              </text>
              <text
                x={clampedTx + tooltipW / 2}
                y={tooltipY + 32}
                textAnchor="middle"
                fontSize="16"
                fontWeight="900"
                fill={COLORS[hoveredBar.skill].gradient[0]}
              >
                {Math.round(hoveredBar.value)}
                <tspan fontSize="10" fontWeight="600" fill="var(--chart-tooltip-subtext)">
                  /100
                </tspan>
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-4 pb-1">
        {SKILLS.map((skill) => (
          <div key={skill} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: COLORS[skill].bar }}
            />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--chart-text-strong)" }}
            >
              {LABELS[skill]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
