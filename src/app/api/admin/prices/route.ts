import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/auth";
import { TIERS } from "@/lib/tiers";

type UpdateBody = {
  prices?: Record<string, Record<string, unknown>>;
  stock?: Record<string, unknown>;
  packSizes?: Record<string, unknown>;
  noteBn?: unknown;
};

/** Owner-only: update prices (with history), stock status and the public note. */
export async function POST(req: NextRequest) {
  if (!isValidAdminCookie(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as UpdateBody | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "ভুল ডেটা" }, { status: 400 });
  }

  try {
    const products = await db.product.findMany({ include: { prices: true } });
    let changed = 0;

    for (const p of products) {
      const incoming = body.prices?.[p.slug];
      if (incoming && typeof incoming === "object") {
        for (const pr of p.prices) {
          const raw = (incoming as Record<string, unknown>)[pr.tierId];
          if (raw === undefined || raw === null || raw === "") continue;
          const num = Number(raw);
          if (!Number.isFinite(num) || num < 0 || num > 100000) continue;
          const price = Math.round(num);
          if (price === pr.price) continue;
          await db.$transaction([
            db.productPrice.update({ where: { id: pr.id }, data: { price } }),
            db.priceHistory.create({
              data: { productId: p.id, tierId: pr.tierId, oldPrice: pr.price, newPrice: price },
            }),
          ]);
          changed += 1;
        }
      }

      const stock = body.stock?.[p.slug];
      if ((stock === "available" || stock === "coming") && stock !== p.stock) {
        await db.product.update({ where: { id: p.id }, data: { stock } });
      }

      const packSize = body.packSizes?.[p.slug];
      if (typeof packSize === "string") {
        const cleaned = packSize.trim().slice(0, 30);
        if (cleaned && cleaned !== p.packSizeBn) {
          await db.product.update({ where: { id: p.id }, data: { packSizeBn: cleaned } });
        }
      }
    }

    if (typeof body.noteBn === "string") {
      const noteBn = body.noteBn.slice(0, 200);
      await db.siteMeta.upsert({
        where: { id: "main" },
        update: { noteBn },
        create: { id: "main", noteBn },
      });
    }

    return NextResponse.json({ ok: true, changed });
  } catch (err) {
    console.error("POST /api/admin/prices failed", err);
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা" }, { status: 500 });
  }
}
