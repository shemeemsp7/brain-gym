// "Train Honest" message deck — see doc/ANTI_CHEAT_DESIGN.md.
// Single source of copy so every surface (dialogs, toasts, footers) speaks
// with one consistent, non-accusatory voice.
export const INTEGRITY_MESSAGES = {
  MIRROR: "Cheating here only cheats your own brain.",
  REPS: "The reps only count if you do them.",
  LIFT: "Nobody ever got stronger watching someone else lift.",
  SPOTTER: "An AI can spot you — but if it does the whole lift, you leave the gym weaker than you came in.",
  MUSCLE: "This is a brain gym. Outsourcing the workout defeats the only reason to be here.",
  MIRROR2: "There's no prize money here. The only thing on the line is your own thinking — protect it.",
  HONEST_STREAK: "Streaks feel best when every day on them was really yours."
};

export function pickMessage(keys) {
  return INTEGRITY_MESSAGES[keys[Math.floor(Math.random() * keys.length)]];
}
