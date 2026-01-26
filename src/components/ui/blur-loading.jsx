"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function Spinner({ size = "md", className = "", text }) {
  const sizes = { xs: 32, sm: 48, md: 64, lg: 128 };
  const wheelSize = sizes[size] ?? sizes.md;
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        width={wheelSize}
        height={wheelSize}
        viewBox="0 0 100 100"
        role="status"
        aria-live="polite"
        aria-label={text || "Loading"}
      >
        <defs>
          <radialGradient id="tireGradient">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <radialGradient id="rimGradient">
            <stop offset="0%" stopColor="#f8f8f8" />
            <stop offset="30%" stopColor="#e8e8e8" />
            <stop offset="70%" stopColor="#c0c0c0" />
            <stop offset="100%" stopColor="#808080" />
          </radialGradient>
          <radialGradient id="shadowGradient">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="95" rx="35" ry="4" fill="url(#shadowGradient)" />
        <g
          className="animate-spin"
          style={{ animationDuration: "0.8s", transformOrigin: "50px 50px" }}
        >
          <circle cx="50" cy="50" r="48" fill="url(#tireGradient)" />
          <circle cx="50" cy="50" r="40" fill="#1a1a1a" />
          <circle cx="50" cy="50" r="38" fill="url(#rimGradient)" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#a0a0a0" strokeWidth="0.5" />
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i * 72) * Math.PI / 180;
            const spokeLength = 28;
            const spokeWidth = 8;
            const round = (val) => Math.round(val * 1000000) / 1000000;
            const x1 = round(50 + spokeLength * Math.cos(angle));
            const y1 = round(50 + spokeLength * Math.sin(angle));
            const perpAngle = angle + Math.PI / 2;
            const halfWidth = spokeWidth / 2;
            const x1a = round(50 + halfWidth * Math.cos(perpAngle));
            const y1a = round(50 + halfWidth * Math.sin(perpAngle));
            const x1b = round(50 - halfWidth * Math.cos(perpAngle));
            const y1b = round(50 - halfWidth * Math.sin(perpAngle));
            const x2a = round(x1 + halfWidth * Math.cos(perpAngle));
            const y2a = round(y1 + halfWidth * Math.sin(perpAngle));
            const x2b = round(x1 - halfWidth * Math.cos(perpAngle));
            const y2b = round(y1 - halfWidth * Math.sin(perpAngle));
            return (
              <g key={`spoke-${i}`}>
                <polygon
                  points={`${x1a},${y1a} ${x2a},${y2a} ${x2b},${y2b} ${x1b},${y1b}`}
                  fill="#e0e0e0"
                  stroke="#c0c0c0"
                  strokeWidth="0.3"
                />
                <line
                  x1="50"
                  y1="50"
                  x2={String(x1)}
                  y2={String(y1)}
                  stroke="#f5f5f5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </g>
            );
          })}
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i * 72 + 36) * Math.PI / 180;
            const round = (val) => Math.round(val * 1000000) / 1000000;
            const x = round(50 + 20 * Math.cos(angle));
            const y = round(50 + 20 * Math.sin(angle));
            return (
              <g key={`lug-${i}`}>
                <circle cx={String(x)} cy={String(y)} r="2.5" fill="#606060" />
                <circle cx={String(x)} cy={String(y)} r="1.5" fill="#404040" />
              </g>
            );
          })}
          <circle cx="50" cy="50" r="10" fill="#d0d0d0" stroke="#a0a0a0" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="6" fill="#707070" />
          <circle cx="48" cy="48" r="2" fill="#ffffff" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

export function BlurLoading({
  children,
  isLoading,
  loadingText = "Loading...",
  spinnerSize = "md",
  className = "",
}) {
  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Spinner size={spinnerSize} text={loadingText} />
          {loadingText ? (
            <p className="mt-4 text-sm text-gray-600">{loadingText}</p>
          ) : null}
        </div>
      )}
      <div className={isLoading ? "pointer-events-none select-none opacity-50" : ""}>
        {children}
      </div>
    </div>
  );
}
