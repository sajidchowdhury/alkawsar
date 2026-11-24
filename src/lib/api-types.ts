// ─── Shared API response types ───────────────────────────────────────────────

export type PriceChange = { delta: number; at: string } | null;

export type PublicProduct = {
  slug: string;
  nameBn: string;
  nameEn: string;
  gradeBn: string;
  descBn: string;
  category: string;
  stock: string;
  packSizeBn: string;
  hasImage: boolean;
  imageVersion: number;
  updatedAt: string;
  prices: Record<string, { price: number; change: PriceChange }>;
};

export type PublicData = {
  products: PublicProduct[];
  meta: { noteBn: string; updatedAt: string };
};
