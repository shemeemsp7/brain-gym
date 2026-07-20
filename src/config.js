// src/config.js — single config module for client-safe and server-only values.
// Client-safe (NEXT_PUBLIC_*) values may be imported anywhere; the server-only
// values below are only referenced from API routes / server code.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
export const PRODUCT_NAME = "Brain Gym";

// --- server-only ---
export const POSTGRES_URL = process.env.DATABASE_URL || "postgres://postgres:root@localhost:5432/ascendarium";
export function getPortkeyApiKey() {
  return process.env.PORTKEY_API_KEY;
}
export const PORTKEY_BASE_URL = process.env.PORTKEY_BASE_URL || "https://api.portkey.ai/v1";
export const PORTKEY_MODEL = process.env.PORTKEY_MODEL;
