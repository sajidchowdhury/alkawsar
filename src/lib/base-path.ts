/**
 * Base-path helper for sub-path deployments (e.g. https://inventoryos.xyz/alkawsar).
 *
 * NEXT_PUBLIC_BASE_PATH is inlined at build time by Next.js, so this works in
 * both client and server code with zero runtime cost. Leave the variable unset
 * for root deployments and every path resolves unchanged.
 *
 * Client-side fetch() calls are NOT auto-prefixed by Next.js basePath, so use
 * `withBasePath("/api/...")` for all manual fetches. next/image and next/link
 * handle the prefix automatically.
 */
export const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
