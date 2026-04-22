import React, { useState, useEffect, useRef, useCallback } from "react";

const SIZE = 220;
const R = 90;
const CX = SIZE / 2;
const CY = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function Timer({ minutes, label }) {
  const totalSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    if (running || done) return;
    setRunning(true);
  }, [running, done]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setDone(false);
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Reset timer when minutes prop changes (stage change)
  useEffect(() => {
    reset();
  }, [minutes]);

  const progress = secondsLeft / totalSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const ringColor = done
    ? "#6b7280"
    : secondsLeft <= 30
    ? "#EF4444"
    : secondsLeft <= 60
    ? "#F59E0B"
    : "#3B82F6";

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-slate-400 uppercase tracking-widest text-sm">{label}</p>

      <div className="relative cursor-pointer select-none" onClick={!running && !done ? start : undefined}>
        <svg width={SIZE} height={SIZE}>
          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e293b" strokeWidth={12} />
          {/* Progress ring */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition: running ? "stroke-dashoffset 1s linear, stroke 0.5s" : "stroke 0.5s" }}
          />
          {/* Time display */}
          <text
            x={CX}
            y={CY - 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={done ? "#6b7280" : "white"}
            fontSize="38"
            fontWeight="bold"
            fontFamily="Georgia, serif"
          >
            {timeStr}
          </text>
          <text
            x={CX}
            y={CY + 26}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={done ? "#6b7280" : "#94a3b8"}
            fontSize="13"
            fontFamily="sans-serif"
          >
            {done ? "TIME'S UP" : running ? "running" : "tap to start"}
          </text>
        </svg>
      </div>

      {done && (
        <button
          onClick={reset}
          className="text-slate-500 hover:text-slate-300 text-sm underline transition-colors"
        >
          Reset timer
        </button>
      )}
    </div>
  );
}
