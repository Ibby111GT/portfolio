/**
 * Canonical site origin for metadata, sitemap, and robots. Prefers the
 * explicitly configured public URL, falls back to the deployment host on
 * Vercel, then localhost for dev builds.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");
