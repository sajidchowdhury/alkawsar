import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Detect content type from the base64 header (admin uploads are JPEG/PNG/WebP). */
function sniffContentType(b64: string): string {
  if (b64.startsWith("/9j/")) return "image/jpeg";
  if (b64.startsWith("iVBORw0KGgo")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

/**
 * Public product image endpoint — serves the owner-uploaded image stored in DB.
 * URL is versioned (?v=imageVersion) so browsers cache aggressively but bust
 * correctly after an upload.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await db.product.findUnique({
      where: { slug },
      select: { imageData: true },
    });

    if (!product?.imageData) {
      return NextResponse.json({ error: "ছবি নেই" }, { status: 404 });
    }

    const clean = product.imageData.includes(",")
      ? product.imageData.slice(product.imageData.indexOf(",") + 1)
      : product.imageData;
    const bytes = Buffer.from(clean, "base64");
    if (bytes.length === 0) {
      return NextResponse.json({ error: "ছবি নেই" }, { status: 404 });
    }

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": sniffContentType(clean),
        "Content-Length": String(bytes.length),
        // Versioned URL — safe to cache forever.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("GET /api/product-image failed", err);
    return NextResponse.json({ error: "সার্ভার সমস্যা" }, { status: 500 });
  }
}
