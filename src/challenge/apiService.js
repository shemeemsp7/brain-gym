// src/challenge/apiService.js
// Frontend API service: calls backend API endpoints.
// The server identifies the user from the session — no user object is sent.

export async function fetchChallenge(_user, level, type = "solve") {
  const res = await fetch("/api/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level, type })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch challenge");
  }
  return await res.json();
}

export async function fetchFeedback(challenge, solution, timeTaken, type = "solve") {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge, solution, time_taken: timeTaken, type })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to get feedback");
  }
  return await res.json(); // { feedback, evaluation, integritySuspect } or (review) { feedback, evaluation, bugsPresent, bugsFound, falseFindings }
}

export async function fetchClarification(challenge, question) {
  const res = await fetch("/api/clarify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge, question })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to get clarification");
  }
  return await res.json();
}

export async function saveUserChallenge({
  user_id,
  prompt,
  title,
  difficulty,
  solution,
  feedback,
  evaluation,
  status,
  notes,
  time_limit,
  remaining_time,
  time_taken,
  clarity_rating,
  integrity_events,
  type
}) {
  const res = await fetch("/api/user-challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id,
      prompt,
      title,
      difficulty,
      solution,
      feedback,
      evaluation,
      status,
      notes,
      time_limit,
      remaining_time,
      time_taken,
      clarity_rating,
      integrity_events,
      type
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save challenge");
  }
  return await res.json();
}

export async function fetchUserProfile(user_id) {
  const res = await fetch(`/api/users/${encodeURIComponent(user_id)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch profile");
  }
  return await res.json(); // { user, stats, beltProgress, streak }
}

export async function fetchUserChallenges(user_id) {
  const res = await fetch(`/api/user-challenge-list?user_id=${encodeURIComponent(user_id)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch user challenges");
  }
  return await res.json();
}
