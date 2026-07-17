// backend/src/challenge/dateUtils.js

// Parse UTC string or ISO string and show in user's local time zone
export function formatLocalTime(utcString) {
  if (!utcString) return "";

  // Parse custom format to ISO
  let isoString;
  if (utcString.includes("T")) {
    isoString = utcString;
  } else {
    const match = utcString.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(\.\d+)?/);
    if (match) {
      isoString = `${match[1]}T${match[2]}${match[3] ? match[3].slice(0, 4) : ""}Z`;
    } else {
      isoString = utcString;
    }
  }

  // Create UTC date object
  const utcDate = new Date(isoString);

  // Convert to Asia/Kolkata time using manual offset (UTC+5:30)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utcDate.getTime() + istOffsetMs);

  return istDate.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}
