/**
 * Pure helper: parse Error → user-friendly English message (Sprint 34).
 *
 * Strategy:
 * - Network-like errors → "No connection"
 * - Auth-like errors → "Session expired, log in again"
 * - Validation-like (Zod-style) → first issue extracted
 * - Default → generic "Something went wrong" + technical hint in dev
 *
 * Used by:
 * - Route-group error.tsx boundaries
 * - Toast handlers di client actions
 */

export type FriendlyError = {
  title: string;
  body: string;
  retryable: boolean;
  category: "network" | "auth" | "validation" | "permission" | "unknown";
};

const NETWORK_HINTS = [
  "fetch",
  "network",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "Failed to fetch",
  "Load failed",
  "offline",
];

const AUTH_HINTS = ["unauthorized", "session", "token", "401"];

const PERMISSION_HINTS = ["forbidden", "403"];

export function parseFriendlyError(input: unknown): FriendlyError {
  if (input === null || input === undefined) {
    return generic();
  }
  const message = extractMessage(input);
  const lower = message.toLowerCase();

  if (matchesAny(lower, NETWORK_HINTS)) {
    return {
      title: "No connection",
      body: "Check your WiFi/data and try again.",
      retryable: true,
      category: "network",
    };
  }
  if (matchesAny(lower, AUTH_HINTS)) {
    return {
      title: "Session expired",
      body: "Please log in again to continue.",
      retryable: false,
      category: "auth",
    };
  }
  if (matchesAny(lower, PERMISSION_HINTS)) {
    return {
      title: "Not allowed",
      body: "You don't have access to this action.",
      retryable: false,
      category: "permission",
    };
  }
  if (isValidationLike(input)) {
    return {
      title: "Invalid input",
      body: message,
      retryable: false,
      category: "validation",
    };
  }
  return generic(message);
}

function generic(detail?: string): FriendlyError {
  return {
    title: "Something went wrong",
    body: detail ?? "That didn't go as planned. Please try again.",
    retryable: true,
    category: "unknown",
  };
}

function extractMessage(input: unknown): string {
  if (typeof input === "string") return input;
  if (input instanceof Error) return input.message;
  if (
    input !== null &&
    typeof input === "object" &&
    "message" in input &&
    typeof (input as { message: unknown }).message === "string"
  ) {
    return (input as { message: string }).message;
  }
  return String(input);
}

function matchesAny(lowerStr: string, needles: string[]): boolean {
  for (const n of needles) {
    if (lowerStr.includes(n.toLowerCase())) return true;
  }
  return false;
}

function isValidationLike(input: unknown): boolean {
  if (
    input !== null &&
    typeof input === "object" &&
    "issues" in input &&
    Array.isArray((input as { issues: unknown }).issues)
  ) {
    return true;
  }
  return false;
}
