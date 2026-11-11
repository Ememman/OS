const CLOUD_API_URL = "https://portfolio-os-api-5c7z.onrender.com";

/**
 * Dynamically resolves the active API backend URL.
 *
 * Rules:
 * - On local development (localhost / 127.0.0.1), connects to the local server (http://localhost:4000)
 *   which connects directly to the MongoDB Atlas cluster (portfolio_os).
 *   (Use ?api=cloud to test against the cloud backend).
 * - On deployed production (GitHub Pages), connects directly to the cloud backend (CLOUD_API_URL).
 */
function resolveApiUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local");

    if (isLocalhost) {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("api") === "cloud") {
          return CLOUD_API_URL;
        }
      } catch {
        // ignore
      }
      return "http://localhost:4000";
    }
  }

  return import.meta.env.VITE_API_URL || CLOUD_API_URL;
}

export const API_URL = resolveApiUrl();


