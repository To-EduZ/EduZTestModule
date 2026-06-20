"use client";

import React, { useMemo, useCallback, useState } from "react";

export interface RadarDataPoint {
  subject: string;
  fullMark: number;
}

interface OverlayRadarChartProps {
  baseData: number[];
  currentData: number[];
  labels: string[];
  maxScore?: number;
  size?: number;
  colors?: { base: string; current: string };
  baseLabel?: string;
  currentLabel?: string;
}

export default function OverlayRadarChart({
  baseData,
  currentData,
  labels,
  maxScore = 100,
  size = 350,
  colors = { base: "#0ea5e9", current: "#f43f5e" },
  baseLabel = "Kỳ đánh giá trước",
  currentLabel = "Kỳ gần nhất",
}: OverlayRadarChartProps) {
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);
  const numAxes = labels.length;
  // Dynamic scale calculation to amplify differences
  const allValues = [...baseData, ...currentData].filter(v => v !== undefined && v !== null && !isNaN(v));
  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  let minScore = 0;
  if (dataMin >= 75) minScore = 60;
  else if (dataMin >= 55) minScore = 40;
  else if (dataMin >= 35) minScore = 20;
  const scoreRange = maxScore - minScore;

  const gridLevels = [
    minScore + scoreRange * 0.25,
    minScore + scoreRange * 0.5,
    minScore + scoreRange * 0.75,
    maxScore
  ];


  // Fixed internal SVG coordinate space
  const internalSize = 420;
  const radius = 100;
  const centerX = internalSize / 2;
  const centerY = internalSize / 2;

  // Unique gradient IDs to prevent collisions when multiple charts are rendered
  const baseGradId = useMemo(
    () => `base-grad-${baseLabel.replace(/\s+/g, "-").toLowerCase()}`,
    [baseLabel]
  );
  const currentGradId = useMemo(
    () => `current-grad-${currentLabel.replace(/\s+/g, "-").toLowerCase()}`,
    [currentLabel]
  );
  const glowFilterId = useMemo(
    () => `radar-glow-${currentLabel.replace(/\s+/g, "-").toLowerCase()}`,
    [currentLabel]
  );

  const getCoordinates = useCallback(
    (value: number, index: number) => {
      const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
      const clampedValue = Math.max(value, minScore);
      const distance = ((clampedValue - minScore) / scoreRange) * radius;
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
      };
    },
    [centerX, centerY, radius, maxScore, numAxes]
  );

  const basePoints = useMemo(
    () => baseData.map((val, i) => getCoordinates(val, i)).map((c) => `${c.x},${c.y}`).join(" "),
    [baseData, getCoordinates]
  );

  const currentPoints = useMemo(
    () => currentData.map((val, i) => getCoordinates(val, i)).map((c) => `${c.x},${c.y}`).join(" "),
    [currentData, getCoordinates]
  );

  

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-full">
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${internalSize} ${internalSize}`}
          className="overflow-visible"
        >
          <defs>
            {/* Base polygon fill */}
            <linearGradient id={baseGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.base} stopOpacity="0.28" />
              <stop offset="100%" stopColor={colors.base} stopOpacity="0.04" />
            </linearGradient>
            {/* Current polygon fill */}
            <linearGradient id={currentGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.current} stopOpacity="0.45" />
              <stop offset="100%" stopColor={colors.current} stopOpacity="0.10" />
            </linearGradient>
            {/* Glow filter for current polygon */}
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid background polygons */}
          {gridLevels.map((level, idx) => {
            const pts = labels
              .map((_, i) => {
                const c = getCoordinates(level, i);
                return `${c.x},${c.y}`;
              })
              .join(" ");
            const isOuter = idx === gridLevels.length - 1;
            return (
              <g key={level}>
                <polygon
                  points={pts}
                  fill="none"
                  stroke={isOuter ? "var(--chart-radar-outer)" : "var(--chart-radar-grid)"}
                  strokeWidth={isOuter ? "1.5" : "1"}
                  strokeDasharray={isOuter ? "0" : "4 4"}
                />
                {/* Score level label along the top axis */}
                <text
                  x={centerX}
                  y={centerY - ((level - minScore) / scoreRange) * radius + 13}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="var(--chart-radar-score-label)"
                  className="select-none font-mono"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Axis spokes */}
          {labels.map((_, i) => {
            const end = getCoordinates(maxScore, i);
            const isActive = hoveredAxis === i;
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={end.x}
                y2={end.y}
                stroke={isActive ? colors.current : "var(--chart-radar-spoke)"}
                strokeWidth={isActive ? "2" : "1.5"}
                style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
              />
            );
          })}

          {/* Base polygon */}
          <polygon
            points={basePoints}
            fill="transparent"
            stroke={colors.base}
            strokeWidth="2"
            strokeDasharray="5 4"
            strokeLinejoin="round"
            className="transition-all duration-700 ease-out"
          />
          {/* Base data points */}
          {baseData.map((val, i) => {
            const c = getCoordinates(val, i);
            return (
              <circle
                key={`base-${i}`}
                cx={c.x}
                cy={c.y}
                r="4"
                fill={colors.base}
                className="transition-all duration-700 ease-out"
              />
            );
          })}

          {/* Current polygon */}
          <polygon
            points={currentPoints}
            fill="transparent"
            stroke={colors.current}
            strokeWidth="3.5"
            strokeLinejoin="round"
            filter={`url(#${glowFilterId})`}
            className="transition-all duration-700 delay-200 ease-out"
          />
          {/* Current data points */}
          {currentData.map((val, i) => {
            const c = getCoordinates(val, i);
            const isActive = hoveredAxis === i;
            return (
              <circle
                key={`current-${i}`}
                cx={c.x}
                cy={c.y}
                r={isActive ? 8 : 5.5}
                fill={isActive ? colors.current : "#ffffff"}
                stroke={colors.current}
                strokeWidth="2.5"
                style={{ transition: "r 0.2s ease, fill 0.2s ease" }}
                className="transition-all duration-700 delay-200 ease-out cursor-pointer"
              />
            );
          })}

          {/* Axis labels with scores */}
          {labels.map((label, i) => {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const labelRadius = radius + 26;
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = centerY + Math.sin(angle) * labelRadius;

            let textAnchor: "start" | "middle" | "end" = "middle";
            if (Math.abs(Math.cos(angle)) > 0.1) {
              textAnchor = Math.cos(angle) > 0 ? "start" : "end";
            }

            const isTop = Math.abs(angle + Math.PI / 2) < 0.1;
            const isBottom = Math.abs(angle - Math.PI / 2) < 0.1;
            const dy = isBottom ? 12 : isTop ? -10 : 4;
            const isActive = hoveredAxis === i;

            const baseVal = Math.round(baseData[i] || 0);
            const currVal = Math.round(currentData[i] || 0);
            const improved = currVal > baseVal;

            return (
              <text
                key={label}
                x={x}
                y={y + dy}
                textAnchor={textAnchor}
                className="select-none cursor-pointer"
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                {/* Skill name */}
                <tspan
                  fontSize="13"
                  fontWeight="900"
                  fill={isActive ? colors.current : "var(--chart-radar-label)"}
                  style={{ transition: "fill 0.2s" }}
                >
                  {label}
                </tspan>

                {/* Score bracket */}
                <tspan fontSize="13" fontWeight="600" fill="var(--chart-radar-score-label)" dx="3">
                  (
                </tspan>

                {/* Base score */}
                {baseVal !== currVal && (
                  <>
                    <tspan fontSize="13" fontWeight="700" fill={colors.base} className="font-mono">
                      {baseVal}
                    </tspan>
                    <tspan
                      fontSize="13"
                      fontWeight="700"
                      fill={improved ? "#10b981" : "#f59e0b"}
                      className="font-mono"
                      dx="2"
                    >
                      {improved ? "↑" : "↓"}
                    </tspan>
                  </>
                )}

                {/* Current score */}
                <tspan
                  fontSize="13"
                  fontWeight="900"
                  fill={colors.current}
                  className="font-mono"
                  dx={baseVal !== currVal ? "2" : "0"}
                >
                  {currVal}
                </tspan>

                <tspan fontSize="13" fontWeight="600" fill="var(--chart-radar-score-label)">
                  )
                </tspan>
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-5">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded border-2 border-dashed"
            style={{
              backgroundColor: "transparent",
              opacity: 1,
              borderColor: colors.base,
            }}
          />
          <span
            className="text-sm font-black uppercase tracking-wide"
            style={{ color: "var(--chart-text)" }}
          >
            {baseLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded border-2"
            style={{
              backgroundColor: "transparent",
              opacity: 1,
              borderColor: colors.current,
            }}
          />
          <span
            className="text-sm font-black uppercase tracking-wide"
            style={{ color: "var(--chart-text-strong)" }}
          >
            {currentLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
