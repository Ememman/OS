import { useState, useRef, useEffect, type ReactNode } from "react";
import { useOS, APPS } from "../../store/useOS";
import { fallbackProjects } from "../../data/projects";
import { fileTree } from "../../data/files";
import { API_URL } from "../../lib/config";
import {
  GIconTerminal,
  GIconFolder,
  GIconFileText,
  GIconChevronUp,
  GIconChevronDown,
  GIconExternalLink,
} from "../icons/GravityIcons";

const BANNER_DESKTOP = `
  ██████╗  ██████╗ ██████╗ ████████╗███████╗ ██████╗ ██╗     ██╗ ██████╗      ██████╗ ███████╗
  ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██║     ██║██╔═══██╗    ██╔═══██╗██╔════╝
  ██████╔╝██║   ██║██████╔╝   ██║   █████╗  ██║   ██║██║     ██║██║   ██║    ██║   ██║███████╗
  ██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝  ██║   ██║██║     ██║██║   ██║    ██║   ██║╚════██║
  ██║     ╚██████╔╝██║  ██║   ██║   ██║     ╚██████╔╝███████╗██║╚██████╔╝    ╚██████╔╝███████║
  ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝      ╚═════╝ ╚══════╝
  Type 'help' for available commands or 'neofetch' for system info.
`;

const BANNER_MOBILE = `
   ___         _    __      _ _        ___  ___ 
  | _ \\___ _ _| |_ / _|___ | (_)___   / _ \\/ __|
  |  _/ _ \\ '_|  _|  _/ _ \\| | / _ \\ | (_) \\__ \\
  |_| \\___/_|  \\__|_| \\___/|_|_\\___/  \\___/|___/
  Type 'help' for commands or 'neofetch' for info.
`;

const COMMANDS = [
  "help", "clear", "cls", "neofetch", "whoami", "skills", "projects",
  "ls", "dir", "cat", "open", "theme", "date", "uptime", "history", "matrix",
  "sysinfo", "server", "ping", "quote", "joke", "curl", "logs", "processes", "ps", "notes", "storage", "df",
  "guestbook", "updates", "prs", "weather", "analytics", "top", "htop", "kill", "find", "search", "netstat", "clearlogs", "echo",
  "codeplay", "snake", "minesweeper", "benchmark", "leaderboard", "scores", "files", "motd", "calc", "calculator",
  "github", "mission", "sudo", "pwd", "cd", "chats", "chat", "resume", "cv", "music", "activity", "gallery", "settings", "exit"
];

const DEV_QUOTES = [
  "“Simplicity is prerequisite for reliability.” — Edsger W. Dijkstra",
  "“Make it work, make it right, make it fast.” — Kent Beck",
  "“First, solve the problem. Then, write the code.” — John Johnson",
  "“Any fool can write code that a computer can understand. Good programmers write code that humans can understand.” — Martin Fowler",
  "“Talk is cheap. Show me the code.” — Linus Torvalds",
  "“Programs must be written for people to read, and only incidentally for machines to execute.” — Harold Abelson"
];

const DEV_JOKES = [
  "There are 10 types of people in the world: those who understand binary, and those who don't.",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
  "Why do Java programmers have to wear glasses? Because they don't C#.",
  "To understand recursion, you must first understand recursion.",
  "There are 2 hard problems in computer science: cache invalidation, naming things, and off-by-one errors."
];

type TerminalEntry =
  | { type: "prompt"; cmd: string }
  | { type: "banner" | "system"; content: string }
  | { type: "output"; content: ReactNode };

// Safe client-side math expression evaluator for instant calculations
function evalMath(expr: string): { ok: boolean; result?: number | string; error?: string } {
  try {
    const sanitized = expr.replace(/\^/g, "**");
    if (!/^[0-9+\-*/()., %^eE\sMath.sqrtcospitannabsceilfloorroundlog]+$/.test(sanitized)) {
      return { ok: false, error: "Invalid math characters or unsupported syntax." };
    }
    const res = Function(`"use strict"; return (${sanitized});`)();
    if (typeof res !== "number" || isNaN(res)) {
      return { ok: false, error: "Expression did not evaluate to a valid number." };
    }
    return { ok: true, result: Number.isInteger(res) ? res : Number(res.toFixed(6)) };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Math evaluation syntax error" };
  }
}

// Local fallback engine ensuring all commands work even when backend is offline or sleeping
function getLocalCommandFallback(cmd: string, args: string[]): string {
  switch (cmd) {
    case "sysinfo":
    case "server": {
      const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 8 : 8;
      const mem = (performance as any).memory;
      const heapUsed = mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : 48;
      const heapTotal = mem ? Math.round(mem.totalJSHeapSize / 1024 / 1024) : 180;
      return [
        "🖥️ Portfolio OS Host Diagnostics (Client POSIX Engine):",
        "--------------------------------------------------",
        `• Host System:         ${navigator.userAgent.includes("Windows") ? "Windows 11 Fluent" : navigator.userAgent.includes("Mac") ? "macOS Sonoma Glass" : "Linux / Android POSIX"}`,
        `• Browser Engine:      ${navigator.userAgent.split(" ").slice(-2).join(" ")}`,
        `• Kernel Version:      v2.4.0 (Gravity Edition)`,
        `• CPU Concurrency:     ${cores} Hardware Cores Available`,
        `• Heap Memory:         ${heapUsed} MB / ${heapTotal} MB allocated`,
        `• Viewport Resolution: ${window.innerWidth} x ${window.innerHeight} px (${window.devicePixelRatio}x DPR)`,
        `• Network Status:      ${navigator.onLine ? "Online (HTTP/2 · SSL TLSv1.3)" : "Offline (Local Cache)"}`,
        `• Backend Gateway:     ${API_URL} (Standby Mode)`
      ].join("\n");
    }
    
    case "benchmark": {
      const start = performance.now();
      let primes = 0;
      for (let i = 2; i <= 20000; i++) {
        let isP = true;
        for (let j = 2; j * j <= i; j++) {
          if (i % j === 0) {
            isP = false;
            break;
          }
        }
        if (isP) primes++;
      }
      const dur = Math.round((performance.now() - start) * 100) / 100;
      const ops = Math.round(20000 / (dur / 1000));
      return [
        "⚡ Portfolio OS Kernel Performance Benchmark:",
        "--------------------------------------------------",
        `• Primes Computed:     ${primes} (Range: 2 - 20,000)`,
        `• Execution Time:      ${dur} ms`,
        `• Computation Rate:    ${ops.toLocaleString()} Ops/sec`,
        `• Client Threading:    Single-threaded V8 JS JIT Engine`,
        `• Performance Rating:  ${dur < 60 ? "A+ (Ultra Fast)" : "A (Fast)"}`
      ].join("\n");
    }

    case "ping": {
      const host = args[0] || "portfolio-os.local";
      const pingMs = Math.round(14 + Math.random() * 18);
      return `PING ${host}: 64 bytes from server, seq=1 time=${pingMs}ms, TTL=64 (status 200 OK)`;
    }

    case "weather": {
      const now = new Date();
      return [
        "🌤️ Real-Time Weather Report (Manila, Philippines):",
        "--------------------------------------------------",
        "• Station:             PAGASA Metro Manila Weather Radar",
        `• Observation Time:   ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        "• Conditions:          Partly Cloudy / Tropical Maritime Breeze",
        "• Temperature:         29°C (84.2°F) · Feels like 33°C",
        "• Relative Humidity:   70% · Dew Point: 23°C",
        "• Wind Speed & Dir:    12 km/h ENE (East-Northeast)",
        "• Barometric Pressure: 1012 hPa (Normal)",
        "• Air Quality (AQI):   38 (Good · PM2.5 Healthy)"
      ].join("\n");
    }

    case "analytics": {
      const durMin = Math.floor(performance.now() / 60000);
      return [
        "📊 Portfolio OS Platform Telemetry:",
        "-------------------------------------------",
        "• Installed Apps:      15 Desktop Modules",
        `• Active Uptime:       ${durMin} minutes`,
        `• Current Viewport:    ${window.innerWidth}x${window.innerHeight} px`,
        `• Storage Used:        ${(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB (LocalStorage)`,
        "• Render Engine:       React 19 + Vite 6 + Tailwind v4",
        "• System Health:       100% Operational"
      ].join("\n");
    }

    case "motd":
      return [
        "╔════════════════════════════════════════════════════════════╗",
        "║        Welcome to Portfolio OS — Developer Edition         ║",
        "╚════════════════════════════════════════════════════════════╝",
        "• System Status:       Online & Healthy (Express 5 + React 19)",
        "• Active Applications: 15 Built-in Desktop Modules",
        "• Latest Update:       Arcade Leaderboard, CodePlay & Cloud Drive",
        "• Developer Tip:       Press ⌘K or Ctrl+K anywhere to open Spotlight Search!"
      ].join("\n");

    case "top":
    case "htop":
    case "ps":
    case "processes": {
      const liveWindows = useOS.getState().windows || [];
      const lines = [
        "PID    USER     STATUS      CPU%    MEM(MB)  NAME / ACTIVE PROCESS",
        "------------------------------------------------------------------"
      ];
      // Live Core Daemons
      lines.push("100    root     running     0.2%    18.4     kernel-compositor");
      lines.push("101    system   active      0.5%    32.1     window-manager");
      lines.push("102    system   running     0.1%    14.2     audio-subsystem");
      lines.push("103    network  connected   0.3%    21.5     websocket-poller");
      // Live Composited User Windows
      liveWindows.forEach((w, idx) => {
        const pid = 200 + idx;
        const status = w.minimized ? "minimized" : (idx === liveWindows.length - 1 ? "focused" : "active");
        const cpu = (0.4 + (Math.sin(pid + Date.now()) * 0.3 + 0.3)).toFixed(1);
        const mem = (22 + (w.title.length * 1.8)).toFixed(1);
        const padPid = String(pid).padEnd(6);
        const padUser = "emman".padEnd(8);
        const padStatus = status.padEnd(11);
        const padCpu = `${cpu}%`.padEnd(7);
        const padMem = mem.padEnd(8);
        lines.push(`${padPid} ${padUser} ${padStatus} ${padCpu} ${padMem} ${w.title} (${w.id})`);
      });
      if (liveWindows.length === 0) {
        lines.push("200    emman    focused     1.2%    26.0     Terminal (#win-terminal)");
      }
      return lines.join("\n");
    }

    case "storage":
    case "df": {
      const mem = (performance as any).memory;
      const heapUsedMB = mem ? (mem.usedJSHeapSize / (1024 * 1024)).toFixed(1) : "38.4";
      const heapTotalMB = mem ? (mem.totalJSHeapSize / (1024 * 1024)).toFixed(1) : "128.0";
      const lsRaw = JSON.stringify(localStorage);
      const lsKB = (lsRaw.length / 1024).toFixed(2);
      const activeWindows = useOS.getState().windows.length;
      return [
        "💾 Virtual Storage & Memory Diagnostics (Real-Time Live Telemetry):",
        "------------------------------------------------------------------",
        `• Client Heap Memory:     ${heapUsedMB} MB / ${heapTotalMB} MB (${mem ? Math.round((mem.usedJSHeapSize / mem.totalJSHeapSize) * 100) : 30}% Allocated)`,
        `• LocalStorage Database:  ${lsKB} KB consumed by state & settings`,
        `• Active Process Windows:   ${activeWindows} live DOM instances mounted`,
        `• Virtual Cloud Drive:      ${fileTree.children.length} filesystem nodes active`,
        `• Virtual File System:     PortfolioOS-vfs (Encrypted Client Sandbox)`,
        `• Host Architecture:        ${navigator.platform || "POSIX-Compliant Client"}`
      ].join("\n");
    }

    case "quote":
      return DEV_QUOTES[Math.floor(Math.random() * DEV_QUOTES.length)];

    case "joke":
      return DEV_JOKES[Math.floor(Math.random() * DEV_JOKES.length)];

    case "netstat":
      return [
        "🌐 Network Interfaces & Active Sockets:",
        "----------------------------------------",
        "• Interface [wlan0]:   IP 192.168.1.104 (Connected)",
        "• Protocol:            HTTP/2.0 TLSv1.3 WebSocket",
        `• Gateway Host:        ${API_URL}`,
        `• Client Online:       ${navigator.onLine ? "YES" : "NO"}`
      ].join("\n");

    case "curl": {
      const target = args[0] || "/api/health";
      return [
        "HTTP/1.1 200 OK",
        `Host: ${target}`,
        "Content-Type: application/json",
        JSON.stringify({ ok: true, status: "healthy", timestamp: Date.now() }, null, 2)
      ].join("\n");
    }

    case "leaderboard":
    case "scores":
      return [
        "🏆 Portfolio OS Global Arcade Leaderboard:",
        "==================================================",
        "\n🎮 2048 Puzzle:",
        "RANK  PLAYER              SCORE    BADGE / DETAILS",
        "--------------------------------------------------",
        "#1    SwiftOtter214       888      🏅 Competitor (Max Tile: 128)",
        "#2    CyberKnight         640      ⭐ Adventurer (Max Tile: 64)",
        "\n🐍 Snake Retro:",
        "RANK  PLAYER              SCORE    BADGE / DETAILS",
        "--------------------------------------------------",
        "#1    NeonCoder           140      🏆 Gold Snake Master",
        "#2    PixelPilot          90       🥈 Silver Striker"
      ].join("\n");

    case "logs":
      return [
        "📜 Recent System Event Logs:",
        "----------------------------------------",
        `[${new Date().toLocaleTimeString()}] [INFO] [Kernel] Portfolio OS v2.4.0 booted successfully`,
        `[${new Date().toLocaleTimeString()}] [INFO] [WindowMgr] Terminal session active (emman@portfolio-os)`,
        `[${new Date().toLocaleTimeString()}] [INFO] [Audio] WebAudio engine initialized`
      ].join("\n");

    case "clearlogs":
      return "System event logs buffer reset.";

    default:
      return `Executed '${cmd}' successfully.`;
  }
}

export default function Terminal() {
  const { openApp, closeWindow, wallpapers, setWallpaper, osMode, toggleMissionControl } = useOS();
  const [history, setHistory] = useState<TerminalEntry[]>([
    { type: "banner", content: BANNER_DESKTOP },
    { type: "system", content: "Portfolio OS Kernel v2.4.0 (Gravity Edition) initialized." },
    { type: "system", content: "Logged in as emman@portfolio-os. Type 'help' to start." },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [matrixActive, setMatrixActive] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, matrixActive]);

  // Keep input focused safely without forcing disruptive page scrolls
  const focusInput = () => {
    if (!matrixActive) {
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  // Matrix digital rain animation
  useEffect(() => {
    if (!matrixActive) return;
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const chars = "0123456789ABCDEF@#$%&*+-/<>~§±";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const interval = setInterval(() => {
      ctx.fillStyle = "rgba(5, 7, 12, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#22c55e";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }, 33);

    return () => clearInterval(interval);
  }, [matrixActive]);

  // Mobile virtual keyboard helpers
  const handleTabComplete = () => {
    const trimmed = inputVal.trimStart();
    if (!trimmed) return;
    const match = COMMANDS.find((c) => c.startsWith(trimmed.toLowerCase()));
    if (match) {
      setInputVal(match);
      inputRef.current?.focus();
    }
  };

  const handlePrevHistory = () => {
    if (cmdHistory.length === 0) return;
    const nextIdx = historyIdx < 0 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
    setHistoryIdx(nextIdx);
    setInputVal(cmdHistory[nextIdx]);
    inputRef.current?.focus();
  };

  const handleNextHistory = () => {
    if (historyIdx < 0) return;
    const nextIdx = historyIdx + 1;
    if (nextIdx >= cmdHistory.length) {
      setHistoryIdx(-1);
      setInputVal("");
    } else {
      setHistoryIdx(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    }
    inputRef.current?.focus();
  };

  const handleCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) {
      setHistory((prev) => [...prev, { type: "prompt", cmd: "" }]);
      return;
    }

    setCmdHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output: any = null;

    switch (cmd) {
      case "help":
      case "?":
        output = (
          <div className="space-y-3 py-1.5 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <p className="text-emerald-400 font-bold text-sm">Portfolio OS Terminal Commands</p>
              <span className="text-[10px] text-white/40">Type command & press Enter</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-cyan-400 font-semibold text-[11px] uppercase tracking-wider">🚀 System & Diagnostics</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] mt-1 text-white/80">
                  <div><span className="text-emerald-400 font-bold">whoami</span> - Developer profile & intro</div>
                  <div><span className="text-emerald-400 font-bold">skills</span> - Technical skill stacks</div>
                  <div><span className="text-emerald-400 font-bold">projects</span> - Showcase of live projects</div>
                  <div><span className="text-emerald-400 font-bold">sysinfo</span> - CPU, memory & diagnostics</div>
                  <div><span className="text-emerald-400 font-bold">benchmark</span> - Real-time CPU prime stress test</div>
                  <div><span className="text-emerald-400 font-bold">neofetch</span> - System specs & OS stats</div>
                  <div><span className="text-emerald-400 font-bold">analytics</span> - Platform telemetry & stats</div>
                  <div><span className="text-emerald-400 font-bold">motd</span> - Print message of the day</div>
                  <div><span className="text-emerald-400 font-bold">updates / prs</span> - Live PRs & changelog</div>
                </div>
              </div>

              <div>
                <span className="text-amber-400 font-semibold text-[11px] uppercase tracking-wider">📱 Applications & Games</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] mt-1 text-white/80">
                  <div><span className="text-emerald-400 font-bold">codeplay</span> - Launch CodePlay Sandbox</div>
                  <div><span className="text-emerald-400 font-bold">snake</span> - Launch Nokia Retro Snake</div>
                  <div><span className="text-emerald-400 font-bold">minesweeper</span> - Launch Minesweeper arcade</div>
                  <div><span className="text-emerald-400 font-bold">guestbook</span> - Real-time visitor signatures</div>
                  <div><span className="text-emerald-400 font-bold">calc [math]</span> - Evaluate math / open calculator</div>
                  <div><span className="text-emerald-400 font-bold">github</span> - Developer GitHub card & link</div>
                  <div><span className="text-emerald-400 font-bold">mission</span> - Toggle Mission Control</div>
                  <div><span className="text-emerald-400 font-bold">open &lt;app&gt;</span> - Launch any OS app</div>
                </div>
              </div>

              <div>
                <span className="text-purple-400 font-semibold text-[11px] uppercase tracking-wider">📁 Files & Navigation</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] mt-1 text-white/80">
                  <div><span className="text-emerald-400 font-bold">ls / dir</span> - List files and directories</div>
                  <div><span className="text-emerald-400 font-bold">cat &lt;file&gt;</span> - Read text file content</div>
                  <div><span className="text-emerald-400 font-bold">pwd / cd</span> - Path location & navigation</div>
                  <div><span className="text-emerald-400 font-bold">files [open]</span> - Browse virtual cloud drive</div>
                  <div><span className="text-emerald-400 font-bold">notes [open]</span> - View notes / launch Notes app</div>
                  <div><span className="text-emerald-400 font-bold">clear</span> - Clear terminal screen</div>
                </div>
              </div>

              <div>
                <span className="text-sky-400 font-semibold text-[11px] uppercase tracking-wider">🛠️ Network, Tools & Fun</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] mt-1 text-white/80">
                  <div><span className="text-emerald-400 font-bold">ping [host]</span> - Test latency response time</div>
                  <div><span className="text-emerald-400 font-bold">weather</span> - Real-time forecast report</div>
                  <div><span className="text-emerald-400 font-bold">matrix</span> - Toggle digital rain effect</div>
                  <div><span className="text-emerald-400 font-bold">quote / joke</span> - Developer wisdom & humor</div>
                  <div><span className="text-emerald-400 font-bold">top / ps</span> - Real-time process monitor</div>
                  <div><span className="text-emerald-400 font-bold">storage / df</span> - Storage breakdown</div>
                  <div><span className="text-emerald-400 font-bold">theme &lt;info&gt;</span> - Accent & wallpaper settings</div>
                  <div><span className="text-emerald-400 font-bold">sudo &lt;cmd&gt;</span> - Administrator privileges</div>
                </div>
              </div>
            </div>

            <p className="text-white/40 text-[10px] pt-1 border-t border-white/10">
              💡 Mobile tips: Use the bottom toolbar buttons for quick commands, Tab autocompletion, and ↑/↓ history navigation!
            </p>
          </div>
        );
        break;

      case "clear":
      case "cls":
        setHistory([]);
        return;

      case "exit":
        closeWindow("terminal");
        return;

      case "codeplay":
        openApp("codeplay");
        output = <p className="text-emerald-400 text-xs">⚡ Launching CodePlay Sandbox environment...</p>;
        break;

      case "snake":
        openApp("games");
        output = <p className="text-emerald-400 text-xs">🐍 Launching Nokia 3310 Retro Snake Arcade...</p>;
        break;

      case "minesweeper":
        openApp("games");
        output = <p className="text-amber-400 text-xs">💣 Launching Retro Minesweeper Arcade...</p>;
        break;

      case "guestbook":
        if (args[0] === "open") {
          openApp("guestbook");
          output = <p className="text-emerald-400 text-xs">📖 Launching Social Guestbook & Ledger...</p>;
        } else {
          let entries: any[] = [];
          try {
            const gRes = await fetch(`${API_URL}/api/guestbook`);
            if (gRes.ok) {
              const data = await gRes.json();
              if (Array.isArray(data)) entries = data;
            }
          } catch {}

          output = (
            <div className="space-y-1.5 py-1 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <span className="text-emerald-400 font-bold">📖 Real-Time Visitor Guestbook (${entries.length} Signatures):</span>
                <button
                  onClick={() => openApp("guestbook")}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 text-[10px] transition-colors"
                >
                  Sign Guestbook ↗
                </button>
              </div>
              {entries.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {entries.slice(0, 6).map((g: any, i: number) => (
                    <div key={g.id || i} className="p-1.5 rounded bg-white/5 border border-white/10 text-[11px]">
                      <div className="flex items-center justify-between text-white/80 font-medium">
                        <span>@{g.name || "Anonymous"}</span>
                        <span className="text-[10px] text-white/40">{new Date(g.timestamp || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <p className="text-white/70 italic mt-0.5">"{g.message}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-[11px]">No guestbook signatures loaded yet. Type 'guestbook open' to sign!</p>
              )}
            </div>
          );
        }
        break;

      case "chats":
      case "chat":
        openApp("chats");
        output = <p className="text-emerald-400 text-xs">💬 Launching Real-time Messenger...</p>;
        break;

      case "resume":
      case "cv":
        openApp("resume");
        output = <p className="text-emerald-400 text-xs">📄 Launching Developer Interactive Resume...</p>;
        break;

      case "music":
        openApp("music");
        output = <p className="text-emerald-400 text-xs">🎵 Launching Audio Player & Music Library...</p>;
        break;

      case "activity":
        openApp("activity");
        output = <p className="text-emerald-400 text-xs">📊 Launching System Activity Monitor...</p>;
        break;

      case "gallery":
        openApp("gallery");
        output = <p className="text-emerald-400 text-xs">🖼️ Launching Media Gallery...</p>;
        break;

      case "settings":
        openApp("settings");
        output = <p className="text-emerald-400 text-xs">⚙️ Launching System Settings...</p>;
        break;

      case "mission":
        toggleMissionControl();
        output = <p className="text-emerald-400 text-xs">🪟 Toggled Mission Control window overview.</p>;
        break;

      case "calc":
      case "calculator":
        if (args.length === 0) {
          openApp("calculator");
          output = <p className="text-emerald-400 text-xs">🧮 Launching Scientific Desktop Calculator...</p>;
        } else {
          const expr = args.join(" ");
          const evalRes = evalMath(expr);
          if (evalRes.ok) {
            output = (
              <div className="text-xs text-emerald-300 font-mono py-0.5">
                <span className="text-white/60">{expr} = </span>
                <span className="font-bold text-emerald-400">{evalRes.result}</span>
              </div>
            );
          } else {
            output = <p className="text-rose-400 text-xs">Math error: {evalRes.error}</p>;
          }
        }
        break;

      case "files":
        if (args[0] === "open") {
          openApp("files");
          output = <p className="text-emerald-400 text-xs">📁 Launching Cloud Virtual Drive...</p>;
        } else {
          output = (
            <div className="space-y-1.5 py-1 text-xs">
              <div className="flex items-center justify-between">
                <p className="text-white/80 font-semibold">Virtual Cloud Drive ({fileTree.children.length} items):</p>
                <button
                  onClick={() => openApp("files")}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 text-[10px] transition-colors"
                >
                  Launch Files App ↗
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                {fileTree.children.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-white/70">
                    {item.type === "folder" ? (
                      <GIconFolder size={13} className="text-sky-400 shrink-0" />
                    ) : (
                      <GIconFileText size={13} className="text-white/50 shrink-0" />
                    )}
                    <span className={item.type === "folder" ? "text-sky-300 font-medium" : ""}>{item.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-white/40 text-[10px]">Tip: Type 'cat &lt;file&gt;' to read text files, or 'files open' to launch the app.</p>
            </div>
          );
        }
        break;

      case "notes":
        if (args[0] === "open") {
          openApp("notes");
          output = <p className="text-emerald-400 text-xs">📝 Launching Cloud Notes app...</p>;
        } else {
          let notesList: any[] = [];
          try {
            const nRes = await fetch(`${API_URL}/api/notes`);
            if (nRes.ok) {
              const data = await nRes.json();
              if (Array.isArray(data)) notesList = data;
            }
          } catch {}

          output = (
            <div className="space-y-1 py-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/80 font-semibold">📌 Cloud Notes Repository (${notesList.length || 3} items):</span>
                <button
                  onClick={() => openApp("notes")}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 text-[10px] transition-colors"
                >
                  Open Notes App ↗
                </button>
              </div>
              {notesList.length > 0 ? (
                <div className="space-y-0.5">
                  {notesList.map((n: any) => (
                    <p key={n.id || n.title} className="text-white/70 text-[11px]">
                      • [{n.tag || "general"}] <span className="text-white/90 font-medium">{n.title}</span> {n.pinned ? "📌" : ""}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-white/60 text-[11px]">• [work] SandreaLee Salon Architecture & Deployment</p>
                  <p className="text-white/60 text-[11px]">• [ideas] WebOS Window Snapping & Audio Engine</p>
                  <p className="text-white/60 text-[11px]">• [todo] Straive IMS performance optimization</p>
                </div>
              )}
            </div>
          );
        }
        break;

      case "github":
        output = (
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2 text-xs max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <GIconExternalLink size={13} />
                GitHub: @ememman
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Active Engineer</span>
            </div>
            <p className="text-white/80 text-[11px] leading-relaxed">
              Full-stack engineer crafting responsive web applications, mobile ecosystems (React Native/Expo), and interactive operating systems.
            </p>
            <div className="text-[11px] space-y-0.5 text-white/60">
              <p>• Repositories: <span className="text-cyan-300 font-mono">Portfolio-OS</span>, <span className="text-cyan-300 font-mono">sandrealee-salon</span>, <span className="text-cyan-300 font-mono">straive-ims</span></p>
              <p>• Primary Languages: TypeScript, JavaScript, PHP, Python, HTML/CSS</p>
            </div>
            <a
              href="https://github.com/ememman"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition-colors"
            >
              <span>Open github.com/ememman</span>
              <GIconExternalLink size={12} />
            </a>
          </div>
        );
        break;

      case "pwd":
        output = <p className="text-emerald-300 text-xs">/home/emman</p>;
        break;

      case "cd":
        if (!args[0] || args[0] === "~" || args[0] === "/") {
          output = <p className="text-white/70 text-xs">Changed directory to /home/emman</p>;
        } else if (args[0] === "..") {
          output = <p className="text-white/70 text-xs">/home</p>;
        } else {
          output = <p className="text-white/70 text-xs">Changed directory to /home/emman/{args[0]}</p>;
        }
        break;

      case "whoami":
        output = (
          <div className="space-y-1.5 py-1 text-xs text-white/90">
            <p><span className="text-emerald-400 font-semibold">Name:</span> James Mendoza (Emman)</p>
            <p><span className="text-emerald-400 font-semibold">Role:</span> Full-Stack Developer & Software Engineer</p>
            <p><span className="text-emerald-400 font-semibold">Location:</span> Manila, Philippines</p>
            <p><span className="text-emerald-400 font-semibold">Specialization:</span> MERN Stack, React Native/Expo, NextJS, NestJS, PHP MVC, Real-time WebSockets</p>
            <p className="text-white/60 leading-relaxed pt-1">
              Passionate about building refined, responsive user interfaces, modular backend APIs,
              and interactive desktop-style web systems. Currently engineering the SandreaLee Salon mobile and dashboard ecosystem.
            </p>
          </div>
        );
        break;

      case "skills":
        output = (
          <div className="space-y-2 py-1 text-xs">
            <div>
              <span className="text-cyan-400 font-semibold">Frontend & Mobile:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {["React 19", "React Native", "Expo", "TypeScript", "Tailwind CSS v4", "Next.js", "Zustand"].map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-200 text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-emerald-400 font-semibold">Backend & Architecture:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {["NestJS", "Node.js", "Express", "Socket.IO", "PHP (MVC)", "RESTful APIs", "Authentication"].map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-200 text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-amber-400 font-semibold">Databases & DevOps:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {["MongoDB", "MySQL", "Git & GitHub", "Vite", "Docker", "Linux / POSIX"].map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-200 text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
        break;

      case "projects": {
        let liveList = fallbackProjects;
        let liveLikes: Record<string, number> = {};
        try {
          const pRes = await fetch(`${API_URL}/api/projects`);
          if (pRes.ok) {
            const data = await pRes.json();
            if (Array.isArray(data) && data.length > 0) liveList = data;
          }
          const lRes = await fetch(`${API_URL}/api/projects/likes`);
          if (lRes.ok) {
            liveLikes = await lRes.json();
          }
        } catch {}

        output = (
          <div className="space-y-3 py-1 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-emerald-400 font-bold">🚀 Live Featured Projects (${liveList.length} Total):</span>
              <span className="text-[10px] text-white/40">Real-Time Sync</span>
            </div>
            <div className="space-y-2">
              {liveList.map((p: any) => {
                const stars = liveLikes[p.id] || 0;
                return (
                  <div key={p.id} className="p-2.5 rounded bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">{p.title}</span>
                        {stars > 0 && (
                          <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                            ⭐ ${stars} likes
                          </span>
                        )}
                      </div>
                      <span className="text-white/40 text-[11px]">{p.year || "2026"} · {p.category}</span>
                    </div>
                    <p className="text-white/70 text-[11px] mt-1">{p.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.stack?.map((s: string) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
        break;
      }

      case "open":
        if (!args[0]) {
          output = (
            <div className="space-y-1 text-xs">
              <p className="text-amber-400">Usage: open &lt;app&gt;</p>
              <p className="text-white/60">Available apps: {Object.keys(APPS).join(", ")}</p>
            </div>
          );
        } else {
          const rawApp = args[0].toLowerCase();
          const appMap: Record<string, string> = {
            codeplay: "codeplay",
            sandbox: "codeplay",
            ide: "codeplay",
            calc: "calculator",
            calculator: "calculator",
            games: "games",
            snake: "games",
            minesweeper: "games",
            arcade: "games",
            chat: "chats",
            chats: "chats",
            messenger: "chats",
            resume: "resume",
            cv: "resume",
            files: "files",
            drive: "files",
            notes: "notes",
            notepad: "notes",
            music: "music",
            player: "music",
            activity: "activity",
            top: "activity",
            gallery: "gallery",
            photos: "gallery",
            settings: "settings",
            guestbook: "guestbook",
            terminal: "terminal",
            library: "library",
            updates: "updates"
          };

          const target = appMap[rawApp] || Object.keys(APPS).find((k) => k === rawApp);
          if (target && APPS[target]) {
            openApp(target);
            output = <p className="text-emerald-400">Launching {APPS[target].title}…</p>;
          } else {
            output = <p className="text-rose-400">App '{rawApp}' not found. Available: {Object.keys(APPS).join(", ")}</p>;
          }
        }
        break;

      case "ls":
      case "dir":
        output = (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1 text-xs">
            {fileTree.children.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                {item.type === "folder" ? (
                  <GIconFolder size={14} className="text-sky-400 shrink-0" />
                ) : (
                  <GIconFileText size={14} className="text-white/60 shrink-0" />
                )}
                <span className={item.type === "folder" ? "text-sky-300 font-semibold" : "text-white/80"}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        );
        break;

      case "cat":
        if (!args[0]) {
          output = <p className="text-amber-400 text-xs">Usage: cat &lt;filename&gt; (e.g. cat About_Emman.txt, cat Skills.txt, cat README.md)</p>;
        } else {
          const rawTarget = args[0].toLowerCase();
          const found = fileTree.children.find(
            (f) =>
              f.name.toLowerCase() === rawTarget ||
              (rawTarget.includes("james") && f.name.toLowerCase().includes("emman")) ||
              (rawTarget.includes("emman") && f.name.toLowerCase().includes("emman"))
          );
          if (found && found.type === "text" && found.content) {
            output = (
              <pre className="text-xs text-white/90 font-mono whitespace-pre-wrap leading-relaxed py-1 bg-white/5 p-2 rounded border border-white/10">
                {found.content}
              </pre>
            );
          } else {
            output = <p className="text-rose-400 text-xs">cat: {args[0]}: No such text file. Try 'ls' to list available files.</p>;
          }
        }
        break;

      case "neofetch":
        output = (
          <div className="flex flex-col sm:flex-row gap-4 py-2 text-xs">
            <pre className="text-accent font-bold leading-tight select-none shrink-0">
{`   /_/\\
  ( o.o ) 
   > ^ <  
 Portfolio
   OS 2.4`}
            </pre>
            <div className="space-y-1 text-white/90">
              <p><span className="text-accent font-bold">emman@portfolio-os</span></p>
              <p className="text-white/40">-----------------------------</p>
              <p><span className="text-accent font-semibold">OS:</span> Portfolio OS (Web / React 19)</p>
              <p><span className="text-accent font-semibold">Host:</span> {osMode === "win" ? "Windows 11 Fluent Edition" : "macOS Sonoma Glass Edition"}</p>
              <p><span className="text-accent font-semibold">Kernel:</span> 2.4.0-gravity</p>
              <p><span className="text-accent font-semibold">Uptime:</span> {Math.floor(performance.now() / 60000)} mins</p>
              <p><span className="text-accent font-semibold">Shell:</span> portfolio-sh 5.2</p>
              <p><span className="text-accent font-semibold">UI Icons:</span> Gravity UI Icons (@gravity-ui/icons)</p>
              <p><span className="text-accent font-semibold">Theme:</span> Glassmorphism (Vibrant Accent)</p>
            </div>
          </div>
        );
        break;

      case "updates":
      case "prs": {
        let liveList: any[] = [];
        let liveReactions: Record<string, any> = {};
        try {
          const uRes = await fetch(`${API_URL}/api/updates`);
          if (uRes.ok) {
            const data = await uRes.json();
            if (Array.isArray(data)) liveList = data;
          }
          const rRes = await fetch(`${API_URL}/api/updates/reactions`);
          if (rRes.ok) {
            liveReactions = await rRes.json();
          }
        } catch {}

        output = (
          <div className="space-y-2 py-1 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-emerald-400 font-bold">📢 Real-Time GitHub Pull Requests & Changelog (${liveList.length} PRs):</span>
              <button
                onClick={() => openApp("updates")}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 text-[10px] transition-colors"
              >
                Open Updates App ↗
              </button>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {liveList.slice(0, 8).map((u: any) => {
                const rx = liveReactions[u.id] || {};
                const totalRx = Object.values(rx).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number;
                return (
                  <div key={u.id} className="p-2 rounded bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white/90">
                        #{u.prNumber || u.id} [{String(u.status || "merged").toUpperCase()}] {u.title}
                      </span>
                      <span className="text-[10px] text-white/40">{u.priority || "Medium"}</span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-0.5 line-clamp-1">{u.body}</p>
                    <div className="flex items-center justify-between text-[10px] text-white/40 mt-1">
                      <span>@{u.author || "Ememman"} ({u.branch || "dev"})</span>
                      <span>❤️ ${rx.heart || 0}  🔥 ${rx.fire || 0}  🚀 ${rx.rocket || 0}  ☕ ${rx.coffee || 0} (${totalRx} total)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
        break;
      }

      case "matrix":
        setMatrixActive((prev) => !prev);
        output = <p className="text-emerald-400">Matrix digital rain {!matrixActive ? "activated" : "deactivated"}.</p>;
        break;

      case "date":
        output = <p className="text-white/90">{new Date().toString()}</p>;
        break;

      case "uptime": {
        const totalSecs = Math.floor(performance.now() / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        output = <p className="text-white/90">Session up {mins} minutes, {secs} seconds.</p>;
        break;
      }

      case "theme":
        if (!args[0]) {
          output = (
            <div className="space-y-1 text-xs">
              <p className="text-amber-400">Usage: theme wallpaper &lt;name&gt; OR theme info</p>
              <p className="text-white/60">System interactive accent is standardized to Electric Blue (#3b82f6) with active/hover feedback.</p>
              <p className="text-white/60">Available wallpapers: {wallpapers.map((w) => w.name).join(", ")}</p>
            </div>
          );
        } else if (args[0] === "accent" || args[0] === "info") {
          output = (
            <div className="space-y-1 text-xs">
              <p className="text-cyan-400 font-semibold">Standard System Interactive Scheme:</p>
              <p className="text-white/80">• Rest / Default: <span className="text-[#3b82f6] font-mono">#3b82f6</span> (Electric Blue)</p>
              <p className="text-white/80">• Hover Glow: <span className="text-[#60a5fa] font-mono">#60a5fa</span> (Soft Azure)</p>
              <p className="text-white/80">• Active / Click: <span className="text-[#1d4ed8] font-mono">#1d4ed8</span> (Deep Cobalt with tactile feedback)</p>
            </div>
          );
        } else if (args[0] === "wallpaper" && args[1]) {
          const match = wallpapers.find((w) => w.name.toLowerCase().includes(args[1].toLowerCase()) || w.id === args[1]);
          if (match) {
            setWallpaper(match.id);
            output = <p className="text-emerald-400">Wallpaper set to {match.name}.</p>;
          } else {
            output = <p className="text-rose-400">Wallpaper '{args[1]}' not found.</p>;
          }
        }
        break;

      case "history":
        output = (
          <div className="space-y-0.5 text-xs text-white/80">
            {cmdHistory.map((c, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-white/40">{i + 1}</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        );
        break;

      case "echo":
        output = <p className="text-white/90 text-xs">{args.join(" ") || ""}</p>;
        break;

      case "sudo":
        output = (
          <div className="space-y-1 text-xs">
            <p className="text-white/60">[sudo] password for emman: <span className="text-white">••••••••</span></p>
            <p className="text-rose-400 font-semibold">emman is not in the sudoers file. This incident will be reported to Santa 🎅.</p>
          </div>
        );
        break;

      // Backend-dispatched commands with automatic local resilience
      case "sysinfo":
      case "server":
      case "ping":
      case "weather":
      case "analytics":
      case "top":
      case "htop":
      case "kill":
      case "find":
      case "search":
      case "netstat":
      case "clearlogs":
      case "quote":
      case "joke":
      case "curl":
      case "logs":
      case "processes":
      case "ps":
      case "storage":
      case "df":
      case "benchmark":
      case "leaderboard":
      case "scores":
      case "motd": {
        let textResult = "";
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2800);
          const res = await fetch(`${API_URL}/api/terminal/exec`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: trimmed }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data && (data.output || data.error)) {
              textResult = data.output || data.error;
            }
          }
        } catch {
          // If offline or timeout, local fallback handles it seamlessly
        }

        if (!textResult) {
          textResult = getLocalCommandFallback(cmd, args);
        }

        output = (
          <pre className="text-xs text-emerald-300 font-mono py-1 whitespace-pre-wrap leading-relaxed">
            {textResult}
          </pre>
        );
        break;
      }

      default:
        output = (
          <p className="text-rose-400">
            command not found: {cmd}. Type <span className="text-emerald-400 underline cursor-pointer" onClick={() => handleCommand("help")}>help</span> to view available commands.
          </p>
        );
        break;
    }

    setHistory((prev) => [
      ...prev,
      { type: "prompt", cmd: trimmed },
      { type: "output", content: output },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = inputVal;
      setInputVal("");
      handleCommand(val);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handlePrevHistory();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleNextHistory();
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleTabComplete();
    } else if (e.key === "c" && e.ctrlKey) {
      setHistory((prev) => [...prev, { type: "prompt", cmd: inputVal + "^C" }]);
      setInputVal("");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  return (
    <div
      onClick={focusInput}
      className="relative flex flex-col h-full bg-[#0a0c14]/95 text-emerald-400 font-mono text-xs select-text overflow-hidden"
    >
      {/* Matrix background canvas */}
      {matrixActive && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-0 pointer-events-none opacity-40"
        />
      )}

      {/* Terminal Header Bar — Single line on mobile, no wrapping */}
      <div className="z-10 sticky top-0 flex items-center justify-between px-3 py-1.5 bg-[#05070c]/95 backdrop-blur-md border-b border-white/10 shrink-0 select-none min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <GIconTerminal size={14} className="text-emerald-400 shrink-0" />
          <span className="text-[11px] text-white/80 font-semibold truncate">
            <span className="hidden sm:inline">emman@portfolio-os:~ (portfolio-sh)</span>
            <span className="sm:hidden">emman@portfolio-os:~</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/40 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/60">bash 5.2</span>
          </span>
          <span className="hidden sm:inline px-1 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] text-white/50">UTF-8</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="relative z-10 flex-1 p-3 sm:p-4 overflow-y-auto thin-scroll space-y-2">
        {history.map((item, idx) => {
          if (item.type === "banner") {
            return (
              <div key={idx} className="select-none py-1">
                {/* Desktop Banner: Full width */}
                <pre className="hidden sm:block text-[10px] md:text-[11px] leading-tight text-emerald-400 font-mono whitespace-pre overflow-x-auto no-scrollbar">
                  {BANNER_DESKTOP}
                </pre>
                {/* Mobile Banner: Compact & beautifully fits 360px+ screens without cutoff */}
                <pre className="sm:hidden text-[9px] leading-snug text-emerald-400 font-mono whitespace-pre overflow-x-hidden">
                  {BANNER_MOBILE}
                </pre>
              </div>
            );
          }
          if (item.type === "system") {
            return (
              <div key={idx} className="text-[10px] sm:text-[11px] text-white/50">
                {item.content}
              </div>
            );
          }
          if (item.type === "prompt") {
            return (
              <div key={idx} className="flex items-start gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] pt-1 min-w-0">
                <span className="text-accent font-semibold shrink-0 hidden sm:inline">emman@portfolio-os:~$</span>
                <span className="text-accent font-semibold shrink-0 sm:hidden text-[11px]">emman@os:~$</span>
                <span className="text-white font-medium break-all">{item.cmd}</span>
              </div>
            );
          }
          if (item.type === "output") {
            return (
              <div key={idx} className="pl-0.5 sm:pl-1">
                {item.content}
              </div>
            );
          }
          return null;
        })}

        {/* Current prompt input line */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-1 min-w-0">
          <span className="text-accent font-semibold shrink-0 hidden sm:inline">emman@portfolio-os:~$</span>
          <span className="text-accent font-semibold shrink-0 sm:hidden text-[11px]">emman@os:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck="false"
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent text-white outline-none font-mono text-[11px] sm:text-[12px] caret-emerald-400"
          />
        </div>

        <div ref={endRef} />
      </div>

      {/* Quick command buttons & mobile keyboard helpers */}
      <div className="relative z-10 px-2 sm:px-3 py-1.5 bg-[#05070c]/95 border-t border-white/10 flex items-center justify-between gap-1.5 select-none shrink-0 min-w-0">
        {/* Scrollable quick commands bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 py-0.5 flex-1 touch-pan-x">
          <span className="text-[10px] text-white/40 shrink-0 font-semibold pl-0.5">Quick:</span>
          {[
            { label: "help", cmd: "help" },
            { label: "sysinfo", cmd: "sysinfo" },
            { label: "codeplay", cmd: "codeplay" },
            { label: "snake", cmd: "snake" },
            { label: "minesweeper", cmd: "minesweeper" },
            { label: "github", cmd: "github" },
            { label: "neofetch", cmd: "neofetch" },
            { label: "benchmark", cmd: "benchmark" },
            { label: "projects", cmd: "projects" },
            { label: "skills", cmd: "skills" },
            { label: "calc", cmd: "calc" },
            { label: "weather", cmd: "weather" },
            { label: "matrix", cmd: "matrix" },
            { label: "clear", cmd: "clear" }
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCommand(item.cmd);
              }}
              className="px-2 py-1 rounded bg-white/5 active:bg-emerald-500/20 hover:bg-white/15 text-[10px] text-white/75 hover:text-white transition-colors shrink-0 border border-white/5 hover:border-white/15"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile-friendly helpers: Tab, Up, Down arrow history */}
        <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-white/10">
          <button
            type="button"
            title="Autocomplete (Tab)"
            onClick={(e) => {
              e.stopPropagation();
              handleTabComplete();
            }}
            className="px-1.5 py-1 rounded bg-white/10 active:bg-emerald-500/30 hover:bg-white/20 text-[10px] text-emerald-300 font-semibold transition-colors"
          >
            Tab ⇥
          </button>
          <button
            type="button"
            title="Previous Command (Up)"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevHistory();
            }}
            className="p-1 rounded bg-white/10 active:bg-white/30 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            <GIconChevronUp size={12} />
          </button>
          <button
            type="button"
            title="Next Command (Down)"
            onClick={(e) => {
              e.stopPropagation();
              handleNextHistory();
            }}
            className="p-1 rounded bg-white/10 active:bg-white/30 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            <GIconChevronDown size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
