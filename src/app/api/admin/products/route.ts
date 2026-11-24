import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/auth";
import { CATEGORY_IDS } from "@/lib/tiers";

type CreateBody = {
  nameBn?: unknown;
  nameEn?: unknown;
  category?: unknown;
  gradeBn?: unknown;
  descBn?: unknown;
  packSizeBn?: unknown;
};

function cleanStr(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "product";
}

/** Owner-only: add a new product (prices start unset — fill them in the grid). */
export async function POST(req: NextRequest) {
  if (!isValidAdminCookie(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "ভুল ডেটা" }, { status: 400 });
  }

  const nameBn = cleanStr(body.nameBn, 60);
  if (!nameBn) {
    return NextResponse.json({ ok: false, error: "বাংলা নাম দিন" }, { status: 400 });
  }

  const category = cleanStr(body.category, 20);
  if (!CATEGORY_IDS.includes(category)) {
    return NextResponse.json({ ok: false, error: "ক্যাটাগরি ভুল" }, { status: 400 });
  }

  try {
    const nameEn = cleanStr(body.nameEn, 60) || nameBn;
    const gradeBn = cleanStr(body.gradeBn, 40) || "প্রিমিয়াম";
    const descBn = cleanStr(body.descBn, 160);
    const packSizeBn = cleanStr(body.packSizeBn, 30) || "৩ কেজি";

    // Build a unique slug from the English name.
    let slug = slugify(nameEn);
    let n = 2;
    while (await db.product.findUnique({ where: { slug } })) {
      slug = `${slugify(nameEn)}-${n}`;
      n += 1;
    }

    const maxOrder = await db.product.aggregate({ _max: { sortOrder: true } });
    const product = await db.product.create({
      data: {
        slug,
        nameBn,
        nameEn,
        gradeBn,
        descBn,
        category,
        packSizeBn,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ ok: true, slug: product.slug });
  } catch (err) {
    console.error("POST /api/admin/products failed", err);
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা" }, { status: 500 });
  }
}

/** Owner-only: remove a product (its prices and history go with it). */
export async function DELETE(req: NextRequest) {
  if (!isValidAdminCookie(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ ok: false, error: "স্লাগ দিন" }, { status: 400 });
  }

  try {
    const existing = await db.product.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
    }
    await db.product.delete({ where: { slug } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/products failed", err);
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা" }, { status: 500 });
  }
}
