const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1");

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (!isLocal
    ? "https://portfolio-os-api-5c7z.onrender.com"
    : "http://localhost:4000");
