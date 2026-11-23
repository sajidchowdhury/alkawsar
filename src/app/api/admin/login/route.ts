import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, adminToken, ADMIN_COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!verifyPassword(password)) {
    return NextResponse.json({ ok: false, error: "ভুল পাসওয়ার্ড" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, adminToken(), COOKIE_OPTIONS);
  return res;
}
