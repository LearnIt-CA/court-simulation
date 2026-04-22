import React from "react";

// side1Color / side2Color are Tailwind-incompatible in SVG, so we pass hex directly
export default function DonutChart({ side1Count, side2Count, side1Name, side2Name, size = 200 }) {
  const total = side1Count + side2Count;
  const side1Pct = total === 0 ? 50 : Math.round((side1Count / total) * 100);
  const side2Pct = total === 0 ? 50 : 100 - side1Pct;

  const r = 70;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const side1Dash = (side1Pct / 100) * circumference;
  const side2Dash = circumference - side1Dash;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth={28}
        />
        {/* Side 2 arc (rendered first, underneath) */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={28}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Side 1 arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={28}
          strokeDasharray={`${side1Dash} ${side2Dash}`}
          strokeDashoffset={0}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={total === 0 ? "white" : "#94a3b8"}
          fontSize={total === 0 ? "13" : "12"}
          fontFamily={total === 0 ? "Georgia, serif" : "sans-serif"}
        >
          {total === 0 ? "No votes yet" : `${side1Pct}% · ${side2Pct}%`}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-300">
            {side1Name} <span className="text-white font-semibold">({side1Count})</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-300">
            {side2Name} <span className="text-white font-semibold">({side2Count})</span>
          </span>
        </div>
      </div>
    </div>
  );
}
