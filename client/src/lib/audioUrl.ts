// Resolves audio URLs to safe, same-origin playable URLs.
// When an external Apple preview URL (audio-ssl.itunes.apple.com) is played directly in Chrome on Windows,
// Windows Media Foundation routes the 'audio/x-m4p' MIME header to its FairPlay DRM pipeline, muting sound.
// By fetching the unencrypted AAC stream and wrapping it into a standard 'audio/mp4' Blob,
// the browser plays it directly with the native AAC decoder with 100% sound fidelity.

const blobCache = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string>>();

export async function resolveAudioSrc(src: string): Promise<string> {
  if (!src) return "";

  // Local assets, blob URLs, and data URLs can be played directly
  if (src.startsWith("/") || src.startsWith("blob:") || src.startsWith("data:")) {
    return src;
  }

  // Check in-memory cache
  if (blobCache.has(src)) {
    return blobCache.get(src)!;
  }

  // De-duplicate in-flight fetches for the same URL
  if (pendingFetches.has(src)) {
    return pendingFetches.get(src)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      const blob = new Blob([arrayBuf], { type: "audio/mp4" });
      const blobUrl = URL.createObjectURL(blob);
      blobCache.set(src, blobUrl);
      return blobUrl;
    } catch (err) {
      console.warn("Could not fetch audio as Blob, using direct URL:", err);
      return src;
    } finally {
      pendingFetches.delete(src);
    }
  })();

  pendingFetches.set(src, fetchPromise);
  return fetchPromise;
}
