// backend/components/KarateBeltIcon.jsx
import React from "react";

// More realistic SVG Karate Belt Icon
export default function KarateBeltIcon({ color = "#000", size = 28 }) {
  // Main belt color, knot, and shadow for realism
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 56 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ verticalAlign: "middle" }}
    >
      {/* Belt main band */}
      <rect x="2" y="16" width="52" height="8" rx="4" fill={color} stroke="#222" strokeWidth="2"/>
      {/* Left hanging end */}
      <rect x="6" y="24" width="8" height="10" rx="3" fill={color} stroke="#222" strokeWidth="2"/>
      {/* Right hanging end */}
      <rect x="42" y="24" width="8" height="10" rx="3" fill={color} stroke="#222" strokeWidth="2"/>
      {/* Knot (center) */}
      <ellipse cx="28" cy="20" rx="7" ry="6" fill={color} stroke="#222" strokeWidth="2"/>
      {/* Knot highlight */}
      <ellipse cx="28" cy="20" rx="3" ry="2" fill="#fff" opacity="0.25"/>
      {/* Subtle shadow under belt */}
      <ellipse cx="28" cy="34" rx="18" ry="3" fill="#222" opacity="0.15"/>
    </svg>
  );
}