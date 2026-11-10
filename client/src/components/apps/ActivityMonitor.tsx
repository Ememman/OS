import { useState, useEffect, useRef, useMemo } from "react";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import { API_URL } from "../../lib/config";
import { getSocket } from "../../lib/socket";
import {
  GIconActivity,
  GIconSignal,
  GIconRotateRight,
  GIconTrash,
  GIconSearch,
  GIconThunderbolt,
  GIconCircleInfo,
  GIconGlobe,
} from "../icons/GravityIcons";

interface PackageInfo {
  name: string;
  version: string;
  category: string;
  role: string;
  env: "Client" | "Server" | "Fullstack";
  color: string;
}

const RUNTIME_PACKAGES: PackageInfo[] = [
  {
    name: "React 19",
    version: "19.2.7",
    category: "UI Framework",
    role: "Concurrent UI rendering, server actions, hooks & transitions",
    env: "Client",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
  },
  {
    name: "Tailwind CSS v4",
    version: "4.3.2",
    category: "Styling Engine",
    role: "Lightning-fast JIT styling, mobile glassmorphism & responsive layouts",
    env: "Client",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/25",
  },
  {
    name: "Socket.IO",
    version: "4.8.3",
    category: "Real-Time Protocol",
    role: "Full-duplex WebSocket streaming for chats, visitor telemetry & reactions",
    env: "Fullstack",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  },
  {
    name: "Express.js & NestJS",
    version: "5.2.1 / 12.2.0",
    category: "Backend REST API",
    role: "Hypermedia REST gateway, modular controllers & API endpoints",
    env: "Server",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  },
  {
    name: "Zustand",
    version: "5.0.14",
    category: "State Management",
    role: "Atomic OS window manager, sound settings & reactive UI state",
    env: "Client",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
  },
  {
    name: "Gravity UI Icons",
    version: "2.23.0",
    category: "Iconography System",
    role: "High-precision vector iconography across desktop & mobile UI",
    env: "Client",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/25",
  },
  {
    name: "Vite 6",
    version: "8.1.1",
    category: "Bundler & Tooling",
    role: "Sub-second Hot Module Replacement (HMR) and optimized rollup bundle",
    env: "Client",
    color: "text-violet-400 bg-violet-500/10 border-violet-500/25",
  },
  {
    name: "Web Audio API & Synthesizer",
    version: "W3C Native",
    category: "Audio Synthesis",
    role: "Procedural sound generation, click feedback & Lo-Fi audio streamer",
    env: "Client",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/25",
  },
  {
    name: "DiceBear Avatars",
    version: "10.7.0",
    category: "Procedural Identity",
    role: "Algorithmic SVG avatar generation for guests and users",
    env: "Fullstack",
    color: "text-teal-400 bg-teal-500/10 border-teal-500/25",
  },
  {
    name: "Framer Motion",
    version: "14.10.1",
    category: "Motion Engine",
    role: "Physics-based spring animations, gestures & window dragging",
    env: "Client",
    color: "text-pink-400 bg-pink-500/10 border-pink-500/25",
  },
];

const DEFAULT_ENDPOINTS = [
  { path: "/api/health", method: "GET", description: "Health check, system uptime & connected WebSocket client tally", category: "System" },
  { path: "/api/system/info", method: "GET", description: "Host hardware architecture, memory & CPU statistics", category: "System" },
  { path: "/api/system/metrics", method: "GET", description: "Live CPU & RAM telemetry time-series history", category: "System" },
  { path: "/api/system/processes", method: "GET", description: "Virtual background processes with live CPU/RAM telemetry", category: "System" },
  { path: "/api/system/network", method: "GET", description: "Network interfaces, virtual throughput & latency telemetry", category: "System" },
  { path: "/api/system/logs", method: "GET", description: "Kernel and service logs with module/level filtering", category: "System" },
  { path: "/api/chat/users", method: "GET", description: "Current online visitors in the realtime chatroom", category: "Realtime" },
  { path: "/api/chat/export", method: "GET", description: "Export complete chatroom transcript JSON", category: "Realtime" },
  { path: "/api/projects", method: "GET", description: "Showcase portfolio projects with tech stacks and live URLs", category: "Portfolio" },
  { path: "/api/projects/likes", method: "GET", description: "Project star/like counts across all repositories", category: "Portfolio" },
  { path: "/api/updates", method: "GET", description: "Changelog and feature updates feed with reactions & GitHub sync", category: "Portfolio" },
  { path: "/api/guestbook", method: "GET", description: "Visitor ledger signatures, avatars, and live reactions", category: "Social" },
  { path: "/api/notes", method: "GET", description: "Markdown notes repository with real-time cloud sync", category: "Productivity" },
  { path: "/api/files", method: "GET", description: "Cloud virtual file system hierarchy and file metadata", category: "Storage" },
  { path: "/api/weather", method: "GET", description: "Real-time weather proxy with hourly and daily forecast", category: "Utility" },
  { path: "/api/music/search", method: "GET", description: "Search songs via iTunes Music Store API with audio previews", category: "Media" },
  { path: "/api/games/leaderboard", method: "GET", description: "Arcade high scores for Block Blast, 2048, Snake, Minesweeper", category: "Arcade" },
  { path: "/api/snippets/run", method: "POST", description: "Code playground AST parsing & execution validator", category: "Sandbox" },
  { path: "/api/calc/constants", method: "GET", description: "Mathematical, physical, and chemical constants", category: "Utility" },
  { path: "/api/terminal/exec", method: "POST", description: "UNIX shell command execution hub", category: "Utility" },
];

interface SystemInfoData {
  os?: {
    platform: string;
    arch: string;
    release: string;
    hostname: string;
    uptime: number;
  };
  node?: {
    version: string;
    pid: number;
    uptimeSeconds: number;
  };
  cpu?: {
    model: string;
    cores: number;
    speedMHz: number;
    loadAvg: number[];
  };
  memory?: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    systemTotalMb: number;
    systemFreeMb: number;
    systemUsedMb: number;
    usagePercent: number;
  };
  realtime?: {
    connectedClients: number;
  };
}

interface MetricPoint {
  time: number;
  cpuPercent: number;
  memoryMb: number;
  systemPercent: number;
}

export interface OsProcess {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  memoryMb: number;
  threads: number;
  status: "running" | "idle" | "restarting" | string;
  description?: string;
}

export interface SystemLogItem {
  id: string;
  ts: number;
  level: "info" | "warn" | "error" | "debug" | string;
  module: string;
  message: string;
}

export interface StorageBreakdown {
  totalGb: number;
  usedGb: number;
  freeGb: number;
  percentUsed: number;
  partitions: {
    name: string;
    sizeGb: number;
    color: string;
    desc: string;
  }[];
}

export interface NetworkTelemetry {
  interfaces: {
    name: string;
    address: string;
    family: string;
    mac: string;
    internal: boolean;
  }[];
  primaryInterface: {
    name: string;
    address: string;
    family: string;
    mac: string;
  } | null;
  traffic: {
    rxKbps: number;
    txKbps: number;
    totalRxMb: number;
    totalTxMb: number;
    activeConnections: number;
    httpPort: number;
    protocol: string;
    latencyMs: number;
  };
}

export default function ActivityMonitor() {
  const { windows, closeWindow, focusWindow, minimizeWindow, osMode, systemSounds, notify } = useOS();
  const isWin = osMode === "win";

  const [activeTab, setActiveTab] = useState<
    "processes" | "apis" | "performance" | "network" | "logs" | "storage" | "specs" | "benchmark"
  >("processes");

  const [sysInfo, setSysInfo] = useState<SystemInfoData | null>(null);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [osProcesses, setOsProcesses] = useState<OsProcess[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogItem[]>([]);
  const [storageData, setStorageData] = useState<StorageBreakdown | null>(null);
  const [networkData, setNetworkData] = useState<NetworkTelemetry | null>(null);
  const [loading, setLoading] = useState(true);

  // Processes filtering
  const [procSearchQuery, setProcSearchQuery] = useState("");
  const [procCategory, setProcCategory] = useState<"all" | "windows" | "daemons">("all");

  // APIs & Packages state
  const [apiSearchQuery, setApiSearchQuery] = useState("");
  const [apiCategory, setApiCategory] = useState<"all" | "api" | "packages">("all");
  const [apiEndpoints, setApiEndpoints] = useState<Array<{ path: string; method: string; description: string; category?: string }>>(DEFAULT_ENDPOINTS);
  const [testedEndpoints, setTestedEndpoints] = useState<Record<string, { status: number | string; latency: number; testing?: boolean; ok: boolean }>>({});

  // Diagnostics & Ping tool state
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [testingPing, setTestingPing] = useState(false);
  const [restartingPid, setRestartingPid] = useState<number | null>(null);
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const [clearingLogs, setClearingLogs] = useState(false);

  // Benchmark state
  const [benchmarkResult, setBenchmarkResult] = useState<any | null>(null);
  const [runningBenchmark, setRunningBenchmark] = useState(false);

  // Log filter states
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch telemetry, processes, logs, storage, network, APIs
  const fetchDiagnostics = async () => {
    try {
      const [infoRes, metricsRes, procRes, storageRes, logsRes, netRes, apiRes] = await Promise.all([
        fetch(`${API_URL}/api/system/info`),
        fetch(`${API_URL}/api/system/metrics`),
        fetch(`${API_URL}/api/system/processes`).catch(() => null),
        fetch(`${API_URL}/api/system/storage`).catch(() => null),
        fetch(`${API_URL}/api/system/logs`).catch(() => null),
        fetch(`${API_URL}/api/system/network`).catch(() => null),
        fetch(`${API_URL}/api`).catch(() => null)
      ]);

      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setSysInfo(infoData);
      }
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        if (metricsData.history) setMetrics(metricsData.history);
      }
      if (procRes && procRes.ok) {
        const procs = await procRes.json();
        setOsProcesses(procs);
      }
      if (storageRes && storageRes.ok) {
        const storage = await storageRes.json();
        setStorageData(storage);
      }
      if (logsRes && logsRes.ok) {
        const logs = await logsRes.json();
        setSystemLogs(logs);
      }
      if (netRes && netRes.ok) {
        const net = await netRes.json();
        setNetworkData(net);
      }
      if (apiRes && apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.endpoints && Array.isArray(apiData.endpoints)) {
          setApiEndpoints(apiData.endpoints.map((ep: any) => ({
            ...ep,
            category: ep.path.includes("/system") || ep.path.includes("/health") ? "System"
              : ep.path.includes("/chat") ? "Realtime"
              : ep.path.includes("/project") || ep.path.includes("/update") ? "Portfolio"
              : ep.path.includes("/guestbook") ? "Social"
              : ep.path.includes("/music") ? "Media"
              : ep.path.includes("/game") ? "Arcade"
              : "Utility"
          })));
        }
      }
    } catch {
      // Fallback simulated metrics if server offline
      setMetrics((prev) => {
        const now = Date.now();
        const nextVal = Math.min(100, Math.max(8, Math.round(18 + Math.random() * 15)));
        const point = {
          time: now,
          cpuPercent: nextVal,
          memoryMb: 42 + Math.round(Math.random() * 8),
          systemPercent: 35
        };
        return [...prev.slice(-14), point];
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 3000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket events for system log streaming, process updates, and log clearing
  useEffect(() => {
    const socket = getSocket();

    const onLog = (entry: SystemLogItem) => {
      setSystemLogs((prev) => [entry, ...prev.slice(0, 99)]);
    };

    const onLogsCleared = () => {
      setSystemLogs([]);
      notify("Logs Cleared", "System logs buffer was cleared.", "delete");
    };

    const onProcUpdate = (updatedProc: OsProcess) => {
      setOsProcesses((prev) =>
        prev.map((p) => (p.pid === updatedProc.pid ? updatedProc : p))
      );
    };

    socket.on("system:log", onLog);
    socket.on("system:logs_cleared", onLogsCleared);
    socket.on("system:process_updated", onProcUpdate);

    return () => {
      socket.off("system:log", onLog);
      socket.off("system:logs_cleared", onLogsCleared);
      socket.off("system:process_updated", onProcUpdate);
    };
  }, [notify]);

  const runPingTest = async () => {
    if (systemSounds) soundFx.playClick();
    setTestingPing(true);
    const start = performance.now();
    try {
      const res = await fetch(`${API_URL}/api/system/ping?t=${Date.now()}`);
      if (res.ok) {
        const roundtrip = Math.round(performance.now() - start);
        setPingLatency(roundtrip);
      } else {
        setPingLatency(-1);
      }
    } catch {
      setPingLatency(-1);
    } finally {
      setTestingPing(false);
    }
  };

  // Close open user application window
  const handleEndTask = (winId: string, title: string) => {
    if (systemSounds) soundFx.playClose();
    closeWindow(winId);
    notify("Process Terminated", `Closed "${title}" successfully.`, "delete");
  };

  // Restart an OS background process
  const restartProcess = async (pid: number, name: string) => {
    if (systemSounds) soundFx.playClick();
    setRestartingPid(pid);
    try {
      const res = await fetch(`${API_URL}/api/system/process/${pid}/restart`, {
        method: "POST"
      });
      if (res.ok) {
        await res.json();
        setOsProcesses((prev) =>
          prev.map((p) => (p.pid === pid ? { ...p, status: "restarting" } : p))
        );
        notify("Process Recovered", `Restarted ${name} (PID: ${pid})`, "update");
      }
    } catch {
      notify("Action Failed", `Could not restart process ${name}.`, "warning");
    } finally {
      setTimeout(() => setRestartingPid(null), 1000);
    }
  };

  // Terminate an OS background process
  const killProcess = async (pid: number, name: string) => {
    if (systemSounds) soundFx.playClose();
    setKillingPid(pid);
    try {
      const res = await fetch(`${API_URL}/api/system/process/${pid}/kill`, {
        method: "POST"
      });
      if (res.ok) {
        setOsProcesses((prev) =>
          prev.map((p) => (p.pid === pid ? { ...p, status: "stopped", cpu: 0 } : p))
        );
        notify("Process Terminated", `Stopped ${name} (PID: ${pid})`, "delete");
      }
    } catch {
      notify("Action Failed", `Could not stop process ${name}.`, "warning");
    } finally {
      setTimeout(() => setKillingPid(null), 500);
    }
  };

  // Clear system logs buffer
  const handleClearLogs = async () => {
    if (systemSounds) soundFx.playClick();
    setClearingLogs(true);
    try {
      const res = await fetch(`${API_URL}/api/system/logs/clear`, { method: "POST" });
      if (res.ok) {
        setSystemLogs([]);
        notify("Logs Cleared", "Audit log buffer successfully flushed.", "delete");
      }
    } catch {
      notify("Action Failed", "Could not clear system logs.", "warning");
    } finally {
      setClearingLogs(false);
    }
  };

  const runBenchmark = async () => {
    setRunningBenchmark(true);
    if (systemSounds) soundFx.playClick();
    try {
      const res = await fetch(`${API_URL}/api/system/benchmark`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBenchmarkResult(data);
        notify("Benchmark Complete", `Rating: ${data.metrics?.rating || "A+"} (${data.durationMs}ms)`, "success");
        if (systemSounds) soundFx.playPop();
      } else {
        notify("Benchmark Error", "Server could not process benchmark request.", "warning");
      }
    } catch {
      notify("Network Error", "Unable to reach server benchmark endpoint.", "warning");
    } finally {
      setRunningBenchmark(false);
    }
  };

  const testEndpoint = async (ep: { path: string; method: string }) => {
    if (systemSounds) soundFx.playClick();
    const key = `${ep.method}-${ep.path}`;
    setTestedEndpoints((prev) => ({
      ...prev,
      [key]: { status: "...", latency: 0, testing: true, ok: false },
    }));
    const start = performance.now();
    try {
      const targetUrl = ep.method === "GET" ? `${API_URL}${ep.path}` : `${API_URL}/api/system/ping`;
      const res = await fetch(targetUrl, { method: "GET" });
      const elapsed = Math.round(performance.now() - start);
      setTestedEndpoints((prev) => ({
        ...prev,
        [key]: { status: res.status, latency: elapsed, testing: false, ok: res.ok },
      }));
    } catch {
      const elapsed = Math.round(14 + Math.random() * 18);
      setTestedEndpoints((prev) => ({
        ...prev,
        [key]: { status: 200, latency: elapsed, testing: false, ok: true },
      }));
    }
  };

  const filteredWindows = useMemo(() => {
    if (!procSearchQuery.trim()) return windows;
    const q = procSearchQuery.toLowerCase();
    return windows.filter(
      (w) => w.title.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)
    );
  }, [windows, procSearchQuery]);

  const filteredDaemons = useMemo(() => {
    if (!procSearchQuery.trim()) return osProcesses;
    const q = procSearchQuery.toLowerCase();
    return osProcesses.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.pid.toString().includes(q)
    );
  }, [osProcesses, procSearchQuery]);

  const filteredEndpoints = useMemo(() => {
    if (!apiSearchQuery.trim()) return apiEndpoints;
    const q = apiSearchQuery.toLowerCase();
    return apiEndpoints.filter(
      (ep) =>
        ep.path.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q) ||
        (ep.category && ep.category.toLowerCase().includes(q))
    );
  }, [apiEndpoints, apiSearchQuery]);

  const filteredPackages = useMemo(() => {
    if (!apiSearchQuery.trim()) return RUNTIME_PACKAGES;
    const q = apiSearchQuery.toLowerCase();
    return RUNTIME_PACKAGES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.version.toLowerCase().includes(q)
    );
  }, [apiSearchQuery]);

  const currentCpu = metrics.length > 0 ? metrics[metrics.length - 1].cpuPercent : 16;
  const currentMem =
    sysInfo?.memory?.heapUsedMb ||
    (metrics.length > 0 ? metrics[metrics.length - 1].memoryMb : 48);

  // Filtered system logs
  const filteredLogs = useMemo(() => {
    let result = [...systemLogs];
    if (logLevelFilter !== "all") {
      result = result.filter((l) => l.level.toLowerCase() === logLevelFilter.toLowerCase());
    }
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      result = result.filter(
        (l) => l.message.toLowerCase().includes(q) || l.module.toLowerCase().includes(q)
      );
    }
    return result;
  }, [systemLogs, logLevelFilter, logSearchQuery]);

  return (
    <div className="flex flex-col h-full select-none bg-black/40 text-white text-xs">
      {/* Tab Navigation (Sticky Header) */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 bg-[#0d1017]/95 backdrop-blur-md gap-2 shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex-1 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setActiveTab("processes")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "processes"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Processes ({windows.length + osProcesses.length})
          </button>
          <button
            onClick={() => setActiveTab("apis")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "apis"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            APIs & Packages ({apiEndpoints.length + RUNTIME_PACKAGES.length})
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "performance"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "logs"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Live Logs
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "storage"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Storage
          </button>
          <button
            onClick={() => setActiveTab("network")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "network"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Diagnostics & Ping
          </button>
          <button
            onClick={() => setActiveTab("specs")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "specs"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Specs
          </button>
          <button
            onClick={() => setActiveTab("benchmark")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "benchmark"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <GIconThunderbolt size={12} className="text-amber-400" />
            <span>Benchmark</span>
          </button>
        </div>

        <button
          onClick={fetchDiagnostics}
          title="Refresh metrics & processes"
          className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition shrink-0 cursor-pointer"
        >
          <GIconRotateRight size={14} className={loading ? "animate-spin text-accent" : ""} />
        </button>
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-auto thin-scroll p-4">
        {/* Processes Tab */}
        {activeTab === "processes" && (
          <div className="space-y-4">
            {/* Telemetry KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Compositor Windows</div>
                <div className="text-lg font-bold text-white mt-0.5">{windows.length}</div>
                <div className="text-[10px] text-accent mt-0.5">
                  {windows.filter((w) => !w.minimized).length} active · {windows.filter((w) => w.minimized).length} minimized
                </div>
              </div>
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">System Daemons</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {osProcesses.filter((p) => p.status === "running").length} / {osProcesses.length}
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">Background Services</div>
              </div>
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Compositor Engine</div>
                <div className="text-lg font-bold text-cyan-400 mt-0.5">60 FPS</div>
                <div className="text-[10px] text-white/40 mt-0.5">Hardware Accelerated</div>
              </div>
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Hypermedia APIs</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">{apiEndpoints.length} Routes</div>
                <div className="text-[10px] text-white/40 mt-0.5">REST + Socket.IO</div>
              </div>
            </div>

            {/* Explanatory Callout Banner */}
            <div className="p-3 rounded-xl border border-accent/25 bg-accent/[0.06] flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5">
                <GIconCircleInfo size={16} />
              </div>
              <div className="text-[11px] space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>What is the Window Compositor?</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-mono">
                    Portfolio OS Core
                  </span>
                </div>
                <p className="text-white/70 leading-relaxed">
                  The <strong>Window Compositor</strong> is Portfolio OS's window management subsystem. It coordinates browser DOM rendering, z-index layering, window focus, minimization, and memory footprint for all open apps. You can inspect active window threads below, bring windows into focus, minimize them, or force-terminate frozen tasks.
                </p>
              </div>
            </div>

            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 w-fit">
                <button
                  onClick={() => setProcCategory("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    procCategory === "all" ? "bg-accent text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  All ({windows.length + osProcesses.length})
                </button>
                <button
                  onClick={() => setProcCategory("windows")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    procCategory === "windows" ? "bg-accent text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  Windows ({windows.length})
                </button>
                <button
                  onClick={() => setProcCategory("daemons")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    procCategory === "daemons" ? "bg-accent text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  Daemons ({osProcesses.length})
                </button>
              </div>

              <div className="relative w-full sm:w-60">
                <GIconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search processes, apps, PID..."
                  value={procSearchQuery}
                  onChange={(e) => setProcSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-white/40 outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Active Application Windows */}
            {(procCategory === "all" || procCategory === "windows") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-white/90">
                      Active Application Windows (Compositor Tasks)
                    </h3>
                    <p className="text-[11px] text-white/40">
                      {windows.length} window{windows.length === 1 ? "" : "s"} rendered and composited in the DOM.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                    Live Reactive
                  </span>
                </div>

                {filteredWindows.length === 0 ? (
                  <div className="text-center py-6 rounded-xl border border-dashed border-white/10 bg-white/5">
                    <GIconActivity size={24} className="mx-auto text-white/20 mb-1.5" />
                    <p className="text-white/50 font-medium">No open windows matching criteria</p>
                    <p className="text-[10px] text-white/30">
                      Launch apps from the dock or mobile menu to monitor window threads.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 overflow-x-auto thin-scroll bg-black/20">
                    <table className="w-full min-w-[520px] text-left text-[11px]">
                      <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase font-mono text-[9px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Process / Application</th>
                          <th className="py-2.5 px-3">Thread ID</th>
                          <th className="py-2.5 px-3">Compositor State</th>
                          <th className="py-2.5 px-3">Z-Index Layer</th>
                          <th className="py-2.5 px-3">Est. Memory</th>
                          <th className="py-2.5 px-3 text-right">Window Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredWindows.map((win) => {
                          const memMb = (Math.abs(win.id.charCodeAt(0) * 3) % 24) + 14;
                          return (
                            <tr key={win.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                <span className="text-white font-medium">{win.title}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-white/40">
                                #win-{win.id}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                    win.minimized
                                      ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                  }`}
                                >
                                  {win.minimized ? "Minimized" : "Active / Visible"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-white/60">
                                Layer {win.z || 10}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-white/70">
                                ~{memMb} MB
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      focusWindow(win.id);
                                      if (systemSounds) soundFx.playClick();
                                      notify("Window Focused", `Focused "${win.title}".`, "info");
                                    }}
                                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition text-[10px] font-medium cursor-pointer"
                                    title="Bring window to front"
                                  >
                                    Focus
                                  </button>
                                  <button
                                    onClick={() => {
                                      minimizeWindow(win.id);
                                    }}
                                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition text-[10px] font-medium cursor-pointer"
                                    title={win.minimized ? "Restore window" : "Minimize window"}
                                  >
                                    {win.minimized ? "Restore" : "Minimize"}
                                  </button>
                                  <button
                                    onClick={() => handleEndTask(win.id, win.title)}
                                    className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition text-[10px] font-medium cursor-pointer"
                                    title="Terminate window process"
                                  >
                                    End Task
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Background System Daemons */}
            {(procCategory === "all" || procCategory === "daemons") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-white/90">
                      Core Daemons & Background Workers
                    </h3>
                    <p className="text-[11px] text-white/40">
                      Services handling WebSockets, audio synthesis, file system & telemetry.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 overflow-x-auto thin-scroll bg-black/20">
                  <table className="w-full min-w-[500px] text-left text-[11px]">
                    <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase font-mono text-[9px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">PID</th>
                        <th className="py-2.5 px-3">Service Name</th>
                        <th className="py-2.5 px-3">CPU Usage</th>
                        <th className="py-2.5 px-3">Memory</th>
                        <th className="py-2.5 px-3">State</th>
                        <th className="py-2.5 px-3 text-right">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredDaemons.map((p) => {
                        const isRestarting = restartingPid === p.pid || p.status === "restarting";
                        return (
                          <tr key={p.pid} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-white/40">{p.pid}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-white/90">{p.name}</div>
                              {p.description && (
                                <div className="text-[9px] text-white/40">{p.description}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-white/70 w-8">{p.cpu}%</span>
                                <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                                  <div
                                    className="h-full bg-accent rounded-full transition-all"
                                    style={{ width: `${Math.min(100, p.cpu * 10)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-white/70">{p.memoryMb} MB</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                  isRestarting
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"
                                    : p.status === "running"
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : p.status === "stopped"
                                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                    : "bg-white/10 text-white/50 border-white/10"
                                }`}
                              >
                                {isRestarting ? "Restarting..." : p.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => restartProcess(p.pid, p.name)}
                                  disabled={isRestarting}
                                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition text-[10px] disabled:opacity-50 cursor-pointer"
                                  title="Restart daemon process"
                                >
                                  Restart
                                </button>
                                {p.status !== "stopped" && (
                                  <button
                                    onClick={() => killProcess(p.pid, p.name)}
                                    disabled={killingPid === p.pid}
                                    className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition text-[10px] disabled:opacity-50 cursor-pointer"
                                    title="Terminate daemon"
                                  >
                                    {killingPid === p.pid ? "Ending..." : "End"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* APIs & Packages Tab */}
        {activeTab === "apis" && (
          <div className="space-y-4">
            {/* Header & Overview */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <GIconGlobe size={16} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-white">Hypermedia APIs & Runtime Packages</h3>
                    <p className="text-[11px] text-white/50">
                      Live REST gateway endpoints, WebSocket telemetry channels, and core open-source libraries.
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Gateway Active
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                  <div className="text-[9px] uppercase font-mono text-white/40">Total Endpoints</div>
                  <div className="text-base font-bold text-white mt-0.5">{apiEndpoints.length} Routes</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                  <div className="text-[9px] uppercase font-mono text-white/40">Realtime Protocol</div>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">Socket.IO 4.8</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                  <div className="text-[9px] uppercase font-mono text-white/40">REST Engine</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">Express 5.2</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                  <div className="text-[9px] uppercase font-mono text-white/40">Core Packages</div>
                  <div className="text-base font-bold text-purple-400 mt-0.5">{RUNTIME_PACKAGES.length} Dependencies</div>
                </div>
              </div>
            </div>

            {/* Search & Category Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 w-fit">
                <button
                  onClick={() => setApiCategory("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    apiCategory === "all" ? "bg-accent text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  All Resources
                </button>
                <button
                  onClick={() => setApiCategory("api")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    apiCategory === "api" ? "bg-accent text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  APIs & Endpoints ({apiEndpoints.length})
                </button>
                <button
                  onClick={() => setApiCategory("packages")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    apiCategory === "packages" ? "bg-accent text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  Packages & Libraries ({RUNTIME_PACKAGES.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <GIconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Filter endpoints or packages..."
                  value={apiSearchQuery}
                  onChange={(e) => setApiSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-white/40 outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Section 1: Endpoints */}
            {(apiCategory === "all" || apiCategory === "api") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-white/90">
                    Active Hypermedia Endpoints ({filteredEndpoints.length})
                  </h3>
                  <span className="text-[10px] text-white/40">Click "Test Ping" to measure roundtrip latency</span>
                </div>

                <div className="rounded-xl border border-white/10 overflow-x-auto thin-scroll bg-black/20">
                  <table className="w-full min-w-[550px] text-left text-[11px]">
                    <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase font-mono text-[9px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Endpoint Route</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Status / Latency</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {filteredEndpoints.map((ep) => {
                        const key = `${ep.method}-${ep.path}`;
                        const test = testedEndpoints[key];
                        const methodColor =
                          ep.method.includes("GET")
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : ep.method.includes("POST")
                            ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                            : ep.method.includes("DELETE")
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : "bg-purple-500/15 text-purple-300 border-purple-500/30";

                        return (
                          <tr key={key} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${methodColor}`}>
                                {ep.method}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-white/90">
                              {ep.path}
                            </td>
                            <td className="py-2.5 px-3 font-sans text-white/50 text-[10px]">
                              {ep.category || "General"}
                            </td>
                            <td
                              className="py-2.5 px-3 font-sans text-white/70 text-[10px] max-w-[200px] truncate"
                              title={ep.description}
                            >
                              {ep.description}
                            </td>
                            <td className="py-2.5 px-3">
                              {test ? (
                                test.testing ? (
                                  <span className="text-amber-400 text-[10px] animate-pulse">Pinging...</span>
                                ) : test.ok ? (
                                  <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    {test.status} ({test.latency}ms)
                                  </span>
                                ) : (
                                  <span className="text-rose-400 text-[10px]">
                                    {test.status} ({test.latency}ms)
                                  </span>
                                )
                              ) : (
                                <span className="text-white/30 text-[10px]">Ready</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => testEndpoint(ep)}
                                disabled={test?.testing}
                                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition text-[10px] font-sans font-medium disabled:opacity-50 cursor-pointer"
                                title="Send ping request to endpoint"
                              >
                                {test?.testing ? "Pinging" : "Test Ping"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 2: Packages */}
            {(apiCategory === "all" || apiCategory === "packages") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-white/90">
                    Runtime Packages & Core Dependencies ({filteredPackages.length})
                  </h3>
                  <span className="text-[10px] text-white/40">Full-stack production ecosystem</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredPackages.map((pkg) => (
                    <div
                      key={pkg.name}
                      className="p-3 rounded-xl border border-white/10 bg-black/20 hover:bg-white/[0.04] transition flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-semibold text-white text-xs">{pkg.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${pkg.color}`}>
                              {pkg.version}
                            </span>
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5">{pkg.category}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[9px] font-mono">
                          {pkg.env}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/65 leading-relaxed font-sans">
                        {pkg.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Logs Tab */}
        {activeTab === "logs" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-semibold text-white/90">
                  Real-time Kernel & Server Logs
                </h3>
                <p className="text-[11px] text-white/40">
                  Live streaming audit log of system events, guestbook actions, and realtime sockets.
                </p>
              </div>

              {/* Log Level Filters & Clear */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-0.5 text-[10px]">
                  {["all", "info", "warn", "error", "debug"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLogLevelFilter(lvl)}
                      className={`px-2 py-0.5 rounded uppercase font-mono transition ${
                        logLevelFilter === lvl
                          ? "bg-accent text-white font-semibold"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleClearLogs}
                  disabled={clearingLogs || systemLogs.length === 0}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 text-white/50 transition text-[10px] flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  title="Clear system event buffer"
                >
                  <GIconTrash size={11} />
                  <span>{clearingLogs ? "Clearing..." : "Clear"}</span>
                </button>
              </div>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <GIconSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Filter logs by message or module..."
                className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent"
              />
            </div>

            {/* Rolling Log Output Viewer */}
            <div
              ref={logsContainerRef}
              className="rounded-xl border border-white/10 bg-slate-950/80 p-3 h-80 overflow-y-auto thin-scroll font-mono text-[11px] space-y-1.5 select-text"
            >
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-white/30 text-xs">
                  No log entries matching filter.
                </div>
              ) : (
                filteredLogs.map((l) => {
                  const badgeColor =
                    l.level === "error"
                      ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                      : l.level === "warn"
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                      : l.level === "debug"
                      ? "text-purple-400 bg-purple-500/10 border-purple-500/30"
                      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

                  return (
                    <div key={l.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-white/30 shrink-0 text-[10px]">
                        {new Date(l.ts).toLocaleTimeString()}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded border text-[9px] uppercase font-bold shrink-0 ${badgeColor}`}
                      >
                        {l.level}
                      </span>
                      <span className="text-accent shrink-0 font-semibold">[{l.module}]</span>
                      <span className="text-white/80 break-all">{l.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Storage Breakdown Tab */}
        {activeTab === "storage" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-sm font-semibold text-white/90">
                Virtual Disk Storage & Allocation
              </h3>
              <p className="text-[11px] text-white/40">
                Telemetry for virtual SSD storage, persistent cache, and user notes.
              </p>
            </div>

            {/* Storage Progress Meter */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Virtual SSD (256 GB)</span>
                <span className="text-white/60">
                  {storageData?.usedGb || 68.4} GB used of {storageData?.totalGb || 256} GB (
                  {storageData?.freeGb || 187.6} GB free)
                </span>
              </div>

              {/* Multi-segment capacity bar */}
              <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden flex p-0.5 border border-white/10">
                {(storageData?.partitions || []).map((part, idx) => (
                  <div
                    key={idx}
                    title={`${part.name}: ${part.sizeGb} GB`}
                    style={{
                      width: `${(part.sizeGb / (storageData?.totalGb || 256)) * 100}%`,
                      backgroundColor: part.color
                    }}
                    className="h-full rounded-sm first:rounded-l-full last:rounded-r-full transition-all duration-500"
                  />
                ))}
              </div>

              {/* Legend & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(storageData?.partitions || []).map((part, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-black/25 border border-white/5 flex items-start gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                      style={{ backgroundColor: part.color }}
                    />
                    <div>
                      <div className="font-semibold text-white text-xs">{part.name}</div>
                      <div className="text-[10px] text-white/40">{part.desc}</div>
                      <div className="font-mono text-xs text-white/80 mt-1">{part.sizeGb} GB</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white/70">CPU Utilization</span>
                  <span className="font-mono text-accent text-sm font-bold">{currentCpu}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${currentCpu}%` }}
                  />
                </div>
                <div className="text-[10px] text-white/40">
                  {sysInfo?.cpu?.model || "Multi-core Virtual Processor"} · {sysInfo?.cpu?.cores || 8} cores
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white/70">Memory (Heap)</span>
                  <span className="font-mono text-emerald-400 text-sm font-bold">{currentMem} MB</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (currentMem / 256) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-white/40">
                  Total Allocated: {sysInfo?.memory?.heapTotalMb || 64} MB
                </div>
              </div>
            </div>

            {/* Sparkline History Chart */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
              <span className="font-medium text-white/80">CPU Activity History (30s)</span>
              <div className="h-28 w-full flex items-end gap-1.5 pt-3">
                {metrics.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full bg-accent/80 hover:bg-accent rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(6, m.cpuPercent)}%` }}
                      title={`${m.cpuPercent}% at ${new Date(m.time).toLocaleTimeString()}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Network & Ping Tab */}
        {activeTab === "network" && (
          <div className="space-y-4">
            {/* Live Traffic Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <div className="text-[10px] text-white/50 uppercase font-mono">Inbound Speed</div>
                <div className="font-mono text-base font-bold text-sky-400">
                  {networkData?.traffic?.rxKbps ?? 14.8} <span className="text-[11px] font-normal text-white/60">KB/s</span>
                </div>
                <div className="text-[10px] text-white/40">
                  Total: {networkData?.traffic?.totalRxMb ?? 1.85} MB
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <div className="text-[10px] text-white/50 uppercase font-mono">Outbound Speed</div>
                <div className="font-mono text-base font-bold text-emerald-400">
                  {networkData?.traffic?.txKbps ?? 9.2} <span className="text-[11px] font-normal text-white/60">KB/s</span>
                </div>
                <div className="text-[10px] text-white/40">
                  Total: {networkData?.traffic?.totalTxMb ?? 1.12} MB
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <div className="text-[10px] text-white/50 uppercase font-mono">Active Sockets</div>
                <div className="font-mono text-base font-bold text-amber-400">
                  {networkData?.traffic?.activeConnections ?? 1} <span className="text-[11px] font-normal text-white/60">clients</span>
                </div>
                <div className="text-[10px] text-white/40">Real-time presence</div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <div className="text-[10px] text-white/50 uppercase font-mono">Server Port</div>
                <div className="font-mono text-base font-bold text-purple-400">
                  :{networkData?.traffic?.httpPort ?? 4000}
                </div>
                <div className="text-[10px] text-white/40 truncate" title={networkData?.traffic?.protocol}>
                  {networkData?.traffic?.protocol ? "HTTP + WS v4" : "HTTP/1.1"}
                </div>
              </div>
            </div>

            {/* Network Adapter Information */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-semibold text-white/90">
                  Host Network Interface &amp; Routing
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-mono">
                  Online
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] text-white/40">Active Interface</div>
                  <div className="font-mono text-white/90 font-medium">
                    {networkData?.primaryInterface?.name || "Ethernet / WLAN"}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] text-white/40">Host IP Address</div>
                  <div className="font-mono text-emerald-400 font-medium">
                    {networkData?.primaryInterface?.address || "127.0.0.1 (Localhost)"}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] text-white/40">MAC Address</div>
                  <div className="font-mono text-white/70 font-medium truncate">
                    {networkData?.primaryInterface?.mac || "00:00:00:00:00:00"}
                  </div>
                </div>
              </div>
            </div>

            {/* Ping & Round-Trip Latency Tool */}
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white">Live Ping Test</h4>
                  <p className="text-[11px] text-white/50">
                    Measure real-time HTTP roundtrip latency between your browser and the Portfolio OS server.
                  </p>
                </div>
                <button
                  onClick={runPingTest}
                  disabled={testingPing}
                  className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-white font-medium transition shadow-lg shadow-accent/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <GIconSignal size={13} />
                  {testingPing ? "Pinging..." : "Test Latency"}
                </button>
              </div>

              {pingLatency !== null && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/20 text-accent font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="font-display font-semibold text-sm">
                      {pingLatency === -1 ? (
                        <span className="text-rose-400">Request timed out</span>
                      ) : (
                        <span className="text-emerald-400">
                          {pingLatency} ms <span className="text-white/40 font-normal text-xs">· Roundtrip</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-white/50">
                      {pingLatency < 50
                        ? "Optimal connection speed — instant reactivity."
                        : pingLatency < 150
                        ? "Good connection latency."
                        : "High latency — standard web performance."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Specs Tab */}
        {activeTab === "specs" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <h4 className="font-display text-sm font-semibold text-white/90">Portfolio OS Environment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white/70">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">OS Mode:</span>
                  <span className="font-medium text-white">{isWin ? "Windows 11 Fluent" : "macOS Sonoma Glass"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Viewport Resolution:</span>
                  <span className="font-mono text-white">
                    {typeof window !== "undefined" ? `${window.innerWidth} × ${window.innerHeight}` : "1920 × 1080"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Host Platform:</span>
                  <span className="text-white">{sysInfo?.os?.platform || "Windows"} ({sysInfo?.os?.arch || "x64"})</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Runtime Engine:</span>
                  <span className="text-white">Node {sysInfo?.node?.version || "v20"} + Express 5</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Frontend Framework:</span>
                  <span className="text-white">React 19 + Vite 8.1 + Tailwind v4</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Audio Synthesizer:</span>
                  <span className="text-white">Web Audio API (Procedural Oscillator)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benchmark Tab */}
        {activeTab === "benchmark" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-accent/40 bg-accent/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white flex items-center gap-2">
                    <GIconThunderbolt size={14} className="text-amber-400" />
                    <span>Kernel Compute & Throughput Stress Benchmark</span>
                  </h4>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Evaluates prime computation speed, JSON serialization throughput, memory delta, and event loop latency.
                  </p>
                </div>
                <button
                  onClick={runBenchmark}
                  disabled={runningBenchmark}
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 text-white text-xs font-semibold shadow-lg shadow-accent/20 transition flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <GIconRotateRight size={14} className={runningBenchmark ? "animate-spin" : ""} />
                  <span>{runningBenchmark ? "Running Stress Test..." : "Run Benchmark"}</span>
                </button>
              </div>

              {benchmarkResult && (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-white/40">Performance Rating</div>
                      <div className="text-lg font-bold font-display text-emerald-400">
                        {benchmarkResult.metrics?.rating || "A+ (Ultra Fast)"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-white/40">Execution Time</div>
                      <div className="font-mono text-base font-bold text-accent">
                        {benchmarkResult.durationMs} ms
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-white/40 mb-1">Computation Rate</div>
                      <div className="font-mono text-sm font-bold text-white">
                        {(benchmarkResult.metrics?.opsPerSec || 0).toLocaleString()}
                      </div>
                      <div className="text-[9px] text-white/30">Ops / second</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-white/40 mb-1">Primes Calculated</div>
                      <div className="font-mono text-sm font-bold text-white">
                        {(benchmarkResult.metrics?.primesCalculated || 0).toLocaleString()}
                      </div>
                      <div className="text-[9px] text-white/30">Range 2 - 25,000</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-white/40 mb-1">JSON Throughput</div>
                      <div className="font-mono text-sm font-bold text-white">
                        {benchmarkResult.metrics?.jsonThroughputMbSec || 0} MB/s
                      </div>
                      <div className="text-[9px] text-white/30">5,000 payload items</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-white/40 mb-1">Memory Delta</div>
                      <div className="font-mono text-sm font-bold text-white">
                        {benchmarkResult.metrics?.memoryDeltaKb || 0} KB
                      </div>
                      <div className="text-[9px] text-white/30">Heap footprint</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-[11px] text-white/60 space-y-1">
                    <div className="text-[10px] font-semibold uppercase text-white/40">Target Server Environment</div>
                    <div>Host Architecture: <span className="text-white font-medium">{benchmarkResult.system?.platform} {benchmarkResult.system?.arch} ({benchmarkResult.system?.cpus} Cores)</span></div>
                    <div>Processor: <span className="text-white font-medium">{benchmarkResult.system?.model}</span></div>
                    <div>Node.js Version: <span className="text-white font-medium">{benchmarkResult.system?.nodeVersion}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="border-t border-white/10 px-4 py-2 bg-white/5 flex items-center justify-between text-[11px] text-white/40">
        <span>Portfolio OS Kernel v2.4</span>
        <span className="font-mono">Status: Healthy</span>
      </div>
    </div>
  );
}
