/**
 * Resolves any static public asset path using Vite's BASE_URL so assets work seamlessly
 * both in local dev (/) and in subpath production deployments like GitHub Pages (/OS/).
 */
export function getAssetUrl(path: string): string {
  if (!path) return "";
  // Return external or data URLs as-is
  if (/^(https?:|\/\/|data:|blob:)/.test(path)) {
    return path;
  }
  // Remove leading slashes to prevent root domain resolution
  const cleanPath = path.replace(/^\/+/, "");
  // Prefix with Vite's configured BASE_URL (e.g. "./" or "/OS/")
  const base = import.meta.env.BASE_URL || "./";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${cleanPath}`;
}
