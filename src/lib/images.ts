// ─── Product image helpers shared by storefront & admin panel ────────────────

import type { SyntheticEvent } from "react";
import { withBasePath } from "@/lib/base-path";
import type { PublicProduct } from "@/lib/api-types";

export const DEFAULT_PRODUCT_IMAGE = withBasePath("/images/products/default.png");

/** Best available image for a product: owner upload → per-slug artwork → brand default. */
export function productImageSrc(
  p: Pick<PublicProduct, "slug" | "hasImage" | "imageVersion">
): string {
  if (p.hasImage) {
    return withBasePath(`/api/product-image/${encodeURIComponent(p.slug)}?v=${p.imageVersion}`);
  }
  return withBasePath(`/images/products/${p.slug}.png`);
}

/** Swap to the brand default artwork once, then stop (prevents loops). */
export function handleImgError(e: SyntheticEvent<HTMLImageElement>): void {
  const el = e.currentTarget;
  if (el.dataset.fb) return;
  el.dataset.fb = "1";
  el.src = DEFAULT_PRODUCT_IMAGE;
}

/** Client-side compression: fit within maxSize box, JPEG at given quality. */
export async function fileToCompressedDataUrl(
  file: File,
  maxSize = 900,
  quality = 0.82
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
}
