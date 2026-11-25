import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

type CreateBody = {
  labelBn?: unknown;
  nameEn?: unknown;
};

function cleanStr(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return base;
}

/** Owner-only: create a category (Bengali label required; English name shapes the id). */
export async function POST(req: NextRequest) {
  if (!isValidAdminCookie(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "ভুল ডেটা" }, { status: 400 });
  }

  await ensureSeed();

  const labelBn = cleanStr(body.labelBn, 30);
  if (!labelBn) {
    return NextResponse.json({ ok: false, error: "ক্যাটাগরির বাংলা নাম দিন" }, { status: 400 });
  }

  try {
    const duplicate = await db.category.findFirst({ where: { labelBn } });
    if (duplicate) {
      return NextResponse.json(
        { ok: false, error: `"${labelBn}" ক্যাটাগরি আগে থেকেই আছে` },
        { status: 409 }
      );
    }

    // Build a unique id: English name slug when given, otherwise cat-<random>.
    const base = slugify(cleanStr(body.nameEn, 40));
    let id = base || `cat-${Date.now().toString(36)}`;
    let n = 2;
    while (await db.category.findUnique({ where: { id } })) {
      id = `${base || "cat"}-${n}`;
      n += 1;
    }

    const maxOrder = await db.category.aggregate({ _max: { sortOrder: true } });
    const category = await db.category.create({
      data: {
        id,
        labelBn,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ ok: true, id: category.id });
  } catch (err) {
    console.error("POST /api/admin/categories failed", err);
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা" }, { status: 500 });
  }
}

/** Owner-only: delete a category — blocked while products still use it. */
export async function DELETE(req: NextRequest) {
  if (!isValidAdminCookie(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "আইডি দিন" }, { status: 400 });
  }

  try {
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "ক্যাটাগরি পাওয়া যায়নি" }, { status: 404 });
    }

    const productCount = await db.product.count({ where: { category: id } });
    if (productCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `এই ক্যাটাগরিতে পণ্য আছে — আগে পণ্যগুলো অন্য ক্যাটাগরিতে সরান বা মুছে ফেলুন`,
        },
        { status: 409 }
      );
    }

    const total = await db.category.count();
    if (total <= 1) {
      return NextResponse.json(
        { ok: false, error: "অন্তত একটি ক্যাটাগরি রাখতে হবে — শেষ ক্যাটাগরিটি মোছা যাবে না" },
        { status: 409 }
      );
    }

    await db.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/categories failed", err);
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা" }, { status: 500 });
  }
}
