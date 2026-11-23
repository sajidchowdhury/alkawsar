import { NextRequest, NextResponse } from "next/server";
import { isValidAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/auth";

/** Lightweight check the admin panel uses to restore an existing session. */
export async function GET(req: NextRequest) {
  const authed = isValidAdminCookie(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  return NextResponse.json({ authed }, { headers: { "Cache-Control": "no-store" } });
}
