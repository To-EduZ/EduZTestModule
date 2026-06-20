"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

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

type Skill = "speaking" | "listening" | "reading" | "writing";

const SKILLS: Skill[] = ["speaking", "listening", "reading", "writing"];

const COLORS: Record<Skill, { line: string; area: string; dot: string }> = {
  speaking: { line: "#00A2FF", area: "rgba(0,162,255,0.15)", dot: "#007BB5" },
  listening: { line: "#00D084", area: "rgba(0,208,132,0.15)", dot: "#00A368" },
  reading: { line: "#FFC800", area: "rgba(255,200,0,0.15)", dot: "#E0A800" },
  writing: { line: "#A855F7", area: "rgba(168,85,247,0.15)", dot: "#8235BF" },
};

const LABELS: Record<Skill, string> = {
  speaking: "Nói",
  listening: "Nghe",
  reading: "Đọc",
  writing: "Viết",
};

// ─── Catmull-Rom spline → SVG path ───────────────────────────────────────────
// Produces smooth curves through data points (no overshooting).
function catmullRomPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  const alpha = 0.5; // centripetal Catmull-Rom
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) * alpha;
    const cp1y = p1.y + (p2.y - p0.y) * alpha;
    const cp2x = p2.x - (p3.x - p1.x) * alpha;
    const cp2y = p2.y - (p3.y - p1.y) * alpha;

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

// Build area path (closes below the line to y=innerHeight)
function areaPath(points: { x: number; y: number }[], innerHeight: number): string {
  if (points.length < 2) return "";
  const linePath = catmullRomPath(points);
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  return `${linePath} L ${lastPt.x} ${innerHeight} L ${firstPt.x} ${innerHeight} Z`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LineChartSVG({ data, height = 400 }: LineChartSVGProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeLine, setActiveLine] = useState<Skill | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, [data]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  const padding = { top: 44, right: 40, bottom: 64, left: 54 };
  const minWidth = 520;
  const dataLength = data ? data.length : 0;
  const width = Math.max(dataLength * 110 + padding.left + padding.right, minWidth);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxVal = 100;
  
  // Dynamic scale calculation to amplify differences
  const allValues = data ? data.flatMap(d => [d.speaking, d.listening, d.reading, d.writing]).filter(v => v !== undefined && v !== null && !isNaN(v)) : [];
  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  let minScore = 0;
  if (dataMin >= 75) minScore = 60;
  else if (dataMin >= 55) minScore = 40;
  else if (dataMin >= 35) minScore = 20;
  const scoreRange = maxVal - minScore;

  const yTicks = [
    minScore,
    minScore + scoreRange * 0.25,
    minScore + scoreRange * 0.5,
    minScore + scoreRange * 0.75,
    maxVal
  ];

  const xStep = innerWidth / Math.max(dataLength - 1, 1);

  // Pre-compute points per skill
  const skillPoints = useMemo(() => {
    const map: Record<Skill, { x: number; y: number }[]> = {
      speaking: [],
      listening: [],
      reading: [],
      writing: [],
    };
    if (!data || data.length === 0) {
      return map;
    }
    data.forEach((item, i) => {
      const x = i * xStep;
      SKILLS.forEach((skill) => {
        const val = mounted ? (item[skill] ?? 0) : 0;
        map[skill].push({ x, y: innerHeight - ((Math.max(val, minScore) - minScore) / scoreRange) * innerHeight });
      });
    });
    return map;
  }, [data, xStep, innerHeight, mounted]);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl gap-3"
        style={{ height, background: "var(--chart-empty-bg)" }}
      >
        <span className="text-4xl opacity-30">📈</span>
        <p className="font-semibold" style={{ color: "var(--chart-text)" }}>
          Chưa có dữ liệu thống kê qua thời gian
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
      <svg width={width} height={height} className="min-w-full block">
        <defs>
          {SKILLS.map((skill) => (
            <linearGradient key={skill} id={`area-grad-${skill}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS[skill].line} stopOpacity="0.18" />
              <stop offset="100%" stopColor={COLORS[skill].line} stopOpacity="0.01" />
            </linearGradient>
          ))}
          <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines + Y labels */}
          {yTicks.map((tick) => {
            const y = innerHeight - ((tick - minScore) / scoreRange) * innerHeight;
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
                  fontSize="14"
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

          {/* Vertical crosshair at hovered index */}
          {hoveredIndex !== null && (
            <line
              x1={hoveredIndex * xStep}
              y1={0}
              x2={hoveredIndex * xStep}
              y2={innerHeight}
              stroke="var(--chart-text)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.4"
            />
          )}

          {/* X-axis labels */}
          {data.map((item, i) => (
            <text
              key={`x-${i}`}
              x={i * xStep}
              y={innerHeight + 24}
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill="var(--chart-text-strong)"
            >
              {formatDate(item.date)}
            </text>
          ))}

          {/* Area fills (behind lines) */}
          {SKILLS.map((skill) => {
            const pts = skillPoints[skill];
            const isActive = activeLine === null || activeLine === skill;
            return (
              <path
                key={`area-${skill}`}
                d={areaPath(pts, innerHeight)}
                fill="transparent"
                style={{ opacity: isActive ? 1 : 0.05, transition: "opacity 0.3s" }}
              />
            );
          })}

          {/* Lines */}
          {SKILLS.map((skill) => {
            const pts = skillPoints[skill];
            const isActive = activeLine === null || activeLine === skill;
            return (
              <path
                key={`line-${skill}`}
                d={catmullRomPath(pts)}
                fill="none"
                stroke={COLORS[skill].line}
                strokeWidth={activeLine === skill ? 5 : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={activeLine === skill ? "url(#line-glow)" : undefined}
                style={{
                  opacity: isActive ? 1 : 0.25,
                  transition: "opacity 0.3s, stroke-width 0.2s",
                }}
              />
            );
          })}

          {/* Data points */}
          {SKILLS.map((skill) =>
            skillPoints[skill].map((pt, i) => {
              const isHoverIdx = hoveredIndex === i;
              const isActive = activeLine === null || activeLine === skill;
              return (
                <circle
                  key={`pt-${skill}-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={isHoverIdx && isActive ? 8 : 4.5}
                  fill={isHoverIdx ? COLORS[skill].dot : "white"}
                  stroke={COLORS[skill].line}
                  strokeWidth={isHoverIdx ? 3.5 : 2.5}
                  style={{
                    opacity: isActive ? 1 : 0.25,
                    transition: "r 0.2s ease, opacity 0.3s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => {
                    setHoveredIndex(i);
                    setActiveLine(skill);
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    setActiveLine(null);
                  }}
                />
              );
            })
          )}

          {/* Tooltip: show all 4 skills at hovered index */}
          {hoveredIndex !== null && (() => {
            const item = data[hoveredIndex];
            const x = hoveredIndex * xStep;
            const tooltipW = 130;
            const tooltipH = 115;
            const tooltipX = Math.min(Math.max(x - tooltipW / 2, 0), innerWidth - tooltipW);
            const lowestY = Math.min(...SKILLS.map((s) => skillPoints[s][hoveredIndex]?.y ?? innerHeight));
            const tooltipY = Math.max(lowestY - tooltipH - 16, 2);

            return (
              <g>
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipW}
                  height={tooltipH}
                  rx="10"
                  fill="var(--chart-tooltip-bg)"
                />
                <text
                  x={tooltipX + tooltipW / 2}
                  y={tooltipY + 16}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="var(--chart-tooltip-subtext)"
                >
                  {formatDate(item.date)}
                </text>
                {SKILLS.map((skill, si) => (
                  <g key={skill}>
                    <circle
                      cx={tooltipX + 12}
                      cy={tooltipY + 33 + si * 20}
                      r={4}
                      fill={COLORS[skill].line}
                    />
                    <text
                      x={tooltipX + 22}
                      y={tooltipY + 38 + si * 20}
                      fontSize="14"
                      fontWeight="600"
                      fill="var(--chart-tooltip-text)"
                    >
                      {LABELS[skill]}:
                    </text>
                    <text
                      x={tooltipX + tooltipW - 8}
                      y={tooltipY + 38 + si * 20}
                      textAnchor="end"
                      fontSize="14"
                      fontWeight="800"
                      fill={COLORS[skill].line}
                    >
                      {Math.round(item[skill])}
                    </text>
                  </g>
                ))}
              </g>
            );
          })()}
        </g>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-4">
        {SKILLS.map((skill) => (
          <button
            key={skill}
            className="flex items-center gap-2 transition-opacity"
            style={{ opacity: activeLine === null || activeLine === skill ? 1 : 0.35 }}
            onMouseEnter={() => setActiveLine(skill)}
            onMouseLeave={() => setActiveLine(null)}
          >
            <span
              className="w-6 h-1.5 rounded-full"
              style={{ backgroundColor: COLORS[skill].line }}
            />
            <span
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: "var(--chart-text-strong)" }}
            >
              {LABELS[skill]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
