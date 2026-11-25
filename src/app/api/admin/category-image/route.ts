import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/auth";

type UploadBody = {
  id?: unknown;
  dataUrl?: unknown;
};

const MAX_BASE64_CHARS = 700_000; // ~500 KB binary — uploads are compressed client-side first.

/** Owner-only: upload a category circle image (client sends a compressed data URL). */
export async function POST(req: NextRequest) {
  if (!isValidAdminCookie(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as UploadBody | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "ভুল ডেটা" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";

  if (!id) {
    return NextResponse.json({ ok: false, error: "আইডি দিন" }, { status: 400 });
  }
  if (!dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ ok: false, error: "শুধু ছবি ফাইল দিন" }, { status: 400 });
  }
  if (dataUrl.length > MAX_BASE64_CHARS) {
    return NextResponse.json({ ok: false, error: "ছবি খুব বড় — আবার চেষ্টা করুন" }, { status: 413 });
  }

  try {
    const category = await db.category.findUnique({ where: { id }, select: { id: true } });
    if (!category) {
      return NextResponse.json({ ok: false, error: "ক্যাটাগরি পাওয়া যায়নি" }, { status: 404 });
    }

    await db.category.update({
      where: { id },
      data: {
        imageData: dataUrl,
        imageVersion: { increment: 1 },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/category-image failed", err);
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা" }, { status: 500 });
  }
}

/** Owner-only: remove a category image (site falls back to the seeded artwork/label). */
export async function DELETE(req: NextRequest) {
  if (!isValidAdminCookie(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "আইডি দিন" }, { status: 400 });
  }

  try {
    const category = await db.category.findUnique({ where: { id }, select: { id: true } });
    if (!category) {
      return NextResponse.json({ ok: false, error: "ক্যাটাগরি পাওয়া যায়নি" }, { status: 404 });
    }

    await db.category.update({
      where: { id },
      data: {
        imageData: null,
        imageVersion: { increment: 1 },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/category-image failed", err);
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা" }, { status: 500 });
  }
}
