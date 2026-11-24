// ─── Owner admin authentication (simple, server-side verified) ───────────────
// Password lives in .env (ADMIN_PASSWORD). Change it before going live.

import { createHash, createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE_NAME = "ak_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function adminSecret(): string {
  return process.env.ADMIN_SECRET || "al-kawsar-owner-secret";
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "alkawsar-admin";
}

export function adminToken(): string {
  return createHmac("sha256", adminSecret()).update("ak-admin-v1").digest("hex");
}

export function verifyPassword(password: string): boolean {
  const given = createHash("sha256").update(String(password ?? "")).digest();
  const expected = createHash("sha256").update(adminPassword()).digest();
  return timingSafeEqual(given, expected);
}

export function isValidAdminCookie(value: string | undefined | null): boolean {
  return Boolean(value) && value === adminToken();
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};
