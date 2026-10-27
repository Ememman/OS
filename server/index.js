import "dotenv/config";
import dns from "node:dns";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";
import { projects } from "./data/projects.js";
import { updates } from "./data/updates.js";

// A genuinely common cause of Node's fetch() throwing a bare "fetch failed"
// on Windows: the OS reports IPv6 as available even when there's no real
// route to the internet over it, and Node's default DNS ordering tries IPv6
// first. Forcing IPv4-first resolution is the standard fix and is safe
// everywhere — it doesn't affect requests to hosts that are IPv4-only or
// dual-stack, only changes which address family gets tried first.
dns.setDefaultResultOrder("ipv4first");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ---------- REST: projects / updates ----------
app.get("/api/projects", (req, res) => res.json(projects));
app.get("/api/updates", (req, res) => res.json(updates));

// simple in-memory reactions on updates (resets on server restart)
const reactionCounts = {}; // { [updateId]: number }
app.post("/api/updates/:id/react", (req, res) => {
  const { id } = req.params;
  reactionCounts[id] = (reactionCounts[id] || 0) + 1;
  io.emit("update:reacted", { id, count: reactionCounts[id] });
  res.json({ id, count: reactionCounts[id] });
});
app.get("/api/updates/reactions", (req, res) => res.json(reactionCounts));

app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    ok: true,
    service: "Portfolio OS API",
    timestamp: Date.now(),
    uptimeSeconds: Math.floor(process.uptime()),
    realtime: { connectedClients: io.engine.clientsCount }
  });
});

// A realistic, current-looking browser User-Agent. Deliberately NOT a
// custom string identifying this app — some corporate/ISP-level filters and
// WAFs are more likely to flag an unusual, obviously-non-browser UA as bot
// traffic than to reject a normal one, which is the opposite of what we want.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchWithRetry(url, options = {}, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === retries) throw err;
      // Transient blips (a dropped packet, a slow DNS lookup) are common
      // enough that one quiet retry before surfacing an error is worth it.
      await new Promise((r) => setTimeout(r, 400));
    }
  }
}

// ---------- Music search (real songs, 30-second previews) ----------
// Proxied server-side rather than called directly from the browser because
// the iTunes Search API doesn't reliably send CORS headers for cross-origin
// fetch() calls — routing it through our own backend sidesteps that entirely.
app.get("/api/music/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ results: [] });

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
    const data = await r.json();
    const results = (data.results || [])
      .filter((t) => t.previewUrl)
      .map((t) => ({
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
    res.json({ results });
  } catch (err) {
    clearTimeout(timeoutId);
    // Node's fetch (undici) wraps the real problem in `err.cause` and just
    // says "fetch failed" at the top level — logging the cause is the only
    // way to actually tell DNS failure vs. connection refused vs. a
    // corporate proxy/firewall blocking outbound HTTPS apart.
    const isTimeout = err.name === "AbortError";
    const cause = err.cause ? ` — cause: ${err.cause.code || err.cause.message || err.cause}` : "";
    console.error(`Music search failed: ${isTimeout ? "request timed out" : err.message}${cause}`);
    res.status(502).json({
      results: [],
      error: isTimeout
        ? "Search timed out — the network this server is running on may be slow or blocking outbound requests."
        : "Couldn't reach itunes.apple.com from this server. This is almost always a network/firewall issue on the machine running the backend (corporate network, VPN, or no internet access), not a bug in the app — check the server terminal for the exact cause logged there."
    });
  }
});

// ---------- Full-song search (YouTube) ----------
// The old "listType=search" embed trick (searching directly inside the
// iframe player with no API key) has been locked down by YouTube for most
// videos and mostly returns "this video is unavailable" now. The reliable
// way to get full-length playback is: look up real video IDs via the
// official YouTube Data API, then embed each one by its specific ID —
// specific-video embeds always work; search-as-a-playlist embeds don't
// anymore. The Data API needs a free API key from Google Cloud Console,
// set as YOUTUBE_API_KEY — see server/.env.example.
app.get("/api/music/youtube-search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ results: [], configured: !!process.env.YOUTUBE_API_KEY });

  if (!process.env.YOUTUBE_API_KEY) {
    return res.json({ results: [], configured: false });
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=8&q=${encodeURIComponent(q)}&key=${process.env.YOUTUBE_API_KEY}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || `YouTube API responded ${r.status}`);
    const results = (data.items || [])
      .filter((v) => v.id?.videoId)
      .map((v) => ({
        id: v.id.videoId,
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
        thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url
      }));
    res.json({ results, configured: true });
  } catch (err) {
    clearTimeout(timeoutId);
    const cause = err.cause ? ` — cause: ${err.cause.code || err.cause.message || err.cause}` : "";
    console.error(`YouTube search failed: ${err.message}${cause}`);
    res.status(502).json({ results: [], configured: true, error: "YouTube search request failed — check the server terminal for details." });
  }
});

// ---------- Chat (anonymous, no login) ----------
const ADJECTIVES = ["Swift", "Quiet", "Amber", "Cosmic", "Lucky", "Nimble", "Gentle", "Bright", "Wandering", "Velvet"];
const ANIMALS = ["Falcon", "Otter", "Lynx", "Comet", "Heron", "Fox", "Whale", "Sparrow", "Marlin", "Wren"];
const nano = customAlphabet("0123456789", 3);
const randomName = () =>
  `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]}${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}${nano()}`;

const MAX_HISTORY = 100;
let chatHistory = [];
let onlineCount = 0;

io.on("connection", (socket) => {
  const guestName = randomName();
  socket.data.name = guestName;
  onlineCount++;

  socket.emit("chat:init", { name: guestName, history: chatHistory });
  io.emit("chat:presence", { online: onlineCount });

  socket.on("chat:rename", (newName) => {
    const clean = String(newName || "").trim().slice(0, 20);
    if (clean) socket.data.name = clean;
  });

  socket.on("chat:message", (text, ack) => {
    const clean = String(text || "").trim().slice(0, 500);
    if (!clean) {
      if (typeof ack === "function") ack({ ok: false, error: "empty" });
      return;
    }
    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: socket.data.name,
      text: clean,
      ts: Date.now()
    };
    chatHistory.push(msg);
    if (chatHistory.length > MAX_HISTORY) chatHistory = chatHistory.slice(-MAX_HISTORY);
    io.emit("chat:message", msg);
    // Acknowledge back to the sender specifically, so the client can confirm
    // delivery (and swap out its optimistic local echo) instead of just
    // hoping the broadcast round-trip arrives.
    if (typeof ack === "function") ack({ ok: true, message: msg });
  });

  socket.on("chat:typing", () => {
    socket.broadcast.emit("chat:typing", { name: socket.data.name });
  });

  socket.on("disconnect", () => {
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit("chat:presence", { online: onlineCount });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Portfolio OS API + chat running on :${PORT}`));
