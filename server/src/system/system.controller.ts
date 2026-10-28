import { Controller, Get, Post, Body, Inject } from "@nestjs/common";
import os from "node:os";
import { ChatGateway } from "../chat/chat.gateway";
import { projects } from "../../data/projects.js";

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
          error: `Unknown server command: '${lower}'. Try 'sysinfo', 'ping', 'quote', 'joke', or 'curl'.`
        };
    }
  }
}
