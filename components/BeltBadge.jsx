// components/BeltBadge.jsx — single shared belt rendering for table cells
// (Leaderboard, Admin), replacing two divergent implementations (SVG icon vs
// plain rectangle) that showed the same data differently in each place.
import React from "react";
import KarateBeltIcon from "./KarateBeltIcon";
import { beltColor } from "../src/beltColors";

export default function BeltBadge({ belt, size = 22 }) {
  const key = (belt || "white").toLowerCase();
  const label = key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <KarateBeltIcon color={beltColor(key)} size={size} />
      {label}
    </span>
  );
}
