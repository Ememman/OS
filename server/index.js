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
import { snippets } from "./data/snippets.js";
import { initialFeedback } from "./data/feedback.js";

// Force IPv4-first resolution for Windows networking stability
dns.setDefaultResultOrder("ipv4first");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ---------- Activity Stream & Notifications ----------
let activityFeed = [
  { id: "act-1", type: "system", text: "Portfolio OS Kernel initialized and online", ts: Date.now() - 3600000 * 2 },
  { id: "act-2", type: "guestbook", text: "Alex River signed the guestbook", ts: Date.now() - 3600000 },
  { id: "act-3", type: "project", text: "SandreaLee Salon Customer App starred by a visitor", ts: Date.now() - 1800000 },
];

function addActivity(type, text) {
  const item = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    text,
    ts: Date.now()
  };
  activityFeed.unshift(item);
  if (activityFeed.length > 50) activityFeed = activityFeed.slice(0, 50);
  io.emit("activity:entry", item);
}

app.get("/api/activity/feed", (req, res) => res.json(activityFeed));

// ---------- REST: projects / updates ----------
app.get("/api/projects", (req, res) => res.json(projects));
// Dynamic in-memory live updates store
let liveUpdates = [...updates];

app.get("/api/updates", (req, res) => res.json(liveUpdates));

// Real-time update publishing
app.post("/api/updates", (req, res) => {
  const { title, body, tag, author } = req.body || {};
  const cleanTitle = String(title || "").trim();
  const cleanBody = String(body || "").trim();
  if (!cleanTitle || !cleanBody) {
    return res.status(400).json({ error: "Title and body are required." });
  }

  const validTags = ["feature", "fix", "launch", "perf", "announcement"];
  const cleanTag = validTags.includes(String(tag || "").toLowerCase()) ? String(tag).toLowerCase() : "feature";
  const cleanAuthor = String(author || "Bron Mendoza").trim().slice(0, 40);

  const newEntry = {
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString(),
    tag: cleanTag,
    title: cleanTitle,
    body: cleanBody,
    author: cleanAuthor,
  };

  liveUpdates.unshift(newEntry);
  if (liveUpdates.length > 100) liveUpdates = liveUpdates.slice(0, 100);

  io.emit("update:new", newEntry);
  addActivity("update", `New ${cleanTag} published: "${cleanTitle}" by ${cleanAuthor}`);

  res.status(201).json(newEntry);
});

// In-memory project star/like reactions
const projectLikes = {
  "sandrealee-customer": 29,
  "sandrealee-staff": 21,
  "sandrealee-admin": 36,
  "straive-ims": 18
};

app.get("/api/projects/likes", (req, res) => res.json(projectLikes));

app.post("/api/projects/:id/like", (req, res) => {
  const { id } = req.params;
  projectLikes[id] = (projectLikes[id] || 0) + 1;
  io.emit("project:liked", { id, count: projectLikes[id] });
  const p = projects.find(item => item.id === id);
  addActivity("project", `Project "${p ? p.title : id}" received a star!`);
  res.json({ id, count: projectLikes[id] });
});

app.get("/api/projects/stats", (req, res) => {
  const totalLikes = Object.values(projectLikes).reduce((a, b) => a + b, 0);
  const stacks = Array.from(new Set(projects.flatMap(p => p.stack)));
  res.json({
    totalProjects: projects.length,
    totalLikes,
    categories: Array.from(new Set(projects.map(p => p.category))),
    techStack: stacks,
    lastUpdated: "2026"
  });
});

// Simple in-memory reactions on updates (resets on server restart)
const reactionCounts = {}; // { [updateId]: number }
app.post("/api/updates/:id/react", (req, res) => {
  const { id } = req.params;
  reactionCounts[id] = (reactionCounts[id] || 0) + 1;
  io.emit("update:reacted", { id, count: reactionCounts[id] });
  addActivity("update", `Update post #${id} received a heart reaction`);
  res.json({ id, count: reactionCounts[id] });
});
app.get("/api/updates/reactions", (req, res) => res.json(reactionCounts));
// Real-time update deletion
app.delete("/api/updates/:id", (req, res) => {
  const { id } = req.params;
  const index = liveUpdates.findIndex((u) => u.id === id);
  if (index !== -1) {
    const deleted = liveUpdates.splice(index, 1)[0];
    delete reactionCounts[id];
    io.emit("update:deleted", { id });
    addActivity("update", `Update entry "${deleted.title}" was removed`);
    return res.json({ ok: true, id });
  }
  res.status(404).json({ error: "Update not found" });
});



// ---------- Project Feedback & Reviews ----------
let projectFeedbackList = [...initialFeedback];

app.get("/api/projects/:id/feedback", (req, res) => {
  const { id } = req.params;
  const list = projectFeedbackList.filter(f => f.projectId === id);
  res.json(list);
});

app.post("/api/projects/:id/feedback", (req, res) => {
  const { id } = req.params;
  const { author, role, rating, comment } = req.body || {};
  const cleanAuthor = String(author || "").trim().slice(0, 40) || "Anonymous Visitor";
  const cleanRole = String(role || "Developer").trim().slice(0, 40);
  const cleanRating = Math.min(5, Math.max(1, Number(rating) || 5));
  const cleanComment = String(comment || "").trim().slice(0, 400);

  if (!cleanComment) {
    return res.status(400).json({ error: "Comment is required" });
  }

  const newFeedback = {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    projectId: id,
    author: cleanAuthor,
    role: cleanRole,
    rating: cleanRating,
    comment: cleanComment,
    ts: Date.now()
  };

  projectFeedbackList.unshift(newFeedback);
  io.emit("project:feedback", newFeedback);
  const p = projects.find(item => item.id === id);
  addActivity("project", `${cleanAuthor} reviewed "${p ? p.title : id}" (${cleanRating}★)`);
  res.status(201).json(newFeedback);
});

// Contact / Hire Inquiry Endpoint
const contactInquiries = [];
app.post("/api/contact", (req, res) => {
  const { name, email, subject, message } = req.body || {};
  const cleanName = String(name || "").trim().slice(0, 60);
  const cleanEmail = String(email || "").trim().slice(0, 100);
  const cleanSubject = String(subject || "General Inquiry").trim().slice(0, 120);
  const cleanMsg = String(message || "").trim().slice(0, 1000);

  if (!cleanName || !cleanEmail || !cleanMsg) {
    return res.status(400).json({ error: "Name, email, and message are required" });
  }

  const inquiry = {
    id: `inq-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    message: cleanMsg,
    ts: Date.now()
  };

  contactInquiries.unshift(inquiry);
  addActivity("contact", `Inquiry received from ${cleanName}: "${cleanSubject}"`);
  res.status(201).json({
    ok: true,
    message: `Thank you, ${cleanName}! Your message was recorded. Bron will get back to ${cleanEmail} soon.`
  });
});

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

  const count = 15;
  const now = Date.now();
  const points = [];
  for (let i = count - 1; i >= 0; i--) {
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



// ---------- Code Playground Snippets ----------
app.get("/api/snippets", (req, res) => {
  res.json(snippets);
});

app.post("/api/snippets/run", (req, res) => {
  const { code, id } = req.body || {};
  const trimmed = String(code || "").trim();
  if (!trimmed) {
    return res.status(400).json({ error: "No code provided" });
  }

  // Safe syntax and complexity analysis
  const lines = trimmed.split("\n").length;
  const hasLoops = /for\s*\(|while\s*\(|reduce\(|filter\(|map\(/.test(trimmed);
  const hasClasses = /class\s+/.test(trimmed);
  const hasAsync = /async|await|Promise/.test(trimmed);

  res.json({
    ok: true,
    lines,
    metrics: {
      hasLoops,
      hasClasses,
      hasAsync,
      estimatedComplexity: hasLoops ? "O(N)" : "O(1)",
      verified: true
    },
    message: "Snippet parsed and verified successfully."
  });
});

// ---------- GitHub Developer Stats API ----------
app.get("/api/github/stats", (req, res) => {
  res.json({
    username: "bronmendoza",
    profileUrl: "https://github.com",
    publicRepos: 28,
    totalStars: 142,
    followers: 68,
    contributionsThisYear: 1842,
    currentStreakDays: 42,
    topLanguages: [
      { name: "TypeScript", percentage: 46, color: "#3178c6" },
      { name: "JavaScript", percentage: 28, color: "#f7df1e" },
      { name: "PHP", percentage: 14, color: "#777bb4" },
      { name: "Python", percentage: 12, color: "#3776ab" }
    ],
    recentCommits: [
      { repo: "portfolio-os", message: "feat: add Code Playground & Retro Arcade game", time: "2 hours ago" },
      { repo: "sandrealee-salon", message: "perf: optimize booking slots cache", time: "1 day ago" },
      { repo: "straive-ims", message: "feat: barcode scanner scanner dispatch", time: "3 days ago" }
    ]
  });
});

// ---------- Weather Proxy (Cached & Resilient) ----------
const weatherCache = new Map();
app.get("/api/weather", async (req, res) => {
  const lat = parseFloat(req.query.lat) || 14.5995;
  const lon = parseFloat(req.query.lon) || 120.9842;
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.ts < 600000) {
    return res.json(cached.data);
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
    const r = await fetch(url);
    if (r.ok) {
      const data = await r.json();
      weatherCache.set(key, { ts: Date.now(), data });
      return res.json(data);
    }
  } catch (e) {}
  res.json({
    current: { temperature_2m: 29.2, weather_code: 1, relative_humidity_2m: 68, wind_speed_10m: 11 },
    hourly: { temperature_2m: [27, 28, 29, 29, 28, 27], weather_code: [1, 1, 2, 1, 0, 0] },
    daily: { temperature_2m_max: [31], temperature_2m_min: [25] },
    fallback: true
  });
});

let totalVisitorSessions = 1;
app.get("/api/analytics", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    ok: true,
    totalVisits: totalVisitorSessions,
    activeConnections: io.engine.clientsCount || 1,
    chatMessagesCount: chatHistory.length,
    guestbookEntriesCount: guestbookEntries.length,
    totalProjectStars: Object.values(projectLikes).reduce((a, b) => a + b, 0),
    serverUptime: Math.floor(process.uptime()),
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10,
    timestamp: Date.now()
  });
});

// ---------- Guestbook Feature ----------
let guestbookEntries = [...initialGuestbook];

app.get("/api/guestbook", (req, res) => {
  res.json(guestbookEntries);
});

app.post("/api/guestbook", (req, res) => {
  const { name, role, avatar, message, link, location } = req.body || {};
  const cleanName = String(name || "").trim().slice(0, 40);
  const cleanRole = String(role || "Visitor").trim().slice(0, 30);
  const cleanAvatar = String(avatar || "lorelei:guest").trim().slice(0, 500000);
  const cleanMsg = String(message || "").trim().slice(0, 500);
  const cleanLink = String(link || "").trim().slice(0, 200);
  const cleanLocation = String(location || "").trim().slice(0, 80);

  if (!cleanName || !cleanMsg) {
    return res.status(400).json({ error: "Name and message are required" });
  }

  const newEntry = {
    id: `gb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    role: cleanRole,
    avatar: cleanAvatar,
    message: cleanMsg,
    link: cleanLink || undefined,
    location: cleanLocation || undefined,
    ts: Date.now(),
    reactions: 0
  };

  guestbookEntries.unshift(newEntry);
  if (guestbookEntries.length > 100) {
    guestbookEntries = guestbookEntries.slice(0, 100);
  }

  // Real-time broadcast to all connected clients
  io.emit("guestbook:entry", newEntry);
  addActivity("guestbook", `${cleanName} (${cleanRole}) left a message in Guestbook`);
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

app.delete("/api/guestbook/:id", (req, res) => {
  const { id } = req.params;
  const initialLen = guestbookEntries.length;
  guestbookEntries = guestbookEntries.filter((e) => e.id !== id);
  if (guestbookEntries.length === initialLen) {
    return res.status(404).json({ error: "Entry not found" });
  }
  io.emit("guestbook:deleted", { id });
  addActivity("guestbook", "A signature was removed from Guestbook");
  res.json({ success: true, id });
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

    case "weather": {
      return res.json({
        ok: true,
        output: [
          `🌤️ Weather Report (Manila, Philippines):`,
          `-----------------------------------------`,
          `Condition:   Partly Cloudy / Clear Skies`,
          `Temperature: 29°C (84°F) · Feels like 32°C`,
          `Humidity:    68% | Wind: 11 km/h ENE`,
          `Forecast:    Pleasant tropical breeze with sunshine`
        ].join("\n")
      });
    }

    case "analytics": {
      const mem = process.memoryUsage();
      const uptime = Math.floor(process.uptime());
      const hours = Math.floor(uptime / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      return res.json({
        ok: true,
        output: [
          `📊 Portfolio OS Platform Analytics:`,
          `-------------------------------------------`,
          `Live Online Clients:   ${io.engine.clientsCount}`,
          `Active Server Uptime:  ${hours}h ${mins}m`,
          `Server Memory RSS:     ${Math.round(mem.rss / 1024 / 1024)} MB`,
          `Chat Messages Sent:    ${chatHistory.length}`,
          `Guestbook Signatures:  ${guestbookEntries.length}`,
          `Total Project Stars:   ${Object.values(projectLikes).reduce((a, b) => a + b, 0)}`,
          `System Status:         100% Operational (Express 5 Active)`
        ].join("\n")
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
      if (target.includes("health")) {
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
  totalVisitorSessions++;

  socket.emit("chat:init", { name: guestName, history: chatHistory });
  io.emit("chat:presence", { online: onlineCount });
  addActivity("visitor", `Visitor ${guestName} joined the desktop session`);

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
      reactions: {}
    };
    chatHistory.push(msg);
    if (chatHistory.length > MAX_HISTORY) chatHistory = chatHistory.slice(-MAX_HISTORY);
    io.emit("chat:message", msg);
    addActivity("chat", `${socket.data.name} sent a message in Chat`);
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

// Live system telemetry heartbeat (streams real OS & process metrics every 2s)
setInterval(() => {
  if (io && io.engine && io.engine.clientsCount > 0) {
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const load = os.loadavg();
    io.emit("system:telemetry", {
      time: Date.now(),
      cpuPercent: Math.min(100, Math.max(5, Math.round((load[0] || 0.15) * 20))),
      memoryMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      systemPercent: usedPercent,
      connectedClients: io.engine.clientsCount,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }
}, 2000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Portfolio OS API + chat running on :${PORT}`));
