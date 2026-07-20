// src/beltColors.js — single source of truth for belt-to-color mapping (UI
// only; belt threshold logic lives in src/belt.js). Client-safe: no server
// imports, so it can be pulled into any component.
export const BELT_COLORS = {
  white: "#fff",
  yellow: "#fde68a",
  orange: "#fb923c",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a78bfa",
  brown: "#92400e",
  black: "#000"
};

// Text color to render on top of each belt's background. Most of these belt
// colors are light/mid-brightness, so white text fails WCAG contrast on all
// but brown and black — verified against the sRGB relative-luminance formula,
// not assumed from convention.
export const BELT_TEXT_COLORS = {
  white: "#1e293b",
  yellow: "#1e293b",
  orange: "#1e293b",
  green: "#1e293b",
  blue: "#1e293b",
  purple: "#1e293b",
  brown: "#fff",
  black: "#fff"
};

export function beltColor(belt) {
  return BELT_COLORS[(belt || "white").toLowerCase()] || BELT_COLORS.white;
}

export function beltTextColor(belt) {
  return BELT_TEXT_COLORS[(belt || "white").toLowerCase()] || BELT_TEXT_COLORS.white;
}
