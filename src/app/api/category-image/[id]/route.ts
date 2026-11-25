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
 * Public category image endpoint — serves the owner-uploaded circle image
 * stored in DB. URL is versioned (?v=imageVersion) so browsers cache
 * aggressively but bust correctly after an upload.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await db.category.findUnique({
      where: { id },
      select: { imageData: true },
    });

    if (!category?.imageData) {
      return NextResponse.json({ error: "ছবি নেই" }, { status: 404 });
    }

    const clean = category.imageData.includes(",")
      ? category.imageData.slice(category.imageData.indexOf(",") + 1)
      : category.imageData;
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
    console.error("GET /api/category-image failed", err);
    return NextResponse.json({ error: "সার্ভার সমস্যা" }, { status: 500 });
  }
}
