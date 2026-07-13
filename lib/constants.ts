/**
 * Consolidated Constants & Configuration
 * Reduces file count by centralizing magic strings
 */

// Authentication paths
export const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/api/health",
  "/invite",
] as const;

export const AUTH_PATHS = ["/login", "/signup"] as const;

// API Configuration
export const API_ENDPOINTS = {
  HEALTH: "/api/health",
  AUTH_CALLBACK: "/api/auth/callback",
  GEOLOCATION: "/api/geolocation",
  ASSISTANT: "/api/assistant",
} as const;

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 2,
  MAX_ZOOM: 19,
  TILE_URL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  ATTRIBUTION:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
} as const;

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 0.3,
  SIDEBAR_WIDTH: "256px",
} as const;

// Security & 2FA
export const AUTH_CONFIG = {
  TWO_FA_ISSUER: process.env.NEXT_PUBLIC_2FA_ISSUER || "TRACKORA",
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Validation Patterns
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.][0-9]{1,9}$/,
} as const;
