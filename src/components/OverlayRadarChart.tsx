"use client";

import React, { useMemo, useCallback } from "react";

export interface RadarDataPoint {
  subject: string;
  fullMark: number;
}

interface OverlayRadarChartProps {
  baseData: number[]; // First period data
  currentData: number[]; // Second period data
  labels: string[]; // Axis labels
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
  colors = { base: "#94a3b8", current: "#8b5cf6" }, // Default slate for base, violet for current
  baseLabel = "Kỳ đánh giá trước",
  currentLabel = "Kỳ gần nhất",
}: OverlayRadarChartProps) {
  const numAxes = labels.length;

  // Use a fixed internal SVG coordinate system of 400x400 to provide a safe,
  // responsive margin and prevent labels from being cropped at the edges.
  const internalSize = 400;
  const radius = 110; // Generous space of 90px to the edge of the viewBox
  const centerX = internalSize / 2; // 200
  const centerY = internalSize / 2; // 200

  // Generate unique gradient IDs to prevent collisions when multiple charts are rendered
  const baseGradId = useMemo(
    () => `base-grad-${baseLabel.replace(/\s+/g, "-").toLowerCase()}`,
    [baseLabel]
  );
  const currentGradId = useMemo(
    () => `current-grad-${currentLabel.replace(/\s+/g, "-").toLowerCase()}`,
    [currentLabel]
  );

  // Calculate coordinates for a given value on a specific axis
  const getCoordinates = useCallback(
    (value: number, index: number) => {
      const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
      const distance = (value / maxScore) * radius;
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
      };
    },
    [centerX, centerY, radius, maxScore, numAxes]
  );

  // Calculate polygon points for both datasets
  const basePoints = useMemo(() => {
    return baseData
      .map((val, i) => {
        const coords = getCoordinates(val, i);
        return `${coords.x},${coords.y}`;
      })
      .join(" ");
  }, [baseData, getCoordinates]);

  const currentPoints = useMemo(() => {
    return currentData
      .map((val, i) => {
        const coords = getCoordinates(val, i);
        return `${coords.x},${coords.y}`;
      })
      .join(" ");
  }, [currentData, getCoordinates]);

  // Grid levels (concentric polygons)
  const gridLevels = [20, 40, 60, 80, 100];

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
            {/* Premium Linear Gradients with unique IDs */}
            <linearGradient id={baseGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.base} stopOpacity="0.25" />
              <stop offset="100%" stopColor={colors.base} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={currentGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.current} stopOpacity="0.4" />
              <stop offset="100%" stopColor={colors.current} stopOpacity="0.08" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Draw grid background levels */}
          {gridLevels.map((level, i) => {
            const points = labels
              .map((_, index) => {
                const coords = getCoordinates(level, index);
                return `${coords.x},${coords.y}`;
              })
              .join(" ");

            const isOuter = i === gridLevels.length - 1;

            return (
              <g key={level}>
                <polygon
                  points={points}
                  fill="none"
                  stroke={isOuter ? "#cbd5e1" : "#f1f5f9"}
                  strokeWidth={isOuter ? "2" : "1"}
                  className="dark:stroke-slate-700/60 transition-colors duration-300"
                  strokeDasharray={isOuter ? "0" : "4 4"}
                />
                {/* Score level labels along the top axis */}
                <text
                  x={centerX}
                  y={centerY - (level / maxScore) * radius + 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#94a3b8"
                  className="dark:fill-slate-500 select-none font-mono"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Draw axes spokes */}
          {labels.map((_, i) => {
            const end = getCoordinates(maxScore, i);
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={end.x}
                y2={end.y}
                stroke="#cbd5e1"
                strokeWidth="1.5"
                className="dark:stroke-slate-800"
              />
            );
          })}

          {/* Draw Base Polygon - Styled with a dashed stroke for visual separation */}
          <polygon
            points={basePoints}
            fill={`url(#${baseGradId})`}
            stroke={colors.base}
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinejoin="round"
            className="transition-all duration-1000 ease-out opacity-90"
          />
          {/* Draw Base Points */}
          {baseData.map((val, i) => {
            const coords = getCoordinates(val, i);
            return (
              <circle
                key={`base-${i}`}
                cx={coords.x}
                cy={coords.y}
                r="3.5"
                fill={colors.base}
                className="transition-all duration-1000 ease-out"
              />
            );
          })}

          {/* Draw Current Polygon (rendered on top) */}
          <polygon
            points={currentPoints}
            fill={`url(#${currentGradId})`}
            stroke={colors.current}
            strokeWidth="3.5"
            strokeLinejoin="round"
            filter="url(#glow)"
            className="transition-all duration-1000 delay-300 ease-out"
          />
          {/* Draw Current Points */}
          {currentData.map((val, i) => {
            const coords = getCoordinates(val, i);
            return (
              <circle
                key={`current-${i}`}
                cx={coords.x}
                cy={coords.y}
                r="5.5"
                fill="#ffffff"
                stroke={colors.current}
                strokeWidth="2.5"
                className="transition-all duration-1000 delay-300 ease-out cursor-pointer hover:scale-125"
              />
            );
          })}

          {/* Draw Axis Labels with color-coded progress scores */}
          {labels.map((label, i) => {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const labelRadius = radius + 22; // Safe padding for labels
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = centerY + Math.sin(angle) * labelRadius;

            // Adjust text anchoring based on coordinates to keep text in bounds
            let textAnchor: "start" | "middle" | "end" = "middle";
            if (Math.abs(Math.cos(angle)) > 0.1) {
              textAnchor = Math.cos(angle) > 0 ? "start" : "end";
            }

            const isTop = Math.abs(angle + Math.PI / 2) < 0.1;
            const isBottom = Math.abs(angle - Math.PI / 2) < 0.1;
            const dy = isBottom ? 10 : isTop ? -8 : 4;

            const baseVal = Math.round(baseData[i] || 0);
            const currVal = Math.round(currentData[i] || 0);

            return (
              <text
                key={label}
                x={x}
                y={y + dy}
                textAnchor={textAnchor}
                className="select-none"
              >
                {/* Skill Name */}
                <tspan
                  fontSize="12"
                  fontWeight="900"
                  fill="#1e293b"
                  className="dark:fill-slate-200"
                >
                  {label}
                </tspan>

                {/* Score wrapper ( */}
                <tspan fontSize="11" fontWeight="bold" fill="#64748b" className="dark:fill-slate-500 font-mono" dx="4">
                  (
                </tspan>

                {/* Base score value (colored to match base polygon) */}
                {baseVal !== currVal && (
                  <>
                    <tspan
                      fontSize="11"
                      fontWeight="bold"
                      fill={colors.base}
                      className="font-mono"
                    >
                      {baseVal}
                    </tspan>
                    {/* Progress arrow */}
                    <tspan
                      fontSize="11"
                      fontWeight="bold"
                      fill="#94a3b8"
                      className="font-mono"
                      dx="2"
                      dy="0"
                    >
                      →
                    </tspan>
                  </>
                )}

                {/* Current score value (colored to match current polygon) */}
                <tspan
                  fontSize="11"
                  fontWeight="black"
                  fill={colors.current}
                  className="font-mono"
                  dx={baseVal !== currVal ? "2" : "0"}
                >
                  {currVal}
                </tspan>

                {/* Score wrapper ) */}
                <tspan fontSize="11" fontWeight="bold" fill="#64748b" className="dark:fill-slate-500 font-mono">
                  )
                </tspan>
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend below the chart */}
      <div className="flex gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600"
            style={{ backgroundColor: colors.base, opacity: 0.5 }}
          ></div>
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {baseLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-violet-400/40 shadow-sm"
            style={{ backgroundColor: colors.current, opacity: 0.8 }}
          ></div>
          <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            {currentLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
