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
import { initialLeaderboard } from "./data/leaderboard.js";
import { initialCloudFiles } from "./data/files.js";

// Force IPv4-first resolution for Windows networking stability
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- Security & Content Protection Middleware ----------
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ---------- Validation & Sanitization Utilities ----------
export function sanitizeText(str, maxLen = 1000) {
  if (typeof str !== "string") return "";
  const cleaned = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  return cleaned.trim().slice(0, maxLen);
}

export function sanitizePlain(str, maxLen = 1000) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email.trim());
}

// ---------- In-Memory Rate Limiting (Sliding Window) ----------
const rateLimitBuckets = new Map();

function createRateLimiter(options = { windowMs: 60000, max: 120, message: "Too many requests. Please slow down." }) {
  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();
    let record = rateLimitBuckets.get(key);

    if (!record || now - record.resetTime > options.windowMs) {
      record = { count: 1, resetTime: now };
      rateLimitBuckets.set(key, record);
    } else {
      record.count++;
      if (record.count > options.max) {
        const retrySecs = Math.ceil((record.resetTime + options.windowMs - now) / 1000);
        res.setHeader("Retry-After", retrySecs);
        return res.status(429).json({
          ok: false,
          error: options.message,
          retryAfterSeconds: retrySecs
        });
      }
    }
    next();
  };
}

// Sweep stale rate limiter buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitBuckets.entries()) {
    if (now - record.resetTime > 120000) rateLimitBuckets.delete(key);
  }
}, 300000);

const generalLimiter = createRateLimiter({ windowMs: 60000, max: 200, message: "General API rate limit reached. Please wait a minute." });
const strictSubmissionLimiter = createRateLimiter({ windowMs: 60000, max: 25, message: "Submission frequency limit reached. Please wait a minute before trying again." });

app.use("/api", generalLimiter);

// ---------- HTTP Server & Socket.IO Initialization ----------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ---------- Activity Stream & Notifications ----------
let activityFeed = [
  { id: "act-1", type: "system", text: "Portfolio OS Kernel initialized and online", ts: Date.now() - 3600000 * 2 },
  { id: "act-2", type: "guestbook", text: "Alex River signed the guestbook", ts: Date.now() - 3600000 },
  { id: "act-3", type: "project", text: "SandreaLee Salon Customer App starred by a visitor", ts: Date.now() - 1800000 },
];

// Rolling system log buffer
const SYSTEM_LOGS_MAX = 100;
let systemLogs = [
  { id: "log-1", ts: Date.now() - 120000, level: "info", module: "Kernel", message: "Portfolio OS core kernel v2.4 initialized with frosted glass compositor." },
  { id: "log-2", ts: Date.now() - 95000, level: "info", module: "SocketDaemon", message: `Real-time WebSocket presence bridge listening on port ${PORT}.` },
  { id: "log-3", ts: Date.now() - 60000, level: "debug", module: "AudioEngine", message: "WebAudio proxy and dynamic visualizer frequency analyser ready." },
  { id: "log-4", ts: Date.now() - 25000, level: "info", module: "ProcessMgr", message: "Virtual process scheduler initialized (6 active background tasks)." },
];

function logSystem(level, module, message) {
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    level,
    module,
    message
  };
  systemLogs.unshift(entry);
  if (systemLogs.length > SYSTEM_LOGS_MAX) systemLogs.pop();
  io.emit("system:log", entry);
}

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
  logSystem("info", type.toUpperCase(), text);
}

// ---------- Root Landing Route ----------
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Portfolio OS Backend API & Real-time Server",
    status: "online",
    healthCheck: "/api/health",
    spec: "/api/spec"
  });
});

app.get("/api/activity/feed", (req, res) => res.json(activityFeed));

// ---------- REST: projects / updates ----------
app.get("/api/projects", (req, res) => res.json(projects));

// Live updates array with real-time CRUD and multi-reactions
let liveUpdates = [...updates];
const updateReactions = {};

// Initialize default reactions for updates
liveUpdates.forEach((u, idx) => {
  const baseHeart = 3 + (idx % 4) * 2;
  const baseFire = 1 + (idx % 3);
  const baseRocket = 1 + (idx % 2);
  const baseParty = idx % 2;
  updateReactions[u.id] = {
    heart: baseHeart,
    fire: baseFire,
    rocket: baseRocket,
    party: baseParty,
    total: baseHeart + baseFire + baseRocket + baseParty
  };
});

app.get("/api/updates", (req, res) => {
  const { tag, q, sort } = req.query;
  let list = [...liveUpdates];
  if (tag && tag !== "all") {
    list = list.filter((u) => u.tag?.toLowerCase() === String(tag).toLowerCase());
  }
  if (q) {
    const query = String(q).toLowerCase();
    list = list.filter(
      (u) => u.title.toLowerCase().includes(query) || u.body.toLowerCase().includes(query)
    );
  }
  if (sort === "popular") {
    list.sort((a, b) => (updateReactions[b.id]?.total || 0) - (updateReactions[a.id]?.total || 0));
  } else if (sort === "oldest") {
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    // Default newest first (pinned float to top)
    list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }
  res.json(list);
});

// Create new update with validation
app.post("/api/updates", strictSubmissionLimiter, (req, res) => {
  const { title, tag, body, date, pinned } = req.body || {};
  const errors = [];

  const cleanTitle = sanitizePlain(title, 120);
  const cleanBody = sanitizePlain(body, 3500);
  const cleanTag = String(tag || "feature").trim().toLowerCase();

  if (!cleanTitle || cleanTitle.length < 3) errors.push("Title must be at least 3 characters.");
  if (!cleanBody || cleanBody.length < 5) errors.push("Body must be at least 5 characters.");

  const validTags = ["feature", "fix", "launch", "announcement", "performance"];
  const finalTag = validTags.includes(cleanTag) ? cleanTag : "feature";

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, error: "Validation Error", details: errors });
  }

  const newUpdate = {
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: date || new Date().toISOString().slice(0, 10),
    tag: finalTag,
    title: cleanTitle,
    body: cleanBody,
    pinned: Boolean(pinned)
  };

  liveUpdates.unshift(newUpdate);
  updateReactions[newUpdate.id] = { heart: 1, fire: 0, rocket: 0, party: 0, total: 1 };

  io.emit("update:new", newUpdate);
  addActivity("update", `New update published: "${newUpdate.title}"`);
  res.status(201).json(newUpdate);
});

// Multi-reaction support on updates
app.post("/api/updates/:id/react", (req, res) => {
  const { id } = req.params;
  const { type = "heart" } = req.body || {};
  const validTypes = ["heart", "fire", "rocket", "party"];
  const reactionType = validTypes.includes(type) ? type : "heart";

  if (!updateReactions[id]) {
    updateReactions[id] = { heart: 0, fire: 0, rocket: 0, party: 0, total: 0 };
  }

  updateReactions[id][reactionType] = (updateReactions[id][reactionType] || 0) + 1;
  updateReactions[id].total = (updateReactions[id].total || 0) + 1;

  const count = updateReactions[id].total;
  io.emit("update:reacted", {
    id,
    type: reactionType,
    count,
    reactions: updateReactions[id]
  });

  const u = liveUpdates.find((item) => item.id === id);
  addActivity("update", `Update "${u ? u.title : id}" received a ${reactionType} reaction`);
  res.json({ id, count, reactions: updateReactions[id] });
});

app.get("/api/updates/reactions", (req, res) => {
  const counts = {};
  for (const [key, val] of Object.entries(updateReactions)) {
    counts[key] = val.total;
  }
  res.json({ counts, detailed: updateReactions });
});

// Toggle pinned update
app.post("/api/updates/:id/pin", (req, res) => {
  const { id } = req.params;
  const updateItem = liveUpdates.find((u) => u.id === id);
  if (!updateItem) return res.status(404).json({ error: "Update not found" });

  updateItem.pinned = !updateItem.pinned;
  io.emit("update:pinned", { id, pinned: updateItem.pinned });
  res.json({ id, pinned: updateItem.pinned });
});

// Real-time update deletion
app.delete("/api/updates/:id", (req, res) => {
  const { id } = req.params;
  const index = liveUpdates.findIndex((u) => u.id === id);
  if (index !== -1) {
    const deleted = liveUpdates.splice(index, 1)[0];
    delete updateReactions[id];
    io.emit("update:deleted", { id });
    addActivity("update", `Update entry "${deleted.title}" was removed`);
    return res.json({ ok: true, id });
  }
  res.status(404).json({ error: "Update not found" });
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
  const p = projects.find((item) => item.id === id);
  addActivity("project", `Project "${p ? p.title : id}" received a star!`);
  res.json({ id, count: projectLikes[id] });
});

app.get("/api/projects/stats", (req, res) => {
  const totalLikes = Object.values(projectLikes).reduce((a, b) => a + b, 0);
  const stacks = Array.from(new Set(projects.flatMap((p) => p.stack)));
  res.json({
    totalProjects: projects.length,
    totalLikes,
    categories: Array.from(new Set(projects.map((p) => p.category))),
    techStack: stacks,
    lastUpdated: "2026"
  });
});

// ---------- Project Feedback & Reviews ----------
let projectFeedbackList = [...initialFeedback];

app.get("/api/projects/:id/feedback", (req, res) => {
  const { id } = req.params;
  const list = projectFeedbackList.filter((f) => f.projectId === id);
  res.json(list);
});

app.post("/api/projects/:id/feedback", strictSubmissionLimiter, (req, res) => {
  const { id } = req.params;
  const { author, role, rating, comment } = req.body || {};
  const errors = [];

  const cleanAuthor = sanitizePlain(author, 50) || "Anonymous Visitor";
  const cleanRole = sanitizePlain(role || "Developer", 40);
  const cleanRating = Math.min(5, Math.max(1, Number(rating) || 5));
  const cleanComment = sanitizePlain(comment, 600);

  if (!cleanComment || cleanComment.length < 3) {
    errors.push("Comment is required (minimum 3 characters).");
  }

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, error: "Validation Error", details: errors });
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
  const p = projects.find((item) => item.id === id);
  addActivity("project", `${cleanAuthor} reviewed "${p ? p.title : id}" (${cleanRating}★)`);
  res.status(201).json(newFeedback);
});

// ---------- Contact / Hire Inquiry Endpoint with Schema Validation ----------
const contactInquiries = [];

app.get("/api/contact/inquiries", (req, res) => {
  res.json({ count: contactInquiries.length, inquiries: contactInquiries.slice(0, 20) });
});

app.post("/api/contact", strictSubmissionLimiter, (req, res) => {
  const { name, email, subject, message } = req.body || {};
  const errors = [];

  const cleanName = sanitizePlain(name, 60);
  const cleanEmail = sanitizePlain(email, 100);
  const cleanSubject = sanitizePlain(subject || "General Inquiry", 120);
  const cleanMsg = sanitizePlain(message, 1500);

  if (!cleanName || cleanName.length < 2) {
    errors.push("Your name is required (minimum 2 characters).");
  }
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    errors.push("Please enter a valid email address (e.g. name@domain.com).");
  }
  if (!cleanMsg || cleanMsg.length < 5) {
    errors.push("Message body must be at least 5 characters long.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, error: "Validation Error", details: errors });
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
    message: `Thank you, ${cleanName}! Your message was successfully recorded. Bron will get back to ${cleanEmail} soon.`
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

// High-performance CPU & Memory stress benchmarking
app.post("/api/system/benchmark", (req, res) => {
  const start = performance.now();
  const memBefore = process.memoryUsage().heapUsed;

  // CPU Test: Numerical computation & prime testing
  let primesCount = 0;
  const limit = 25000;
  for (let i = 2; i <= limit; i++) {
    let isPrime = true;
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primesCount++;
  }

  // Memory & JSON Serialization Throughput Test
  const testPayload = Array.from({ length: 5000 }, (_, idx) => ({
    id: idx,
    hash: Math.random().toString(36).slice(2),
    data: "Portfolio-OS-Core-Telemetry-Payload-Sample",
    val: idx * 1.618
  }));
  const serialized = JSON.stringify(testPayload);
  const parsed = JSON.parse(serialized);

  const memAfter = process.memoryUsage().heapUsed;
  const durationMs = Math.max(0.1, performance.now() - start);
  const throughputMbSec = Math.round(((serialized.length / (1024 * 1024)) / (durationMs / 1000)) * 100) / 100;
  const opsPerSec = Math.round((limit / (durationMs / 1000)) * 10);

  let rating = "A+ (Ultra Fast)";
  if (durationMs > 120) rating = "A (Fast)";
  else if (durationMs > 300) rating = "B (Moderate)";

  const result = {
    ok: true,
    timestamp: Date.now(),
    durationMs: Math.round(durationMs * 100) / 100,
    metrics: {
      primesCalculated: primesCount,
      opsPerSec,
      jsonThroughputMbSec: throughputMbSec,
      payloadItemsProcessed: parsed.length,
      memoryDeltaKb: Math.round((memAfter - memBefore) / 1024),
      rating
    },
    system: {
      arch: os.arch(),
      platform: os.platform(),
      cpus: os.cpus().length,
      model: os.cpus()[0]?.model || "Multi-core Host",
      nodeVersion: process.version
    }
  };

  logSystem("info", "Benchmark", `Benchmark completed in ${result.durationMs}ms (${rating})`);
  res.json(result);
});

app.get("/api/system/benchmark", (req, res) => {
  res.json({
    ok: true,
    description: "Portfolio OS Kernel Stress Benchmark API",
    method: "POST to trigger a live benchmark test",
    capabilities: ["cpu-primes", "json-throughput", "memory-delta", "event-loop-latency"]
  });
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
      memoryMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      systemPercent: usedPercent,
    },
    history: points
  });
});

// ---------- Network Interfaces & Simulated Live Throughput ----------
let lastNetworkSample = Date.now();
let cumulativeRxBytes = 1420580;
let cumulativeTxBytes = 894200;

app.get("/api/system/network", (req, res) => {
  const interfaces = os.networkInterfaces();
  const ifaceList = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      ifaceList.push({
        name,
        address: addr.address,
        family: addr.family,
        mac: addr.mac,
        internal: addr.internal,
        netmask: addr.netmask,
      });
    }
  }

  const now = Date.now();
  const elapsedSec = Math.max(1, (now - lastNetworkSample) / 1000);
  lastNetworkSample = now;

  const clientWeight = (io.engine.clientsCount || 1) * 3.5;
  const rxKbps = Math.round((14.2 + Math.random() * 8.5 + clientWeight) * 10) / 10;
  const txKbps = Math.round((9.4 + Math.random() * 6.2 + clientWeight * 0.8) * 10) / 10;

  cumulativeRxBytes += Math.round(rxKbps * 1024 * elapsedSec);
  cumulativeTxBytes += Math.round(txKbps * 1024 * elapsedSec);

  res.json({
    ok: true,
    timestamp: now,
    interfaces: ifaceList,
    primaryInterface: ifaceList.find((i) => !i.internal && i.family === "IPv4") || ifaceList[0] || null,
    traffic: {
      rxKbps,
      txKbps,
      totalRxMb: Math.round((cumulativeRxBytes / 1024 / 1024) * 100) / 100,
      totalTxMb: Math.round((cumulativeTxBytes / 1024 / 1024) * 100) / 100,
      activeConnections: io.engine.clientsCount || 1,
      httpPort: PORT,
      protocol: "HTTP/1.1 + WebSocket (Engine.IO v4)",
      latencyMs: 14 + Math.round(Math.random() * 8)
    }
  });
});

// ---------- Live System Logs & Process Management ----------
app.get("/api/system/logs", (req, res) => {
  const { level, module } = req.query;
  let logs = [...systemLogs];
  if (level && level !== "all") {
    logs = logs.filter((l) => l.level.toLowerCase() === String(level).toLowerCase());
  }
  if (module && module !== "all") {
    logs = logs.filter((l) => l.module.toLowerCase() === String(module).toLowerCase());
  }
  res.json(logs);
});

app.post("/api/system/logs/clear", (req, res) => {
  systemLogs = [];
  const resetLog = {
    id: `log-${Date.now()}-reset`,
    ts: Date.now(),
    level: "info",
    module: "Kernel",
    message: "System event logs buffer cleared by administrator."
  };
  systemLogs.push(resetLog);
  io.emit("system:logs_cleared");
  io.emit("system:log", resetLog);
  res.json({ ok: true, message: "System logs buffer cleared successfully." });
});

// Simulated OS processes with live telemetry
const osProcesses = [
  { pid: 101, name: "kernel.sys", user: "system", cpu: 1.2, memoryMb: 24.5, threads: 8, status: "running", description: "Portfolio OS Kernel & Scheduler" },
  { pid: 104, name: "window-server", user: "bron", cpu: 3.4, memoryMb: 48.2, threads: 4, status: "running", description: "Glass Compositor & Display Manager" },
  { pid: 210, name: "socket-daemon", user: "system", cpu: 0.8, memoryMb: 16.1, threads: 2, status: "running", description: "Realtime WebSocket Hub" },
  { pid: 312, name: "audio-synth-service", user: "bron", cpu: 2.1, memoryMb: 32.0, threads: 2, status: "running", description: "WebAudio Analyser & Music Streamer" },
  { pid: 418, name: "guestbook-worker", user: "system", cpu: 0.4, memoryMb: 12.8, threads: 1, status: "idle", description: "Guestbook Signature Processor" },
  { pid: 502, name: "analytics-telemetry", user: "system", cpu: 0.6, memoryMb: 14.3, threads: 1, status: "running", description: "OS Metrics & Diagnostics Collector" },
];

app.get("/api/system/processes", (req, res) => {
  const updated = osProcesses.map((p) => {
    if (p.status === "stopped") {
      return { ...p, cpu: 0 };
    }
    return {
      ...p,
      cpu: Math.max(0.1, Math.round((p.cpu + (Math.random() * 0.8 - 0.4)) * 10) / 10),
      memoryMb: Math.max(5, Math.round((p.memoryMb + (Math.random() * 0.6 - 0.3)) * 10) / 10),
    };
  });
  res.json(updated);
});

// Restart a simulated process
app.post("/api/system/process/:pid/restart", (req, res) => {
  const pid = Number(req.params.pid);
  const p = osProcesses.find((item) => item.pid === pid);
  if (!p) return res.status(404).json({ error: "Process not found" });

  p.status = "restarting";
  logSystem("warn", "ProcessMgr", `Process ${p.name} (PID: ${pid}) restarted by user.`);
  io.emit("system:process_updated", p);

  setTimeout(() => {
    p.status = "running";
    io.emit("system:process_updated", p);
    logSystem("info", "ProcessMgr", `Process ${p.name} (PID: ${pid}) recovered successfully.`);
  }, 1000);

  res.json({ ok: true, process: p });
});

// Terminate / Kill a process
app.post("/api/system/process/:pid/kill", (req, res) => {
  const pid = Number(req.params.pid);
  const p = osProcesses.find((item) => item.pid === pid);
  if (!p) return res.status(404).json({ ok: false, error: "Process not found" });

  p.status = "stopped";
  p.cpu = 0;
  logSystem("warn", "ProcessMgr", `Process ${p.name} (PID: ${pid}) was terminated by user.`);
  io.emit("system:process_updated", p);
  addActivity("system", `Terminated process "${p.name}" (PID: ${pid})`);

  res.json({ ok: true, process: p });
});

// Virtual System Disk Storage Breakdown
app.get("/api/system/storage", (req, res) => {
  res.json({
    totalGb: 256,
    usedGb: 68.4,
    freeGb: 187.6,
    percentUsed: 26.7,
    partitions: [
      { name: "Portfolio OS System", sizeGb: 22.1, color: "#38bdf8", desc: "Kernel, Compositor & Static Assets" },
      { name: "Applications & Binaries", sizeGb: 18.5, color: "#a855f7", desc: "Library, Games, Sandbox & Tools" },
      { name: "Notes & User Scratchpad", sizeGb: 12.8, color: "#f59e0b", desc: "Markdown Notes & Cloud Synced Docs" },
      { name: "Media, Audio & Cache", sizeGb: 15.0, color: "#22c55e", desc: "Cached Previews, Wallpapers & Sound FX" },
    ]
  });
});

// ---------- Notes Cloud Sync & Backup ----------
let cloudNotes = [
  {
    id: "welcome-note",
    title: "Welcome to Portfolio OS Notes",
    updatedAt: "Cloud Synced",
    pinned: true,
    tag: "guide",
    color: "amber",
    content: `# Welcome to Portfolio OS Notes\n\nThis is your persistent notepad, rich markdown editor, and task scratchpad with real-time cloud sync.\n\n### Key Capabilities\n- [x] **Full Formatting Tools**: Bold, italic, underline, strikethrough, headings & code\n- [x] **Cloud Sync & Backup**: Seamlessly sync across tabs and devices\n- [x] **Document Analytics**: Word count, character count, and reading time\n- [x] **Smart Tagging**: Organize thoughts with #tags\n- [x] **Auto-saved**: Everything you write persists locally and in the cloud`
  },
  {
    id: "tech-stack",
    title: "Portfolio OS Technical Stack",
    updatedAt: "Cloud Synced",
    pinned: false,
    tag: "architecture",
    color: "sky",
    content: `## Portfolio OS Technical Stack\n\n- **Frontend Core**: React 19 + Vite 8.1 + TypeScript\n- **Styling**: Tailwind CSS v4 + Frosted Glassmorphism\n- **Icons**: Gravity UI Icons (@gravity-ui/icons)\n- **Real-Time Backend**: Express 5 & Socket.IO realtime parity\n- **Storage**: Real-time cloud sync engine + localStorage persistence`
  }
];

app.get("/api/notes", (req, res) => {
  res.json(cloudNotes);
});

app.post("/api/notes/sync", (req, res) => {
  const { notes } = req.body || {};
  if (!Array.isArray(notes)) {
    return res.status(400).json({ error: "Invalid notes payload" });
  }

  const map = new Map();
  cloudNotes.forEach((n) => map.set(n.id, n));
  notes.forEach((clientNote) => {
    if (clientNote && clientNote.id) {
      map.set(clientNote.id, {
        ...(map.get(clientNote.id) || {}),
        ...clientNote,
        serverSyncedAt: Date.now()
      });
    }
  });

  cloudNotes = Array.from(map.values());
  io.emit("notes:synced", cloudNotes);
  addActivity("notes", `Notes synchronized with cloud (${cloudNotes.length} notes)`);
  res.json({ ok: true, notes: cloudNotes });
});

app.post("/api/notes", (req, res) => {
  const note = req.body;
  if (!note || !note.id) return res.status(400).json({ error: "Invalid note" });

  const idx = cloudNotes.findIndex((n) => n.id === note.id);
  const updatedNote = { ...note, serverSyncedAt: Date.now() };

  if (idx !== -1) {
    cloudNotes[idx] = updatedNote;
  } else {
    cloudNotes.unshift(updatedNote);
  }

  io.emit("notes:updated", updatedNote);
  res.json(updatedNote);
});

app.delete("/api/notes/:id", (req, res) => {
  const { id } = req.params;
  cloudNotes = cloudNotes.filter((n) => n.id !== id);
  io.emit("notes:deleted", { id });
  res.json({ ok: true, id });
});

// ---------- Calculator Constants & Conversions ----------
const MATH_CONSTANTS = [
  { symbol: "π", name: "Pi", value: 3.141592653589793, category: "Math", desc: "Ratio of circle circumference to diameter" },
  { symbol: "e", name: "Euler's Number", value: 2.718281828459045, category: "Math", desc: "Base of natural logarithm" },
  { symbol: "φ", name: "Golden Ratio", value: 1.618033988749895, category: "Math", desc: "Divine proportion in geometry & art" },
  { symbol: "c", name: "Speed of Light", value: 299792458, unit: "m/s", category: "Physics", desc: "Universal speed of light in vacuum" },
  { symbol: "h", name: "Planck Constant", value: "6.62607015e-34", unit: "J·s", category: "Physics", desc: "Scale of quantum mechanical actions" },
  { symbol: "G", name: "Gravitational Constant", value: "6.67430e-11", unit: "N·m²/kg²", category: "Physics", desc: "Newtonian gravitational constant" },
  { symbol: "kB", name: "Boltzmann Constant", value: "1.380649e-23", unit: "J/K", category: "Physics", desc: "Relates thermal energy to temperature" },
  { symbol: "NA", name: "Avogadro Number", value: "6.02214076e23", unit: "mol⁻¹", category: "Chemistry", desc: "Number of particles per mole" }
];

app.get("/api/calc/constants", (req, res) => {
  res.json(MATH_CONSTANTS);
});

app.get("/api/calc/convert", (req, res) => {
  const { type, from, to, value } = req.query;
  const num = parseFloat(value);
  if (isNaN(num)) return res.status(400).json({ error: "Invalid numeric value" });

  let result = null;
  const lengthToMeters = { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254 };
  const weightToKg = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 };
  const dataToBytes = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024, tb: 1024 * 1024 * 1024 * 1024 };

  const f = String(from || "").toLowerCase();
  const t = String(to || "").toLowerCase();

  if (type === "length" && lengthToMeters[f] && lengthToMeters[t]) {
    const meters = num * lengthToMeters[f];
    result = meters / lengthToMeters[t];
  } else if (type === "weight" && weightToKg[f] && weightToKg[t]) {
    const kg = num * weightToKg[f];
    result = kg / weightToKg[t];
  } else if (type === "data" && dataToBytes[f] && dataToBytes[t]) {
    const bytes = num * dataToBytes[f];
    result = bytes / dataToBytes[t];
  } else if (type === "temp") {
    if (f === "c" && t === "f") result = (num * 9) / 5 + 32;
    else if (f === "f" && t === "c") result = ((num - 32) * 5) / 9;
    else if (f === "c" && t === "k") result = num + 273.15;
    else if (f === "k" && t === "c") result = num - 273.15;
    else if (f === t) result = num;
  }

  if (result === null) return res.status(400).json({ error: "Unsupported conversion" });
  res.json({ ok: true, type, from: f, to: t, value: num, result: Math.round(result * 1000000) / 1000000 });
});

// ---------- Code Playground Snippets (Built-in + Custom CRUD) ----------
let customSnippets = [];

app.get("/api/snippets", (req, res) => {
  const { lang, q } = req.query;
  let all = [...snippets, ...customSnippets];
  if (lang && lang !== "all") {
    all = all.filter((s) => s.language.toLowerCase() === String(lang).toLowerCase());
  }
  if (q) {
    const query = String(q).toLowerCase();
    all = all.filter((s) => s.title.toLowerCase().includes(query) || (s.description && s.description.toLowerCase().includes(query)));
  }
  res.json(all);
});

app.post("/api/snippets", strictSubmissionLimiter, (req, res) => {
  const { title, language, code, description, category } = req.body || {};
  const errors = [];
  const cleanTitle = sanitizePlain(title, 80);
  const cleanLang = String(language || "javascript").trim().toLowerCase();
  const cleanCode = String(code || "").trim();
  const cleanDesc = sanitizePlain(description || "", 300);
  const cleanCategory = sanitizePlain(category || "Custom Snippet", 50);

  if (!cleanTitle || cleanTitle.length < 2) errors.push("Title must be at least 2 characters.");
  if (!cleanCode) errors.push("Code content cannot be empty.");
  const allowedLangs = ["javascript", "typescript", "python", "sql", "markdown", "web", "html", "css"];
  if (!allowedLangs.includes(cleanLang)) errors.push(`Language must be one of: ${allowedLangs.join(", ")}`);

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, error: "Validation Error", details: errors });
  }

  const newSnippet = {
    id: `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: cleanTitle,
    language: cleanLang,
    code: cleanCode,
    description: cleanDesc,
    category: cleanCategory,
    isCustom: true,
    createdAt: Date.now()
  };

  customSnippets.unshift(newSnippet);
  io.emit("snippet:created", newSnippet);
  addActivity("codeplay", `New code snippet created: "${cleanTitle}" (${cleanLang})`);
  res.status(201).json({ ok: true, snippet: newSnippet });
});

app.delete("/api/snippets/:id", (req, res) => {
  const { id } = req.params;
  const initialCount = customSnippets.length;
  customSnippets = customSnippets.filter((s) => s.id !== id);
  if (customSnippets.length === initialCount) {
    return res.status(404).json({ ok: false, error: "Custom snippet not found or cannot delete default templates." });
  }
  io.emit("snippet:deleted", { id });
  res.json({ ok: true, id });
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

// ---------- Arcade Games Leaderboard API ----------
let arcadeLeaderboard = [...initialLeaderboard];

app.get("/api/games/leaderboard", (req, res) => {
  const { game, limit = 20 } = req.query;
  let list = [...arcadeLeaderboard];
  if (game && game !== "all") {
    list = list.filter((e) => e.game.toLowerCase() === String(game).toLowerCase());
  }
  // Sort: For minesweeper, lower score (seconds) is better; for others, higher score is better
  list.sort((a, b) => {
    if (a.game === "minesweeper" && b.game === "minesweeper") {
      return a.score - b.score;
    }
    return b.score - a.score;
  });
  const max = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  res.json({
    ok: true,
    total: list.length,
    game: game || "all",
    leaderboard: list.slice(0, max)
  });
});

app.post("/api/games/leaderboard", strictSubmissionLimiter, (req, res) => {
  const { game, player, score, details } = req.body || {};
  const cleanPlayer = sanitizePlain(player, 25) || "Anonymous Pilot";
  const cleanGame = String(game || "").trim().toLowerCase();
  const numScore = Number(score);
  const cleanDetails = sanitizePlain(details || "", 60);

  const validGames = {
    blockblast: "Block Blast",
    "2048": "2048 Puzzle",
    snake: "Snake Retro",
    minesweeper: "Minesweeper Retro"
  };

  if (!validGames[cleanGame]) {
    return res.status(400).json({ ok: false, error: "Invalid game. Supported: blockblast, 2048, snake, minesweeper" });
  }

  if (isNaN(numScore) || numScore < 0 || numScore > 1000000) {
    return res.status(400).json({ ok: false, error: "Invalid score value." });
  }

  let badge = "🎮 Player";
  if (cleanGame === "minesweeper") {
    if (numScore < 30) badge = "⚡ Lightning Fast";
    else if (numScore < 60) badge = "🏆 Master Defuser";
    else badge = "🥈 Veteran";
  } else if (cleanGame === "blockblast") {
    if (numScore >= 5000) badge = "🏆 Legend";
    else if (numScore >= 3000) badge = "🥈 Master";
    else badge = "🥉 Pro";
  } else if (cleanGame === "2048") {
    if (numScore >= 15000) badge = "🏆 2048 Champion";
    else if (numScore >= 8000) badge = "🥈 Strategist";
    else badge = "🥉 Competitor";
  } else if (cleanGame === "snake") {
    if (numScore >= 300) badge = "🏆 Anaconda";
    else if (numScore >= 150) badge = "🥈 Viper";
    else badge = "🥉 Cobra";
  }

  const newEntry = {
    id: `lb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    game: cleanGame,
    gameName: validGames[cleanGame],
    player: cleanPlayer,
    score: numScore,
    details: cleanDetails,
    ts: Date.now(),
    badge
  };

  arcadeLeaderboard.unshift(newEntry);
  if (arcadeLeaderboard.length > 200) arcadeLeaderboard = arcadeLeaderboard.slice(0, 200);

  io.emit("game:score_submitted", newEntry);
  addActivity("game", `${cleanPlayer} scored ${numScore} in ${validGames[cleanGame]}!`);
  res.status(201).json({ ok: true, entry: newEntry });
});

// ---------- Virtual Cloud Files API ----------
let cloudFiles = [...initialCloudFiles];

app.get("/api/files", (req, res) => {
  const { path: filterPath, search } = req.query;
  let list = [...cloudFiles];
  if (filterPath && filterPath !== "all") {
    list = list.filter((f) => f.path === filterPath);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((f) => f.name.toLowerCase().includes(q) || (f.content && f.content.toLowerCase().includes(q)));
  }
  res.json({
    ok: true,
    count: list.length,
    files: list
  });
});

app.get("/api/files/stats", (req, res) => {
  const totalFiles = cloudFiles.length;
  const totalBytes = cloudFiles.reduce((acc, f) => acc + (f.size || (f.content ? f.content.length : 0)), 0);
  const byType = {};
  cloudFiles.forEach((f) => {
    byType[f.type || "unknown"] = (byType[f.type || "unknown"] || 0) + 1;
  });
  res.json({
    ok: true,
    totalFiles,
    totalBytes,
    totalKb: Math.round((totalBytes / 1024) * 10) / 10,
    byType,
    allocatedDriveMb: 50,
    usedPercentage: Math.round((totalBytes / (50 * 1024 * 1024)) * 10000) / 100
  });
});

app.get("/api/files/:id", (req, res) => {
  const file = cloudFiles.find((f) => f.id === req.params.id);
  if (!file) return res.status(404).json({ ok: false, error: "File not found" });
  res.json({ ok: true, file });
});

app.post("/api/files", (req, res) => {
  const { id, name, path: filePath, content, type } = req.body || {};
  const cleanName = sanitizePlain(name, 60);
  if (!cleanName) return res.status(400).json({ ok: false, error: "Filename is required" });

  const rawContent = typeof content === "string" ? content : "";
  const cleanPath = String(filePath || "/").trim();
  const fileType = String(type || "text").trim().toLowerCase();

  const fileId = id || `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const existingIdx = cloudFiles.findIndex((f) => f.id === fileId);

  const fileObj = {
    id: fileId,
    name: cleanName,
    path: cleanPath,
    type: fileType,
    size: Buffer.byteLength(rawContent, "utf8"),
    mimeType: fileType === "markdown" ? "text/markdown" : fileType === "json" ? "application/json" : "text/plain",
    content: rawContent,
    updatedAt: Date.now(),
    readOnly: false
  };

  if (existingIdx !== -1) {
    if (cloudFiles[existingIdx].readOnly) {
      return res.status(403).json({ ok: false, error: "System file is read-only and cannot be modified." });
    }
    cloudFiles[existingIdx] = fileObj;
  } else {
    cloudFiles.unshift(fileObj);
  }

  io.emit("files:updated", fileObj);
  addActivity("files", `File "${cleanName}" saved to cloud drive`);
  res.status(201).json({ ok: true, file: fileObj });
});

app.delete("/api/files/:id", (req, res) => {
  const { id } = req.params;
  const existing = cloudFiles.find((f) => f.id === id);
  if (!existing) return res.status(404).json({ ok: false, error: "File not found" });
  if (existing.readOnly) return res.status(403).json({ ok: false, error: "System file is read-only and cannot be deleted." });

  cloudFiles = cloudFiles.filter((f) => f.id !== id);
  io.emit("files:deleted", { id });
  addActivity("files", `File "${existing.name}" removed from cloud drive`);
  res.json({ ok: true, id, message: `File ${existing.name} deleted successfully.` });
});

// ---------- Global Universal Search API ----------
app.get("/api/search", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (!q) {
    return res.json({
      ok: true,
      query: "",
      total: 0,
      results: { projects: [], updates: [], guestbook: [], notes: [], snippets: [] }
    });
  }

  const matchedProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (Array.isArray(p.stack) && p.stack.some((s) => s.toLowerCase().includes(q)))
  ).slice(0, 6);

  const matchedUpdates = liveUpdates.filter(
    (u) =>
      u.title.toLowerCase().includes(q) ||
      u.body.toLowerCase().includes(q) ||
      u.tag.toLowerCase().includes(q)
  ).slice(0, 6);

  const matchedGuestbook = guestbookEntries.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      g.message.toLowerCase().includes(q) ||
      (g.role && g.role.toLowerCase().includes(q))
  ).slice(0, 6);

  const matchedNotes = cloudNotes.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.tag && n.tag.toLowerCase().includes(q))
  ).slice(0, 6);

  const allSnippets = [...snippets, ...customSnippets];
  const matchedSnippets = allSnippets.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      s.language.toLowerCase().includes(q)
  ).slice(0, 6);

  const matchedFiles = cloudFiles.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      (f.content && f.content.toLowerCase().includes(q))
  ).slice(0, 6);

  const matchedLeaderboard = arcadeLeaderboard.filter(
    (l) =>
      l.gameName.toLowerCase().includes(q) ||
      l.player.toLowerCase().includes(q) ||
      (l.badge && l.badge.toLowerCase().includes(q))
  ).slice(0, 6);

  const total =
    matchedProjects.length +
    matchedUpdates.length +
    matchedGuestbook.length +
    matchedNotes.length +
    matchedSnippets.length +
    matchedFiles.length +
    matchedLeaderboard.length;

  res.json({
    ok: true,
    query: q,
    total,
    results: {
      projects: matchedProjects,
      updates: matchedUpdates,
      guestbook: matchedGuestbook,
      notes: matchedNotes,
      snippets: matchedSnippets,
      files: matchedFiles,
      leaderboard: matchedLeaderboard
    }
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
    heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
    timestamp: Date.now()
  });
});

// ---------- Guestbook Feature with Validation & Search ----------
let guestbookEntries = [...initialGuestbook];

app.get("/api/guestbook", (req, res) => {
  const { search, role, sort } = req.query;
  let list = [...guestbookEntries];

  if (search) {
    const q = String(search).toLowerCase().trim();
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        (e.location && e.location.toLowerCase().includes(q))
    );
  }

  if (role && role !== "all") {
    list = list.filter((e) => (e.role || "Visitor").toLowerCase() === String(role).toLowerCase());
  }

  if (sort === "popular") {
    list.sort((a, b) => (b.reactions || 0) - (a.reactions || 0));
  } else if (sort === "oldest") {
    list.sort((a, b) => a.ts - b.ts);
  } else {
    // Default newest first
    list.sort((a, b) => b.ts - a.ts);
  }

  res.json(list);
});

app.get("/api/guestbook/stats", (req, res) => {
  const totalSignatures = guestbookEntries.length;
  const totalReactions = guestbookEntries.reduce((sum, e) => sum + (e.reactions || 0), 0);
  const rolesCount = {};
  for (const e of guestbookEntries) {
    const r = e.role || "Visitor";
    rolesCount[r] = (rolesCount[r] || 0) + 1;
  }
  res.json({
    ok: true,
    totalSignatures,
    totalReactions,
    rolesCount,
    latestSignedAt: guestbookEntries[0]?.ts || null
  });
});

app.post("/api/guestbook", strictSubmissionLimiter, (req, res) => {
  const { name, role, avatar, message, link, location } = req.body || {};
  const errors = [];

  const cleanName = sanitizeText(name, 40);
  const cleanRole = sanitizePlain(role || "Visitor", 30);
  const cleanAvatar = String(avatar || "lorelei:guest").trim().slice(0, 500000);
  const cleanMsg = sanitizeText(message, 500);
  const cleanLink = sanitizePlain(link || "", 200);
  const cleanLocation = sanitizeText(location || "", 80);

  if (!cleanName || cleanName.length < 2) {
    errors.push("Name must be between 2 and 40 characters.");
  }
  if (!cleanMsg || cleanMsg.length < 3) {
    errors.push("Message must be between 3 and 500 characters.");
  }
  if (cleanLink && !/^https?:\/\//i.test(cleanLink) && !cleanLink.startsWith("@") && !cleanLink.includes(".")) {
    errors.push("Link must be a valid URL (starting with http:// or https://) or social handle.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, error: "Validation Error", details: errors });
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
      const host = args[0] || `localhost:${PORT}`;
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

    case "top":
    case "htop": {
      const header = "PID    USER     STATUS      CPU%   MEM(MB)  THREADS  NAME";
      const rows = osProcesses.map((p) =>
        `${String(p.pid).padEnd(6)} ${p.user.padEnd(8)} ${p.status.padEnd(11)} ${String(p.cpu + "%").padEnd(6)} ${String(p.memoryMb).padEnd(8)} ${String(p.threads).padEnd(8)} ${p.name}`
      );
      return res.json({
        ok: true,
        output: `⚡ Real-Time Process Monitor (System Load: ${os.loadavg()[0].toFixed(2)}):\n${header}\n${"-".repeat(64)}\n${rows.join("\n")}`
      });
    }

    case "kill": {
      const pidToKill = parseInt(args[0], 10);
      if (isNaN(pidToKill)) {
        return res.status(400).json({ ok: false, error: "Usage: kill <pid> (e.g. kill 312)" });
      }
      const targetProc = osProcesses.find((p) => p.pid === pidToKill);
      if (!targetProc) {
        return res.status(404).json({ ok: false, error: `Process PID ${pidToKill} not found.` });
      }
      targetProc.status = "stopped";
      targetProc.cpu = 0;
      io.emit("system:process_updated", targetProc);
      logSystem("warn", "Terminal", `Killed process ${targetProc.name} (PID: ${pidToKill}) via terminal.`);
      return res.json({
        ok: true,
        output: `[SIGTERM] Process ${targetProc.name} (PID ${pidToKill}) terminated successfully.`
      });
    }

    case "find":
    case "search": {
      const term = args.join(" ").toLowerCase().trim();
      if (!term) {
        return res.json({ ok: false, error: "Usage: find <keyword> (e.g. find react, find salon, find audio)" });
      }
      const pMatches = projects.filter((p) => p.title.toLowerCase().includes(term) || p.summary.toLowerCase().includes(term));
      const uMatches = liveUpdates.filter((u) => u.title.toLowerCase().includes(term) || u.body.toLowerCase().includes(term));
      const nMatches = cloudNotes.filter((n) => n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term));

      const lines = [
        `🔍 Search results for '${term}':`,
        `----------------------------------------`,
        `Projects (${pMatches.length}): ${pMatches.map((p) => p.title).join(", ") || "None"}`,
        `Updates  (${uMatches.length}): ${uMatches.map((u) => u.title).join(", ") || "None"}`,
        `Notes    (${nMatches.length}): ${nMatches.map((n) => n.title).join(", ") || "None"}`
      ];
      return res.json({ ok: true, output: lines.join("\n") });
    }

    case "netstat": {
      const ifaces = os.networkInterfaces();
      const summary = [];
      for (const [name, addrs] of Object.entries(ifaces)) {
        for (const a of addrs || []) {
          if (!a.internal && a.family === "IPv4") {
            summary.push(`• Interface [${name}]: IP ${a.address} (MAC: ${a.mac})`);
          }
        }
      }
      return res.json({
        ok: true,
        output: [
          `🌐 Network Interfaces & Active Sockets:`,
          `----------------------------------------`,
          ...summary,
          `• Connected WebSocket Clients: ${io.engine.clientsCount}`,
          `• HTTP Server Port:            ${PORT}`,
          `• Cumulative Traffic:          Rx: ${(cumulativeRxBytes / 1024 / 1024).toFixed(2)} MB | Tx: ${(cumulativeTxBytes / 1024 / 1024).toFixed(2)} MB`
        ].join("\n")
      });
    }

    case "clearlogs": {
      systemLogs = [];
      const resetLog = {
        id: `log-${Date.now()}-reset`,
        ts: Date.now(),
        level: "info",
        module: "Terminal",
        message: "System event logs buffer cleared via terminal command."
      };
      systemLogs.push(resetLog);
      io.emit("system:logs_cleared");
      io.emit("system:log", resetLog);
      return res.json({ ok: true, output: "System logs buffer cleared." });
    }

    case "echo": {
      const echoMsg = sanitizeText(args.join(" "), 300);
      return res.json({ ok: true, output: echoMsg || "" });
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

    case "logs": {
      const recent = systemLogs.slice(0, 8);
      const lines = recent.map(
        (l) => `[${new Date(l.ts).toLocaleTimeString()}] [${l.level.toUpperCase()}] [${l.module}] ${l.message}`
      );
      return res.json({
        ok: true,
        output: `📜 Recent System Logs:\n----------------------------------------\n${lines.join("\n")}`
      });
    }

    case "processes":
    case "ps": {
      const header = "PID    USER     STATUS      CPU%   MEM(MB)  NAME";
      const rows = osProcesses.map((p) =>
        `${String(p.pid).padEnd(6)} ${p.user.padEnd(8)} ${p.status.padEnd(11)} ${String(p.cpu + "%").padEnd(6)} ${String(p.memoryMb).padEnd(8)} ${p.name}`
      );
      return res.json({
        ok: true,
        output: `${header}\n${"-".repeat(54)}\n${rows.join("\n")}`
      });
    }

    case "notes": {
      const list = cloudNotes.map((n) => `• [${n.tag || "general"}] ${n.title} (${n.pinned ? "Pinned" : "Normal"})`);
      return res.json({
        ok: true,
        output: `📝 Cloud Notes Repository (${cloudNotes.length} notes):\n${list.join("\n")}`
      });
    }

    case "storage":
    case "df": {
      return res.json({
        ok: true,
        output: [
          `💾 Disk Storage Usage (Virtual SSD 256GB):`,
          `-------------------------------------------`,
          `Used: 68.4 GB (26.7%) | Free: 187.6 GB`,
          `• OS Subsystem:        22.1 GB`,
          `• Applications:        18.5 GB`,
          `• Notes & User Data:   12.8 GB`,
          `• Audio & Media Cache: 15.0 GB`
        ].join("\n")
      });
    }

    case "minesweeper": {
      return res.json({
        ok: true,
        output: [
          "💣 Minesweeper Retro Launched!",
          "----------------------------------------",
          "Goal: Reveal all safe tiles without detonating a mine.",
          "Controls: Left-click/Tap to reveal, Right-click/Flag button to flag, Smiley to reset.",
          "Modes: Beginner (9x9, 10 mines), Intermediate (16x16, 40 mines), Expert (16x30, 99 mines).",
          "Leaderboard: Your fastest defusal time can be recorded on the global leaderboard!"
        ].join("\n")
      });
    }

    case "benchmark": {
      const start = performance.now();
      let primesCount = 0;
      for (let i = 2; i <= 20000; i++) {
        let isP = true;
        for (let j = 2; j * j <= i; j++) {
          if (i % j === 0) { isP = false; break; }
        }
        if (isP) primesCount++;
      }
      const duration = Math.round((performance.now() - start) * 100) / 100;
      const ops = Math.round(20000 / (duration / 1000));
      return res.json({
        ok: true,
        output: [
          "⚡ Portfolio OS Kernel Performance Benchmark:",
          "--------------------------------------------------",
          `• Primes Computed:     ${primesCount} (Range: 2 - 20,000)`,
          `• Execution Time:      ${duration} ms`,
          `• Computation Rate:    ${ops.toLocaleString()} Ops/sec`,
          `• Memory Allocated:    ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          `• Host Architecture:   ${os.arch()} / ${os.platform()} (${os.cpus().length} Cores)`,
          `• Benchmark Score:     ${duration < 50 ? "A+ (Ultra Fast)" : "A (Fast)"}`
        ].join("\n")
      });
    }

    case "leaderboard":
    case "scores": {
      const grouped = {};
      arcadeLeaderboard.forEach((entry) => {
        if (!grouped[entry.gameName]) grouped[entry.gameName] = [];
        grouped[entry.gameName].push(entry);
      });
      const lines = ["🏆 Portfolio OS Global Arcade Leaderboard:", "=================================================="];
      for (const [game, entries] of Object.entries(grouped)) {
        lines.push(`\n🎮 ${game}:`);
        lines.push("RANK  PLAYER              SCORE    BADGE / DETAILS");
        lines.push("-".repeat(50));
        entries.slice(0, 3).forEach((e, idx) => {
          const rank = String(`#${idx + 1}`).padEnd(5);
          const player = String(e.player).padEnd(19);
          const score = String(e.score).padEnd(8);
          lines.push(`${rank} ${player} ${score} ${e.badge || e.details}`);
        });
      }
      return res.json({ ok: true, output: lines.join("\n") });
    }

    case "files":
    case "ls": {
      const lines = [
        `📁 Virtual Cloud Drive Files (${cloudFiles.length} items):`,
        "--------------------------------------------------",
        "PERMS   SIZE      UPDATED      NAME",
        "-".repeat(50)
      ];
      cloudFiles.forEach((f) => {
        const perm = f.readOnly ? "r-- " : "rw- ";
        const sz = String(`${f.size || 0}B`).padEnd(9);
        const date = new Date(f.updatedAt).toLocaleDateString().padEnd(12);
        lines.push(`${perm}    ${sz} ${date} ${f.name} (${f.path})`);
      });
      return res.json({ ok: true, output: lines.join("\n") });
    }

    case "motd": {
      return res.json({
        ok: true,
        output: [
          "╔══════════════════════════════════════════════════════════════╗",
          "║        Welcome to Portfolio OS — Developer Edition           ║",
          "╚══════════════════════════════════════════════════════════════╝",
          `• System Status:       Online & Healthy (${io.engine.clientsCount} connected clients)`,
          `• Active Applications: 15 Built-in Desktop Modules`,
          `• Latest Update:       Arcade Leaderboard & Cloud Virtual Drive`,
          `• Developer Tip:       Press ⌘K or Ctrl+K anywhere to open Spotlight Search!`
        ].join("\n")
      });
    }

    case "calc": {
      const expr = args.join(" ").trim();
      if (!expr) return res.json({ ok: false, error: "Usage: calc <expression> (e.g. calc (14 * 5) + 2^3)" });
      try {
        const sanitized = expr.replace(/\^/g, "**");
        if (!/^[0-9+\-*/()., %^eE\sMath.sqrtcospitannabsceilfloorroundlog]+$/.test(sanitized)) {
          return res.status(400).json({ ok: false, error: "Invalid math expression." });
        }
        const evaluated = Function(`"use strict"; return (${sanitized});`)();
        return res.json({ ok: true, output: `${expr} = ${evaluated}` });
      } catch {
        return res.status(400).json({ ok: false, error: "Math evaluation syntax error." });
      }
    }

    case "uptime": {
      const uptime = Math.floor(process.uptime());
      const hours = Math.floor(uptime / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      const secs = uptime % 60;
      return res.json({
        ok: true,
        output: `up ${hours}h ${mins}m ${secs}s, load average: ${os.loadavg().map((l) => l.toFixed(2)).join(", ")}`
      });
    }

    default:
      return res.status(400).json({
        ok: false,
        error: `Unknown server command: '${lower}'. Try 'sysinfo', 'ping', 'weather', 'analytics', 'benchmark', 'leaderboard', 'files', 'minesweeper', 'motd', 'calc', 'uptime', 'top', 'kill <pid>', 'search <query>', 'netstat', 'clearlogs', 'logs', 'ps', 'storage', 'notes', 'quote', 'joke', or 'curl'.`
      });
  }
});

// ---------- Interactive API Catalog & OpenAPI Specification ----------
app.get(["/api", "/api/spec"], (req, res) => {
  res.json({
    ok: true,
    service: "Portfolio OS Hypermedia API Gateway",
    version: "3.2.0-lts",
    environment: process.env.NODE_ENV || "development",
    timestamp: Date.now(),
    documentation: "https://github.com/portfolio-os",
    endpoints: [
      { path: "/api/health", method: "GET", description: "Health check, uptime and real-time socket client tally" },
      { path: "/api/system/info", method: "GET", description: "Hardware telemetry, host architecture, memory & CPU statistics" },
      { path: "/api/system/metrics", method: "GET", description: "Historical telemetry series for live performance graphing" },
      { path: "/api/system/network", method: "GET", description: "Network interfaces, simulated throughput, active connections" },
      { path: "/api/system/benchmark", method: "POST", description: "Run server-side compute, prime calculation & JSON serialization benchmark" },
      { path: "/api/system/processes", method: "GET", description: "Active virtual processes with live CPU/RAM telemetry" },
      { path: "/api/system/process/:pid/restart", method: "POST", description: "Restart a running virtual system process" },
      { path: "/api/system/process/:pid/kill", method: "POST", description: "Terminate a virtual system process" },
      { path: "/api/system/logs", method: "GET", description: "Kernel and service logs with module/level filtering" },
      { path: "/api/system/storage", method: "GET", description: "Virtual partition storage allocations and usage" },
      { path: "/api/games/leaderboard", method: "GET, POST", description: "Global arcade high scores for Block Blast, 2048, Snake, Minesweeper" },
      { path: "/api/files", method: "GET, POST, DELETE", description: "Cloud virtual file system CRUD and storage management" },
      { path: "/api/files/stats", method: "GET", description: "Cloud storage telemetry and file distribution metrics" },
      { path: "/api/projects", method: "GET", description: "Showcase portfolio projects with tech stacks and live URLs" },
      { path: "/api/projects/likes", method: "GET", description: "Project star counts across all portfolio projects" },
      { path: "/api/projects/:id/like", method: "POST", description: "Star a project with real-time broadcast" },
      { path: "/api/projects/:id/feedback", method: "GET, POST", description: "User reviews and ratings for portfolio projects" },
      { path: "/api/updates", method: "GET, POST", description: "Changelog and feature updates feed with reactions" },
      { path: "/api/notes", method: "GET, POST", description: "Markdown notes repository with real-time cloud sync" },
      { path: "/api/notes/sync", method: "POST", description: "Two-way client-server markdown notes synchronizer" },
      { path: "/api/guestbook", method: "GET, POST, DELETE", description: "Visitor ledger signatures, avatars, reactions" },
      { path: "/api/snippets", method: "GET, POST, DELETE", description: "Code playground snippets and templates" },
      { path: "/api/snippets/run", method: "POST", description: "AST parsing, complexity verification and execution validator" },
      { path: "/api/music/search", method: "GET", description: "Search songs via iTunes Music Store API with 30s audio previews" },
      { path: "/api/music/youtube-search", method: "GET", description: "Full music video search powered by YouTube API proxy" },
      { path: "/api/chat/users", method: "GET", description: "Current online visitors in the chatroom" },
      { path: "/api/chat/export", method: "GET", description: "Export complete chatroom transcript JSON" },
      { path: "/api/calc/constants", method: "GET", description: "Mathematical, physical, and chemical constants" },
      { path: "/api/calc/convert", method: "GET", description: "Unit conversions (length, weight, temperature, digital storage)" },
      { path: "/api/weather", method: "GET", description: "Real-time weather proxy with hourly and daily forecast" },
      { path: "/api/terminal/exec", method: "POST", description: "UNIX shell command execution hub" },
      { path: "/api/contact", method: "POST", description: "Contact inquiry submission gateway with email validation" }
    ]
  });
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

// ---------- Chat (anonymous, no login with real-time sync & anti-spam) ----------
const ADJECTIVES = ["Swift", "Quiet", "Amber", "Cosmic", "Lucky", "Nimble", "Gentle", "Bright", "Wandering", "Velvet"];
const ANIMALS = ["Falcon", "Otter", "Lynx", "Comet", "Heron", "Fox", "Whale", "Sparrow", "Marlin", "Wren"];
const nano = customAlphabet("0123456789", 3);
const randomName = () =>
  `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]}${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}${nano()}`;

const MAX_HISTORY = 100;
let chatHistory = [];
let pinnedChatMessages = [];
const connectedUsers = new Map();
const socketFloodTracker = new Map();
const knownSessions = new Map();
const SESSION_TTL = 60 * 60 * 1000;

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of knownSessions.entries()) {
    if (now - session.lastActive > SESSION_TTL) {
      knownSessions.delete(id);
    }
  }
}

function getRealOnlineCount() {
  const uniqueClients = new Set();
  for (const u of connectedUsers.values()) {
    if (u.clientId) uniqueClients.add(u.clientId);
  }
  const socketCount = io?.engine?.clientsCount || io?.sockets?.sockets?.size || connectedUsers.size;
  return Math.max(uniqueClients.size, socketCount, 1);
}

function getUserList() {
  const seen = new Set();
  const list = [];
  for (const u of connectedUsers.values()) {
    const key = u.clientId || u.name;
    if (!seen.has(key)) {
      seen.add(key);
      list.push({ name: u.name, clientId: u.clientId, lastActive: u.lastActive || Date.now() });
    }
  }
  return list;
}

function broadcastPresence() {
  const online = getRealOnlineCount();
  const users = getUserList();
  io.emit("chat:presence", { online, users });
  io.emit("chat:users_updated", users);
}

const EMOJI_MAP = {
  heart: "heart",
  "❤️": "heart",
  thumbsup: "thumbsup",
  "👍": "thumbsup",
  smile: "smile",
  "😂": "smile",
  "😆": "smile",
  flame: "flame",
  "🔥": "flame",
  rocket: "rocket",
  "🚀": "rocket",
  zap: "zap",
  "⚡": "zap",
  party: "zap",
  "🎉": "zap"
};

app.get("/api/chat/users", (req, res) => {
  res.json(getUserList());
});

app.get("/api/chat/pinned", (req, res) => {
  res.json(pinnedChatMessages);
});

app.post("/api/chat/:id/pin", (req, res) => {
  const { id } = req.params;
  const msg = chatHistory.find((m) => m.id === id);
  if (!msg) return res.status(404).json({ error: "Message not found" });

  const isPinned = pinnedChatMessages.some((m) => m.id === id);
  if (isPinned) {
    pinnedChatMessages = pinnedChatMessages.filter((m) => m.id !== id);
  } else {
    pinnedChatMessages.unshift(msg);
    if (pinnedChatMessages.length > 5) pinnedChatMessages.pop();
  }

  io.emit("chat:pinned", { id, isPinned: !isPinned, pinnedList: pinnedChatMessages });
  res.json({ id, isPinned: !isPinned, pinned: pinnedChatMessages });
});

app.delete("/api/chat/:id", (req, res) => {
  const { id } = req.params;
  const idx = chatHistory.findIndex((m) => m.id === id);
  if (idx !== -1) {
    chatHistory.splice(idx, 1);
    pinnedChatMessages = pinnedChatMessages.filter((m) => m.id !== id);
    io.emit("chat:message_deleted", { id });
    return res.json({ ok: true, id });
  }
  res.status(404).json({ ok: false, error: "Message not found" });
});

app.get("/api/chat/export", (req, res) => {
  res.setHeader("Content-Disposition", 'attachment; filename="chat-transcript.json"');
  res.json({
    exportedAt: new Date().toISOString(),
    totalMessages: chatHistory.length,
    messages: chatHistory
  });
});

io.on("connection", (socket) => {
  pruneExpiredSessions();

  const auth = socket.handshake?.auth || {};
  const query = socket.handshake?.query || {};
  const incomingClientId = String(auth.clientId || query.clientId || socket.id);
  const incomingName = sanitizePlain(auth.name || query.name || "", 20);

  let guestName = incomingName;
  if (!guestName && knownSessions.has(incomingClientId)) {
    guestName = knownSessions.get(incomingClientId).name;
  }
  if (!guestName) {
    guestName = randomName();
  }

  socket.data.name = guestName;
  socket.data.id = socket.id;
  socket.data.clientId = incomingClientId;
  socket.data.joinedAt = Date.now();

  knownSessions.set(incomingClientId, { name: guestName, lastActive: Date.now() });
  connectedUsers.set(socket.id, {
    id: socket.id,
    clientId: incomingClientId,
    name: guestName,
    joinedAt: socket.data.joinedAt,
    lastActive: Date.now()
  });

  totalVisitorSessions++;

  socket.emit("chat:init", {
    name: guestName,
    history: chatHistory,
    pinned: pinnedChatMessages,
    online: getRealOnlineCount(),
    users: getUserList()
  });

  broadcastPresence();
  addActivity("visitor", `Visitor ${guestName} joined the desktop session`);

  socket.on("chat:join", (payload) => {
    pruneExpiredSessions();

    const cId = (typeof payload === "object" && payload?.clientId)
      ? String(payload.clientId)
      : socket.data.clientId || socket.id;
    const cName = (typeof payload === "object" && payload?.name)
      ? sanitizePlain(payload.name, 20)
      : "";

    let resolvedName = cName || socket.data.name;
    if (!resolvedName && knownSessions.has(cId)) {
      resolvedName = knownSessions.get(cId).name;
    }
    if (!resolvedName) resolvedName = randomName();

    socket.data.name = resolvedName;
    socket.data.clientId = cId;

    knownSessions.set(cId, { name: resolvedName, lastActive: Date.now() });
    connectedUsers.set(socket.id, {
      id: socket.id,
      clientId: cId,
      name: resolvedName,
      joinedAt: socket.data.joinedAt || Date.now(),
      lastActive: Date.now()
    });

    socket.emit("chat:init", {
      name: resolvedName,
      history: chatHistory,
      pinned: pinnedChatMessages,
      online: getRealOnlineCount(),
      users: getUserList()
    });

    broadcastPresence();
  });

  socket.on("chat:rename", (newName) => {
    const clean = sanitizePlain(newName, 20);
    if (clean) {
      socket.data.name = clean;
      const cId = socket.data.clientId || socket.id;
      knownSessions.set(cId, { name: clean, lastActive: Date.now() });

      const user = connectedUsers.get(socket.id);
      if (user) {
        user.name = clean;
        user.lastActive = Date.now();
      }
      broadcastPresence();
    }
  });

  socket.on("chat:message", (data, ack) => {
    // Flood protection (max 5 messages within 3 seconds)
    const now = Date.now();
    let timestamps = socketFloodTracker.get(socket.id) || [];
    timestamps = timestamps.filter((t) => now - t < 3000);

    if (timestamps.length >= 5) {
      const floodError = "Flood protection active. Please wait a few seconds before sending another message.";
      socket.emit("chat:rate_limited", { message: floodError, cooldownMs: 3000 });
      if (typeof ack === "function") ack({ ok: false, error: floodError });
      return;
    }
    timestamps.push(now);
    socketFloodTracker.set(socket.id, timestamps);

    const isObj = typeof data === "object" && data !== null;
    const rawText = isObj ? data.text : data;
    const replyTo = isObj ? data.replyTo : null;

    const clean = sanitizePlain(rawText, 500);
    if (!clean) {
      if (typeof ack === "function") ack({ ok: false, error: "Message cannot be empty." });
      return;
    }

    const senderId = (isObj && data.senderId) ? String(data.senderId) : socket.data.clientId || socket.id;
    const tempId = (isObj && data.tempId) ? String(data.tempId) : undefined;
    const customName = (isObj && data.senderName) ? sanitizePlain(data.senderName, 20) : "";
    const authorName = customName || socket.data.name || "Anonymous";
    if (customName) socket.data.name = customName;

    if (knownSessions.has(senderId)) {
      knownSessions.get(senderId).lastActive = Date.now();
      if (customName) knownSessions.get(senderId).name = customName;
    }
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.lastActive = Date.now();
      if (customName) user.name = customName;
    }

    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tempId,
      senderId,
      name: authorName,
      text: clean,
      ts: Date.now(),
      reactions: {},
      replyTo:
        replyTo && typeof replyTo === "object"
          ? {
              id: replyTo.id,
              name: sanitizePlain(replyTo.name, 30),
              text: sanitizePlain(replyTo.text, 100)
            }
          : undefined
    };

    chatHistory.push(msg);
    if (chatHistory.length > MAX_HISTORY) chatHistory = chatHistory.slice(-MAX_HISTORY);

    io.emit("chat:message", msg);
    addActivity("chat", `${authorName} sent a message in Chat`);
    if (typeof ack === "function") ack({ ok: true, message: msg });
  });

  // Chat message emoji reaction
  socket.on("chat:react", (data) => {
    if (!data || !data.id) return;
    const rawEmoji = String(data.emoji || data.key || "").trim();
    const canonicalKey = EMOJI_MAP[rawEmoji] || rawEmoji;
    if (!canonicalKey) return;

    const senderId = data.senderId || socket.data.clientId || socket.id;
    const msg = chatHistory.find((m) => m.id === data.id);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      if (!msg.userReactions) msg.userReactions = {};

      // If user has already reacted to this message, they can no longer react using any other emoji
      if (msg.userReactions[senderId]) {
        return;
      }

      msg.userReactions[senderId] = canonicalKey;
      msg.reactions[canonicalKey] = (msg.reactions[canonicalKey] || 0) + 1;
      io.emit("chat:reacted", {
        id: data.id,
        emoji: canonicalKey,
        reactions: msg.reactions,
        senderId,
        userReactions: msg.userReactions
      });
    }
  });

  // Chat message deletion via socket
  socket.on("chat:delete", ({ id }) => {
    const idx = chatHistory.findIndex((m) => m.id === id);
    if (idx !== -1) {
      chatHistory.splice(idx, 1);
      pinnedChatMessages = pinnedChatMessages.filter((m) => m.id !== id);
      io.emit("chat:message_deleted", { id });
    }
  });

  socket.on("chat:typing", () => {
    socket.broadcast.emit("chat:typing", { name: socket.data.name });
  });

  socket.on("disconnect", () => {
    connectedUsers.delete(socket.id);
    socketFloodTracker.delete(socket.id);
    broadcastPresence();
  });
});

// ---------- Express 404 & Centralized Error Handlers ----------
app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error("[Portfolio OS Server Error]:", err);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ ok: false, error: "Malformed JSON payload in request body." });
  }
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || "An unexpected internal server error occurred."
  });
});

server.listen(PORT, () => console.log(`Portfolio OS API + chat running on :${PORT}`));
