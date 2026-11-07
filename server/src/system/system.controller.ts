import { Controller, Get, Post, Body, Query, Inject } from "@nestjs/common";
import os from "node:os";
import { ChatGateway } from "../chat/chat.gateway";
import { projects } from "../../data/projects.js";
import { snippets } from "../../data/snippets.js";

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

@Controller("api")
export class SystemController {
  private weatherCache = new Map<string, { ts: number; data: any }>();
  private totalVisits = 1;

  constructor(@Inject(ChatGateway) private readonly chatGateway: ChatGateway) {}

  @Get("system/info")
  getInfo() {
    const mem = process.memoryUsage();
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    return {
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
        connectedClients: this.chatGateway.getOnlineCount(),
      }
    };
  }

  @Get("system/ping")
  getPing() {
    return { pong: true, time: Date.now() };
  }

  @Post("system/benchmark")
  benchmark() {
    const start = performance.now();
    const memBefore = process.memoryUsage().heapUsed;

    let primesCount = 0;
    const limit = 25000;
    for (let i = 2; i <= limit; i++) {
      let isPrime = true;
      for (let j = 2; j * j <= i; j++) {
        if (i % j === 0) { isPrime = false; break; }
      }
      if (isPrime) primesCount++;
    }

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

    return {
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
  }

  @Get("system/network")
  getNetwork() {
    const interfaces = os.networkInterfaces();
    const ifaceList: any[] = [];
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
    return {
      ok: true,
      timestamp: Date.now(),
      interfaces: ifaceList,
      primaryInterface: ifaceList.find((i) => !i.internal && i.family === "IPv4") || ifaceList[0] || null,
      traffic: {
        rxKbps: 22.4,
        txKbps: 14.8,
        totalRxMb: 12.8,
        totalTxMb: 8.4,
        activeConnections: this.chatGateway.getOnlineCount(),
        protocol: "HTTP/1.1 + WebSocket (NestJS Gateway)",
        latencyMs: 12
      }
    };
  }

  @Get("system/storage")
  getStorage() {
    return {
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
    };
  }

  @Get("system/processes")
  getProcesses() {
    return [
      { pid: 101, name: "kernel.sys", user: "system", cpu: 1.2, memoryMb: 24.5, threads: 8, status: "running", description: "Portfolio OS Kernel & Scheduler" },
      { pid: 104, name: "window-server", user: "bron", cpu: 3.4, memoryMb: 48.2, threads: 4, status: "running", description: "Glass Compositor & Display Manager" },
      { pid: 210, name: "socket-daemon", user: "system", cpu: 0.8, memoryMb: 16.1, threads: 2, status: "running", description: "Realtime WebSocket Hub" },
      { pid: 312, name: "audio-synth-service", user: "bron", cpu: 2.1, memoryMb: 32.0, threads: 2, status: "running", description: "WebAudio Analyser & Music Streamer" },
      { pid: 418, name: "guestbook-worker", user: "system", cpu: 0.4, memoryMb: 12.8, threads: 1, status: "idle", description: "Guestbook Signature Processor" },
      { pid: 502, name: "analytics-telemetry", user: "system", cpu: 0.6, memoryMb: 14.3, threads: 1, status: "running", description: "OS Metrics & Diagnostics Collector" },
    ];
  }

  @Get("spec")
  getSpec() {
    return {
      ok: true,
      service: "Portfolio OS NestJS API Gateway",
      version: "3.2.0-lts",
      realtime: { connectedClients: this.chatGateway.getOnlineCount() }
    };
  }

  @Get("system/metrics")
  getMetrics() {
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

    return {
      timestamp: now,
      current: {
        cpuPercent: points[points.length - 1].cpuPercent,
        memoryMb: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10,
        systemPercent: usedPercent,
      },
      history: points
    };
  }

  @Get("analytics")
  getAnalytics() {
    const mem = process.memoryUsage();
    return {
      ok: true,
      totalVisits: this.totalVisits,
      activeConnections: this.chatGateway.getOnlineCount(),
      serverUptime: Math.floor(process.uptime()),
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      timestamp: Date.now()
    };
  }

  @Get("weather")
  async getWeather(@Query("lat") latStr?: string, @Query("lon") lonStr?: string) {
    const lat = parseFloat(latStr || "14.5995") || 14.5995;
    const lon = parseFloat(lonStr || "120.9842") || 120.9842;
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = this.weatherCache.get(key);
    if (cached && Date.now() - cached.ts < 600000) {
      return cached.data;
    }
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        this.weatherCache.set(key, { ts: Date.now(), data });
        return data;
      }
    } catch {}
    return {
      current: { temperature_2m: 29.2, weather_code: 1, relative_humidity_2m: 68, wind_speed_10m: 11 },
      hourly: { temperature_2m: [27, 28, 29, 29, 28, 27], weather_code: [1, 1, 2, 1, 0, 0] },
      daily: { temperature_2m_max: [31], temperature_2m_min: [25] },
      fallback: true
    };
  }

  @Get("snippets")
  getSnippets() {
    return snippets;
  }

  @Post("snippets/run")
  runSnippet(@Body() body: { code?: string; id?: string }) {
    const trimmed = String(body.code || "").trim();
    if (!trimmed) {
      return { ok: false, error: "No code provided" };
    }
    const lines = trimmed.split("\n").length;
    const hasLoops = /for\s*\(|while\s*\(|reduce\(|filter\(|map\(/.test(trimmed);
    const hasClasses = /class\s+/.test(trimmed);
    const hasAsync = /async|await|Promise/.test(trimmed);

    return {
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
    };
  }

  @Get("github/stats")
  getGithubStats() {
    return {
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
    };
  }

  @Post("terminal/exec")
  execTerminal(@Body("command") command: string) {
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
        return {
          ok: true,
          output: [
            `Server Host: ${os.hostname()} (${os.platform()} ${os.arch()})`,
            `Node Version: ${process.version}`,
            `Process Uptime: ${hours}h ${mins}m ${secs}s`,
            `Heap Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
            `RSS Memory: ${Math.round(mem.rss / 1024 / 1024)}MB`,
            `Active Realtime Clients: ${this.chatGateway.getOnlineCount()}`,
            `System Cores: ${os.cpus().length} @ ${os.cpus()[0]?.speed || 0}MHz`
          ].join("\n")
        };
      }

      case "ping": {
        const host = args[0] || "localhost:4000";
        return {
          ok: true,
          output: `PING ${host}: 64 bytes from server, seq=1 time=0.42ms, TTL=64 (status 200 OK)`
        };
      }

      case "quote": {
        const q = DEV_QUOTES[Math.floor(Math.random() * DEV_QUOTES.length)];
        return { ok: true, output: q };
      }

      case "joke": {
        const j = DEV_JOKES[Math.floor(Math.random() * DEV_JOKES.length)];
        return { ok: true, output: j };
      }

      case "weather": {
        return {
          ok: true,
          output: [
            `🌤️ Weather Report (Manila, Philippines):`,
            `-----------------------------------------`,
            `Condition:   Partly Cloudy / Clear Skies`,
            `Temperature: 29°C (84°F) · Feels like 32°C`,
            `Humidity:    68% | Wind: 11 km/h ENE`,
            `Forecast:    Pleasant tropical breeze with sunshine`
          ].join("\n")
        };
      }

      case "analytics": {
        const mem = process.memoryUsage();
        const uptime = Math.floor(process.uptime());
        const hours = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        return {
          ok: true,
          output: [
            `📊 Portfolio OS Platform Analytics:`,
            `-------------------------------------------`,
            `Live Online Clients:   ${this.chatGateway.getOnlineCount()}`,
            `Active Server Uptime:  ${hours}h ${mins}m`,
            `Server Memory RSS:     ${Math.round(mem.rss / 1024 / 1024)} MB`,
            `System Status:         100% Operational (Parity Active)`
          ].join("\n")
        };
      }

      case "curl": {
        const target = args[0] || "/api/health";
        if (target.includes("health")) {
          return {
            ok: true,
            output: JSON.stringify({
              ok: true,
              service: "Portfolio OS NestJS API",
              timestamp: Date.now(),
              uptimeSeconds: Math.floor(process.uptime()),
              realtime: { connectedClients: this.chatGateway.getOnlineCount() }
            }, null, 2)
          };
        }
        if (target.includes("project")) {
          return {
            ok: true,
            output: `HTTP/1.1 200 OK\nContent-Type: application/json\n[ ${projects.length} portfolio projects loaded ]`
          };
        }
        return {
          ok: true,
          output: `HTTP/1.1 200 OK\nFetched resource from ${target}`
        };
      }

      default:
        return {
          ok: false,
          error: `Unknown server command: '${lower}'. Try 'sysinfo', 'ping', 'weather', 'analytics', 'quote', 'joke', or 'curl'.`
        };
    }
  }
}
