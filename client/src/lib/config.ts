const CLOUD_API_URL = "https://portfolio-os-api-5c7z.onrender.com";

/**
 * Dynamically resolves the active API backend URL.
 *
 * Rules:
 * - Both localhost (dev) and GitHub Pages (production) connect to the EXACT SAME
 *   cloud backend (CLOUD_API_URL) by default. This guarantees that chats, game scores,
 *   guestbook signatures, and database entries are 100% synchronized and identical between dev and prod.
 * - If you explicitly want to run a local backend on your machine on port 4000,
 *   simply append ?api=local (e.g. http://localhost:5173/?api=local).
 */
function resolveApiUrl(): string {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("api") === "local") {
        return "http://localhost:4000";
      }
    } catch {
      // ignore
    }
  }

  return import.meta.env.VITE_API_URL || CLOUD_API_URL;
}

export const API_URL = resolveApiUrl();


