// ─── AL-KAWSAR shared business definitions ───────────────────────────────────
// Tier structure mirrors the printed Bengali price card.

export type TierDef = {
  id: string;
  labelBn: string;
  buyerBn: string;
  min: number;
  max: number | null;
  featured?: boolean;
};

export const TIERS: TierDef[] = [
  { id: "sample", labelBn: "স্যাম্পল", buyerBn: "পরীক্ষা ক্রেতা", min: 2, max: 2 },
  {
    id: "retail_direct",
    labelBn: "রিটেইলার সরাসরি",
    buyerBn: "ছোট দোকান",
    min: 1,
    max: 4,
    featured: true,
  },
  { id: "retail_bulk", labelBn: "রিটেইলার বাল্ক", buyerBn: "মাঝারি দোকান", min: 5, max: 19 },
  { id: "retail_volume", labelBn: "রিটেইলার ভলিউম", buyerBn: "বড় দোকান", min: 20, max: null },
  {
    id: "dist_std",
    labelBn: "ডিস্ট্রিবিউটর স্ট্যান্ডার্ড",
    buyerBn: "পাইকারি বিক্রেতা",
    min: 10,
    max: 49,
  },
  { id: "dist_bulk", labelBn: "ডিস্ট্রিবিউটর বাল্ক", buyerBn: "বাল্ক ক্রেতা", min: 50, max: null },
];

export const TIER_IDS = TIERS.map((t) => t.id);

/** Canonical ladder used by the price calculator (by box count). */
export function ladderTierForBoxes(n: number): TierDef {
  if (n === 2) return TIERS[0]; // sample rate
  if (n <= 4) return TIERS[1]; // retailer direct
  if (n <= 19) return TIERS[2]; // retailer bulk
  if (n <= 49) return TIERS[3]; // retailer volume
  return TIERS[5]; // distributor bulk
}

export type ProductDef = {
  slug: string;
  nameBn: string;
  nameEn: string;
  gradeBn: string;
  descBn: string;
  category: string;
  sortOrder: number;
};

/** Product categories shown on the site. */
export const CATEGORIES: { id: string; labelBn: string }[] = [
  { id: "dates", labelBn: "খেজুর" },
  { id: "other", labelBn: "অন্যান্য পণ্য" },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function categoryLabelBn(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.labelBn ?? "অন্যান্য পণ্য";
}

/** Seed catalog — bump SEED_VERSION to push new/renamed items to existing databases. */
export const SEED_VERSION = 2;

export const PRODUCTS_DEF: ProductDef[] = [
  {
    slug: "juicy",
    nameBn: "সুক্কারি জুসি",
    nameEn: "Sukkari Juicy",
    gradeBn: "A গ্রেড",
    descBn: "নরম, রসালো ও মিষ্টি — তাজা ফসলের সেরা দানা।",
    category: "dates",
    sortOrder: 1,
  },
  {
    slug: "hard",
    nameBn: "সুক্কারি হার্ড",
    nameEn: "Sukkari Hard",
    gradeBn: "B গ্রেড",
    descBn: "শক্ত ও মসৃণ দানা — দীর্ঘ সংরক্ষণেও দাম ধরে রাখে।",
    category: "dates",
    sortOrder: 2,
  },
  {
    slug: "shamia",
    nameBn: "শামিয়া",
    nameEn: "Shamia",
    gradeBn: "প্রিমিয়াম",
    descBn: "মাঝারি নরম ও সুন্দর মিষ্টি — সুক্কারির পরই ক্রেতাদের পছন্দ।",
    category: "dates",
    sortOrder: 3,
  },
];

/** Starting prices copied from the printed price card. */
export const DEFAULT_PRICES: Record<string, Record<string, number>> = {
  juicy: {
    sample: 1960,
    retail_direct: 2150,
    retail_bulk: 2100,
    retail_volume: 2080,
    dist_std: 2080,
    dist_bulk: 2050,
  },
  hard: {
    sample: 1860,
    retail_direct: 2050,
    retail_bulk: 2000,
    retail_volume: 1980,
    dist_std: 1980,
    dist_bulk: 1950,
  },
  shamia: {
    sample: 1690,
    retail_direct: 1850,
    retail_bulk: 1800,
    retail_volume: 1780,
    dist_std: 1780,
    dist_bulk: 1750,
  },
};

export const QUICK_BOXES = [2, 5, 10, 20, 50];

export const WHATSAPP_NUMBER = "8801731779724";
export const PHONE_DISPLAY = "01731 779724";
export const PHONE_TEL = "+8801731779724";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_ORDER_MESSAGE =
  "আসসালামু আলাইকুম। আমি AL-KAWSAR ওয়েবসাইট থেকে খেজুরের দাম দেখে অর্ডার করতে চাই। বিস্তারিত জানাবেন প্লিজ।";
