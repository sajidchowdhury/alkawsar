// ─── Ensures the price tables are populated with the printed card values ─────

import { db } from "@/lib/db";
import { PRODUCTS_DEF, DEFAULT_PRICES, TIERS } from "@/lib/tiers";

let seeded = false;

export async function ensureSeed(): Promise<void> {
  if (seeded) return;
  try {
    const count = await db.product.count();
    if (count === 0) {
      for (const p of PRODUCTS_DEF) {
        await db.product.create({
          data: {
            slug: p.slug,
            nameBn: p.nameBn,
            nameEn: p.nameEn,
            gradeBn: p.gradeBn,
            descBn: p.descBn,
            sortOrder: p.sortOrder,
            prices: {
              create: TIERS.map((t) => ({
                tierId: t.id,
                price: DEFAULT_PRICES[p.slug]?.[t.id] ?? 0,
              })),
            },
          },
        });
      }
    }
    const meta = await db.siteMeta.findUnique({ where: { id: "main" } });
    if (!meta) {
      await db.siteMeta.create({ data: { id: "main", noteBn: "" } });
    }
    seeded = true;
  } catch (err) {
    console.error("ensureSeed failed", err);
  }
}
