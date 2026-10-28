import "dotenv/config";
import dns from "node:dns";
import os from "node:os";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";
import { projects } from "./data/projects.js";
import { updates } from "./data/updates.js";
import { initialGuestbook } from "./data/guestbook.js";

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

// ---------- System Diagnostics & Metrics ----------
app.get("/api/system/info", (req, res) => {
  const mem = process.memoryUsage();
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  res.json({
    ok: true,
    service: "Portfolio OS System Diagnostics",
    timestamp: Date.now(),
    os: {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      hostname: os.hostname(),
    },
    node: {
      version: process.version,
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
    },
    cpu: {
      model: cpus[0]?.model || "Modern Multi-core CPU",
      cores: cpus.length,
      speedMHz: cpus[0]?.speed || 2400,
      loadAvg: os.loadavg(),
    },
    memory: {
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
      rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
      systemTotalMb: Math.round(totalMem / 1024 / 1024),
      systemFreeMb: Math.round(freeMem / 1024 / 1024),
      systemUsedMb: Math.round((totalMem - freeMem) / 1024 / 1024),
      usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
    },
    realtime: {
      connectedClients: io.engine.clientsCount || 1,
    }
  });
});

// Fast Ping endpoint for round-trip latency checks
app.get("/api/system/ping", (req, res) => {
  res.json({ pong: true, time: Date.now() });
});

// Metric history generator for charts
app.get("/api/system/metrics", (req, res) => {
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

  // Return a small history array for charts
  const count = 15;
  const now = Date.now();
  const points = [];
  for (let i = count - 1; i >= 0; i--) {
    // Generate slight realistic variance around current values
    const jitter = Math.sin(i * 0.7) * 4;
    points.push({
      time: now - i * 2000,
      cpuPercent: Math.min(100, Math.max(5, Math.round(18 + jitter + (i === 0 ? 3 : 0)))),
      memoryMb: Math.round((mem.heapUsed / 1024 / 1024) + jitter * 0.5),
      systemPercent: Math.min(100, Math.max(10, Math.round(usedPercent + (jitter * 0.4))))
    });
  }

  res.json({
    timestamp: now,
    current: {
      cpuPercent: points[points.length - 1].cpuPercent,
      memoryMb: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10,
      systemPercent: usedPercent,
    },
    history: points
  });
});

// ---------- Guestbook Feature ----------
let guestbookEntries = [...initialGuestbook];

app.get("/api/guestbook", (req, res) => {
  res.json(guestbookEntries);
});

app.post("/api/guestbook", (req, res) => {
  const { name, role, avatar, message } = req.body || {};
  const cleanName = String(name || "").trim().slice(0, 30);
  const cleanRole = String(role || "Visitor").trim().slice(0, 30);
  const cleanAvatar = String(avatar || "👋").trim().slice(0, 8);
  const cleanMsg = String(message || "").trim().slice(0, 400);

  if (!cleanName || !cleanMsg) {
    return res.status(400).json({ error: "Name and message are required" });
  }

  const newEntry = {
    id: `gb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    role: cleanRole,
    avatar: cleanAvatar,
    message: cleanMsg,
    ts: Date.now(),
    reactions: 0
  };

  guestbookEntries.unshift(newEntry);
  if (guestbookEntries.length > 100) {
    guestbookEntries = guestbookEntries.slice(0, 100);
  }

  // Real-time broadcast to all connected clients
  io.emit("guestbook:entry", newEntry);
  res.status(201).json(newEntry);
});

app.post("/api/guestbook/:id/react", (req, res) => {
  const { id } = req.params;
  const entry = guestbookEntries.find((e) => e.id === id);
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  entry.reactions = (entry.reactions || 0) + 1;
  io.emit("guestbook:reacted", { id, reactions: entry.reactions });
  res.json({ id, reactions: entry.reactions });
});

// ---------- Interactive Terminal Backend Execution ----------
const DEV_QUOTES = [
  "“Simplicity is prerequisite for reliability.” — Edsger W. Dijkstra",
  "“Make it work, make it right, make it fast.” — Kent Beck",
  "“First, solve the problem. Then, write the code.” — John Johnson",
  "“Any fool can write code that a computer can understand. Good programmers write code that humans can understand.” — Martin Fowler",
  "“Talk is cheap. Show me the code.” — Linus Torvalds"
];

const DEV_JOKES = [
  "There are 10 types of people in the world: those who understand binary, and those who don't.",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
  "Why do Java programmers have to wear glasses? Because they don't C#.",
  "To understand recursion, you must first understand recursion."
];

app.post("/api/terminal/exec", (req, res) => {
  const { command } = req.body || {};
  const trimmed = String(command || "").trim();
  const [cmd, ...args] = trimmed.split(/\s+/);
  const lower = (cmd || "").toLowerCase();

  switch (lower) {
    case "sysinfo":
    case "server": {
      const mem = process.memoryUsage();
      const uptime = Math.floor(process.uptime());
      const hours = Math.floor(uptime / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      const secs = uptime % 60;
      return res.json({
        ok: true,
        output: [
          `Server Host: ${os.hostname()} (${os.platform()} ${os.arch()})`,
          `Node Version: ${process.version}`,
          `Process Uptime: ${hours}h ${mins}m ${secs}s`,
          `Heap Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
          `RSS Memory: ${Math.round(mem.rss / 1024 / 1024)}MB`,
          `Active Socket Clients: ${io.engine.clientsCount}`,
          `System Cores: ${os.cpus().length} @ ${os.cpus()[0]?.speed || 0}MHz`
        ].join("\n")
      });
    }

    case "ping": {
      const host = args[0] || "localhost:4000";
      return res.json({
        ok: true,
        output: `PING ${host}: 64 bytes from server, seq=1 time=0.42ms, TTL=64 (status 200 OK)`
      });
    }

    case "quote": {
      const q = DEV_QUOTES[Math.floor(Math.random() * DEV_QUOTES.length)];
      return res.json({ ok: true, output: q });
    }

    case "joke": {
      const j = DEV_JOKES[Math.floor(Math.random() * DEV_JOKES.length)];
      return res.json({ ok: true, output: j });
    }

    case "curl": {
      const target = args[0] || "/api/health";
      if (target === "/api/health" || target === "api/health") {
        return res.json({
          ok: true,
          output: JSON.stringify({
            ok: true,
            service: "Portfolio OS API",
            timestamp: Date.now(),
            uptimeSeconds: Math.floor(process.uptime()),
            realtime: { connectedClients: io.engine.clientsCount }
          }, null, 2)
        });
      }
      if (target.includes("project")) {
        return res.json({
          ok: true,
          output: `HTTP/1.1 200 OK\nContent-Type: application/json\n[ ${projects.length} portfolio projects loaded ]`
        });
      }
      return res.json({
        ok: true,
        output: `HTTP/1.1 200 OK\nFetched resource from ${target}`
      });
    }

    default:
      return res.status(400).json({
        ok: false,
        error: `Unknown server command: '${lower}'. Try 'sysinfo', 'ping', 'quote', 'joke', or 'curl'.`
      });
  }
});

// A realistic, current-looking browser User-Agent
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchWithRetry(url, options = {}, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 400));
    }
  }
}

// ---------- Music search (real songs, 30-second previews) ----------
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
    const isTimeout = err.name === "AbortError";
    const cause = err.cause ? ` — cause: ${err.cause.code || err.cause.message || err.cause}` : "";
    console.error(`Music search failed: ${isTimeout ? "request timed out" : err.message}${cause}`);
    res.status(502).json({
      results: [],
      error: isTimeout
        ? "Search timed out — the network this server is running on may be slow or blocking outbound requests."
        : "Couldn't reach itunes.apple.com from this server."
    });
  }
});

// ---------- Full-song search (YouTube) ----------
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
    res.status(502).json({ results: [], configured: true, error: "YouTube search request failed." });
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
      ts: Date.now(),
      reactions: {} // emoji -> count
    };
    chatHistory.push(msg);
    if (chatHistory.length > MAX_HISTORY) chatHistory = chatHistory.slice(-MAX_HISTORY);
    io.emit("chat:message", msg);
    if (typeof ack === "function") ack({ ok: true, message: msg });
  });

  // Chat message emoji reaction
  socket.on("chat:react", ({ id, emoji }) => {
    const validEmojis = ["❤️", "👍", "🔥", "🚀", "😂"];
    if (!id || !validEmojis.includes(emoji)) return;
    const msg = chatHistory.find((m) => m.id === id);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
      io.emit("chat:reacted", { id, emoji, reactions: msg.reactions });
    }
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
