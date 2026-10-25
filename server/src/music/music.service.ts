import { Injectable, HttpException, HttpStatus } from "@nestjs/common";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 1): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error("Fetch failed");
}

@Injectable()
export class MusicService {
  async search(query: string) {
    const q = (query || "").trim();
    if (!q) return { results: [] };

    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=12`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const r = await fetchWithRetry(url, {
        signal: controller.signal,
        headers: { "User-Agent": BROWSER_UA, Accept: "application/json" }
      });
      clearTimeout(timeoutId);
      if (!r.ok) throw new Error(`iTunes API responded ${r.status}`);
      const data: any = await r.json();
      const results = (data.results || [])
        .filter((t: any) => t.previewUrl)
        .map((t: any) => ({
          id: String(t.trackId),
          title: t.trackName,
          artist: t.artistName,
          album: t.collectionName,
          cover: t.artworkUrl100?.replace("100x100", "300x300"),
          previewUrl: t.previewUrl,
          durationMs: t.trackTimeMillis,
          genre: t.primaryGenreName,
          storeUrl: t.trackViewUrl
        }));
      return { results };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === "AbortError";
      const cause = err.cause ? ` — cause: ${err.cause.code || err.cause.message || err.cause}` : "";
      console.error(`Music search failed: ${isTimeout ? "request timed out" : err.message}${cause}`);
      throw new HttpException(
        {
          results: [],
          error: isTimeout
            ? "Search timed out — slow network or outbound restriction."
            : "Couldn't reach iTunes API from server."
        },
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  async searchYouTube(query: string) {
    const q = (query || "").trim();
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!q) return { results: [], configured: !!apiKey };
    if (!apiKey) return { results: [], configured: false };

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=8&q=${encodeURIComponent(q)}&key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const r = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data: any = await r.json();
      if (!r.ok) throw new Error(data.error?.message || `YouTube API responded ${r.status}`);
      const results = (data.items || [])
        .filter((v: any) => v.id?.videoId)
        .map((v: any) => ({
          id: v.id.videoId,
          title: v.snippet.title,
          channel: v.snippet.channelTitle,
          thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url
        }));
      return { results, configured: true };
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error(`YouTube search failed: ${err.message}`);
      throw new HttpException(
        { results: [], configured: true, error: "YouTube search request failed." },
        HttpStatus.BAD_GATEWAY
      );
    }
  }
}

