// ─── Keeps the catalog in sync with PRODUCTS_DEF ────────────────────────────
// Versioned seeding: when SEED_VERSION increases, new/renamed seed products are
// added to (or corrected in) existing databases — including the one already
// running on the VPS. Prices the owner edited are never overwritten, and
// products the owner deleted are not resurrected once the version is applied.

import { db } from "@/lib/db";
import { PRODUCTS_DEF, DEFAULT_PRICES, TIERS, SEED_VERSION } from "@/lib/tiers";

let seeded = false;

export async function ensureSeed(): Promise<void> {
  if (seeded) return;
  try {
    const meta = await db.siteMeta.findUnique({ where: { id: "main" } });
    const currentVersion = meta?.seedVersion ?? 0;

    if (currentVersion < SEED_VERSION) {
      for (const p of PRODUCTS_DEF) {
        await db.product.upsert({
          where: { slug: p.slug },
          update: {
            nameBn: p.nameBn,
            nameEn: p.nameEn,
            gradeBn: p.gradeBn,
            descBn: p.descBn,
            category: p.category,
            packSizeBn: p.packSizeBn,
            sortOrder: p.sortOrder,
          },
          create: {
            slug: p.slug,
            nameBn: p.nameBn,
            nameEn: p.nameEn,
            gradeBn: p.gradeBn,
            descBn: p.descBn,
            category: p.category,
            packSizeBn: p.packSizeBn,
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
      await db.siteMeta.upsert({
        where: { id: "main" },
        update: { seedVersion: SEED_VERSION },
        create: { id: "main", noteBn: "", seedVersion: SEED_VERSION },
      });
    }

    seeded = true;
  } catch (err) {
    console.error("ensureSeed failed", err);
  }
}
