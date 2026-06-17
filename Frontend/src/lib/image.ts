// Image URL helper. Three responsibilities:
//   1. Resolve backend-relative URLs (/uploads/...) to absolute ones
//      using the API origin from env.
//   2. Provide a single fallback used when an image is missing / broken.
//   3. A tiny `cloudinaryThumb` helper so swapping in Cloudinary later is a
//      one-call change. If the URL isn't a Cloudinary URL we just return it
//      unchanged — no surprises.
//
// We intentionally avoid runtime URL validation. Components render via <img>,
// which already degrades to alt text on 404. The fallback covers the
// "definitely empty" case (null/undefined).

import { env } from "@/config/env";

export const FALLBACK_IMAGE = "/placeholder.svg";

function apiOrigin(): string {
  // VITE_API_URL is e.g. https://solivaguard.com/api/v1 → strip the /api/v1 suffix.
  return env.VITE_API_URL.replace(/\/api\/v\d+\/?$/, "");
}

/** Resolve a backend image URL to something the browser can load. */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  if (url.startsWith("/uploads/")) return `${apiOrigin()}${url}`;
  return url;
}

/** Resolve and provide a transform suggestion for thumbnails. */
type ThumbOpts = { width?: number; height?: number; crop?: "fill" | "fit" };

export function cloudinaryThumb(url: string | null | undefined, opts: ThumbOpts = {}): string {
  const resolved = resolveImageUrl(url);
  if (!resolved.includes("res.cloudinary.com")) return resolved;

  const { width, height, crop = "fill" } = opts;
  const parts: string[] = [`c_${crop}`, "q_auto", "f_auto"];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  const transform = parts.join(",");

  // Inject transformation after `/upload/`
  return resolved.replace(/\/upload\//, `/upload/${transform}/`);
}
