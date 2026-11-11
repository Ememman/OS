const CLOUD_API_URL = "https://portfolio-os-api-5c7z.onrender.com";

/**
 * Dynamically resolves the active API backend URL.
 *
 * Rules:
 * 1. If running in a browser on any remote/deployed host (e.g. GitHub Pages ememman.github.io):
 *    ALWAYS use the production cloud backend (https://portfolio-os-api-5c7z.onrender.com).
 *    This ensures that deployed visitors and mobile devices always communicate with the cloud API
 *    and share the exact same MongoDB database.
 * 2. If running locally (localhost, 127.0.0.1):
 *    - If the URL query string has ?api=cloud, route to the cloud backend.
 *    - Otherwise, route to local server (http://localhost:4000) or VITE_API_URL.
 */
function resolveApiUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local");

    // Deployed production environment (e.g. GitHub Pages) -> ALWAYS Cloud API
    if (!isLocalhost) {
      return CLOUD_API_URL;
    }

    // Optional query param override on localhost (e.g. http://localhost:5173/?api=cloud)
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("api") === "cloud") {
        return CLOUD_API_URL;
      }
    } catch {
      // ignore
    }
  }

  // Local development fallback
  return import.meta.env.VITE_API_URL || "http://localhost:4000";
}

export const API_URL = resolveApiUrl();

