"use client";

import React, { useState, useEffect } from "react";

export interface RadarDataPoint {
  label: string;
  value: number; // 0 to 100
  emoji?: string;
}

interface DevelopmentRadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  colorScheme?: "blue" | "emerald" | "pink" | "violet";
  title?: string;
}

export default function DevelopmentRadarChart({
  data,
  size = 320,
  colorScheme = "blue",
  title,
}: DevelopmentRadarChartProps) {
  const [animateProgress, setAnimateProgress] = useState(0);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Trigger scale-up entry animation on mount
  useEffect(() => {
    let start: number | null = null;
    const duration = 1000; // 1 second animation
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutCubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimateProgress(easeOutCubic);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [data]);

  const numAxes = data.length;
  if (numAxes < 3) return null; // A radar chart needs at least 3 axes to form a polygon

  // Fixed internal SVG canvas coordinate space to ensure generous padding for labels
  const SVG_SIZE = 400;
  const center = SVG_SIZE / 2; // 200
  const radius = 110; // Leaves 90px of padding to the edges of the SVG box

  // Calculate coordinates for vertices given center, radius, angle, and value
  const getCoordinates = (index: number, val: number) => {
    // Offset by -Math.PI / 2 to start the first axis straight up
    const angle = (2 * Math.PI * index) / numAxes - Math.PI / 2;
    const x = center + radius * (val / 100) * Math.cos(angle);
    const y = center + radius * (val / 100) * Math.sin(angle);
    return { x, y, angle };
  };

  // Premium multichromatic color schemes configuration
  const schemes = {
    blue: {
      polygonStroke: "#3b82f6",
      pointFill: "#ffffff",
      pointStroke: "#2563eb",
      gridColor: "stroke-slate-200/80 dark:stroke-slate-700/60",
      textColor: "fill-slate-500 dark:fill-slate-400",
      activeText: "fill-blue-600 dark:fill-blue-400 font-extrabold text-sm",
      gradientStart: "#3b82f6",
      gradientEnd: "#10b981", // Blue to Emerald
      scoreText: "from-blue-600 to-emerald-500",
    },
    emerald: {
      polygonStroke: "#10b981",
      pointFill: "#ffffff",
      pointStroke: "#059669",
      gridColor: "stroke-slate-200/80 dark:stroke-slate-700/60",
      textColor: "fill-slate-500 dark:fill-slate-400",
      activeText: "fill-emerald-600 dark:fill-emerald-400 font-extrabold text-sm",
      gradientStart: "#10b981",
      gradientEnd: "#06b6d4", // Emerald to Cyan
      scoreText: "from-emerald-600 to-cyan-500",
    },
    pink: {
      polygonStroke: "#ec4899",
      pointFill: "#ffffff",
      pointStroke: "#db2777",
      gridColor: "stroke-slate-200/80 dark:stroke-slate-700/60",
      textColor: "fill-slate-500 dark:fill-slate-400",
      activeText: "fill-pink-600 dark:fill-pink-400 font-extrabold text-sm",
      gradientStart: "#ec4899",
      gradientEnd: "#f43f5e", // Pink to Rose
      scoreText: "from-pink-600 to-rose-500",
    },
    violet: {
      polygonStroke: "#8b5cf6",
      pointFill: "#ffffff",
      pointStroke: "#7c3aed",
      gridColor: "stroke-slate-200/80 dark:stroke-slate-700/60",
      textColor: "fill-slate-500 dark:fill-slate-400",
      activeText: "fill-violet-600 dark:fill-violet-400 font-extrabold text-sm",
      gradientStart: "#8b5cf6",
      gradientEnd: "#ec4899", // Violet to Pink (extremely beautiful)
      scoreText: "from-violet-600 to-pink-500",
    },
  };

  const scheme = schemes[colorScheme];

  // 1. Draw grid circles/polygons at 20%, 40%, 60%, 80%, 100%
  const gridLevels = [20, 40, 60, 80, 100];
  const gridElements = gridLevels.map((level) => {
    const points = Array.from({ length: numAxes })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, level);
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <polygon
        key={level}
        points={points}
        fill="none"
        className={`${scheme.gridColor} transition-all`}
        strokeWidth={1}
        strokeDasharray={level === 100 ? "none" : "3,3"}
      />
    );
  });

  // 2. Draw axis lines radiating out from center
  const axisLines = Array.from({ length: numAxes }).map((_, i) => {
    const { x, y } = getCoordinates(i, 100);
    const isActive = activePointIndex === i;
    return (
      <line
        key={i}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        className={`${scheme.gridColor} transition-colors`}
        strokeWidth={isActive ? 2 : 1}
      />
    );
  });

  // 3. Draw values polygon (animated on load)
  const currentPoints = data
    .map((d, i) => {
      const animatedValue = d.value * animateProgress;
      const { x, y } = getCoordinates(i, animatedValue);
      return `${x},${y}`;
    })
    .join(" ");

  // 4. Labels placements with absolute offset from boundary
  const labels = data.map((d, i) => {
    const { x, y, angle } = getCoordinates(i, 100);
    
    // Position label 24px further out along the axis line
    const labelX = x + 24 * Math.cos(angle);
    const labelY = y + 24 * Math.sin(angle);

    const isTop = Math.abs(angle + Math.PI / 2) < 0.1;
    const isBottom = Math.abs(angle - Math.PI / 2) < 0.1;
    const isRight = angle > -Math.PI / 2 && angle < Math.PI / 2;
    
    // Fine-tune text alignments based on label quadrant
    let textAnchor: "start" | "end" | "middle" = "middle";
    if (!isTop && !isBottom) {
      textAnchor = isRight ? "start" : "end";
    }

    const isActive = activePointIndex === i;

    return (
      <g key={i} className="select-none">
        <text
          x={labelX}
          y={labelY + (isBottom ? 8 : isTop ? -5 : 4)}
          textAnchor={textAnchor}
          className={`text-[12px] md:text-sm font-black transition-all ${
            isActive ? scheme.activeText : scheme.textColor
          }`}
          onMouseEnter={() => setActivePointIndex(i)}
          onMouseLeave={() => setActivePointIndex(null)}
        >
          {d.emoji ? `${d.emoji} ` : ""}
          {d.label}
        </text>
      </g>
    );
  });

  // 5. Draw data points at vertices
  const dataPoints = data.map((d, i) => {
    const animatedValue = d.value * animateProgress;
    const { x, y } = getCoordinates(i, animatedValue);
    const isActive = activePointIndex === i;

    return (
      <g key={i}>
        {/* Glow pulsing ring when hovered */}
        {isActive && (
          <circle
            cx={x}
            cy={y}
            r={11}
            fill="none"
            stroke={scheme.polygonStroke}
            strokeWidth={2}
            className="animate-ping opacity-60"
          />
        )}
        <circle
          cx={x}
          cy={y}
          r={isActive ? 7 : 5}
          fill={isActive ? scheme.polygonStroke : scheme.pointFill}
          stroke={scheme.pointStroke}
          strokeWidth={2.5}
          style={{ transition: "all 0.15s ease-out" }}
          className="cursor-pointer shadow-sm hover:scale-125"
          onMouseEnter={() => setActivePointIndex(i)}
          onMouseLeave={() => setActivePointIndex(null)}
        />
      </g>
    );
  });

  return (
    <div className="flex flex-col items-center justify-center p-5 md:p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 relative max-w-full overflow-hidden w-full group">
      {title && (
        <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-700">
          {title}
        </h4>
      )}

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width="100%"
          height="100%"
          viewBox="-60 0 520 400"
          className="overflow-visible"
        >
          <defs>
            {/* Soft glow filter */}
            <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            {/* Premium Multichromatic Linear Gradients */}
            <linearGradient id="radar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={scheme.gradientStart} stopOpacity="0.45" />
              <stop offset="100%" stopColor={scheme.gradientEnd} stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Grids Background */}
          <g>{gridElements}</g>
          
          {/* Axis Rays */}
          <g>{axisLines}</g>

          {/* Value Polygon with Glow & Gradient */}
          <polygon
            points={currentPoints}
            fill="url(#radar-grad)"
            stroke={scheme.polygonStroke}
            strokeWidth={3}
            filter="url(#radar-glow)"
            className="transition-all duration-300 ease-out"
          />

          {/* Data Points */}
          <g>{dataPoints}</g>

          {/* Text Labels */}
          <g>{labels}</g>
        </svg>

        {/* Glassmorphic Center Point Score Label Tooltip */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white/75 dark:bg-slate-900/75 backdrop-blur-md rounded-2xl p-2.5 md:p-3.5 border border-white/20 dark:border-slate-800/40 shadow-xl shadow-slate-200/50 dark:shadow-black/50">
            <span className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {activePointIndex !== null ? data[activePointIndex].label : "Trung bình"}
            </span>
            <span className={`text-xl md:text-2xl font-black font-mono bg-gradient-to-r ${scheme.scoreText} bg-clip-text text-transparent block mt-0.5`}>
              {activePointIndex !== null
                ? Math.round(data[activePointIndex].value)
                : Math.round(
                    data.reduce((sum, d) => sum + d.value, 0) / numAxes
                  )}
            </span>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400">/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
