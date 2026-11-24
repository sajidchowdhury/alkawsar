import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

/** Public price feed — the single source of truth the website displays. */
export async function GET() {
  try {
    await ensureSeed();

    const [products, meta, history] = await Promise.all([
      db.product.findMany({ include: { prices: true }, orderBy: { sortOrder: "asc" } }),
      db.siteMeta.findUnique({ where: { id: "main" } }),
      db.priceHistory.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    ]);

    // Latest change per product+tier (history is newest-first).
    const latestChange = new Map<string, { delta: number; at: string }>();
    for (const h of history) {
      const key = `${h.productId}:${h.tierId}`;
      if (!latestChange.has(key)) {
        latestChange.set(key, {
          delta: h.newPrice - h.oldPrice,
          at: h.createdAt.toISOString(),
        });
      }
    }

    const data = {
      products: products.map((p) => ({
        slug: p.slug,
        nameBn: p.nameBn,
        nameEn: p.nameEn,
        gradeBn: p.gradeBn,
        descBn: p.descBn,
        category: p.category,
        stock: p.stock,
        updatedAt: p.updatedAt.toISOString(),
        prices: Object.fromEntries(
          p.prices.map((pr) => [
            pr.tierId,
            { price: pr.price, change: latestChange.get(`${p.id}:${pr.tierId}`) ?? null },
          ])
        ),
      })),
      meta: {
        noteBn: meta?.noteBn ?? "",
        updatedAt: (meta?.updatedAt ?? new Date()).toISOString(),
      },
    };

    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("GET /api/prices failed", err);
    return NextResponse.json({ error: "দাম লোড করা যায়নি" }, { status: 500 });
  }
}
