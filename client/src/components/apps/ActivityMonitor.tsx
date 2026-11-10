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
} from "../icons/GravityIcons";

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
  const { windows, closeWindow, osMode, systemSounds, notify } = useOS();
  const isWin = osMode === "win";

  const [activeTab, setActiveTab] = useState<
    "processes" | "performance" | "network" | "logs" | "storage" | "specs" | "benchmark"
  >("processes");

  const [sysInfo, setSysInfo] = useState<SystemInfoData | null>(null);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [osProcesses, setOsProcesses] = useState<OsProcess[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogItem[]>([]);
  const [storageData, setStorageData] = useState<StorageBreakdown | null>(null);
  const [networkData, setNetworkData] = useState<NetworkTelemetry | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Fetch telemetry, processes, logs, storage, network
  const fetchDiagnostics = async () => {
    try {
      const [infoRes, metricsRes, procRes, storageRes, logsRes, netRes] = await Promise.all([
        fetch(`${API_URL}/api/system/info`),
        fetch(`${API_URL}/api/system/metrics`),
        fetch(`${API_URL}/api/system/processes`).catch(() => null),
        fetch(`${API_URL}/api/system/storage`).catch(() => null),
        fetch(`${API_URL}/api/system/logs`).catch(() => null),
        fetch(`${API_URL}/api/system/network`).catch(() => null)
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
          <div className="space-y-5">
            {/* User Application Windows */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-display text-sm font-semibold text-white/90">
                    {isWin ? "Active Application Windows" : "User Window Compositor Tasks"}
                  </h3>
                  <p className="text-[11px] text-white/40">
                    {windows.length} window{windows.length === 1 ? "" : "s"} managed by Portfolio OS compositor.
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] text-white/50">
                  Live Reactive
                </span>
              </div>

              {windows.length === 0 ? (
                <div className="text-center py-6 rounded-xl border border-dashed border-white/10 bg-white/5">
                  <GIconActivity size={24} className="mx-auto text-white/20 mb-1.5" />
                  <p className="text-white/50 font-medium">No open windows</p>
                  <p className="text-[10px] text-white/30">
                    Launch apps from dock or desktop icons to inspect running window processes.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 overflow-x-auto thin-scroll bg-black/20">
                  <table className="w-full min-w-[340px] text-left text-[11px]">
                    <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase font-mono text-[9px] tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Process Name</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Memory</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {windows.map((win) => (
                        <tr key={win.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent" />
                            <span>{win.title}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                              {win.minimized ? "Minimized" : "Active"}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-white/60">
                            ~{(Math.abs(win.id.charCodeAt(0) * 3) % 24) + 12} MB
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => handleEndTask(win.id, win.title)}
                              className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition text-[10px] font-medium"
                            >
                              End Task
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Simulated OS Background Daemons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-display text-sm font-semibold text-white/90">
                    Background System Daemons
                  </h3>
                  <p className="text-[11px] text-white/40">
                    Core services handling WebSockets, audio synthesis, and system telemetry.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 overflow-x-auto thin-scroll bg-black/20">
                <table className="w-full min-w-[500px] text-left text-[11px]">
                  <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase font-mono text-[9px] tracking-wider">
                    <tr>
                      <th className="py-2 px-3">PID</th>
                      <th className="py-2 px-3">Service Name</th>
                      <th className="py-2 px-3">CPU %</th>
                      <th className="py-2 px-3">Memory</th>
                      <th className="py-2 px-3">State</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {osProcesses.map((p) => {
                      const isRestarting = restartingPid === p.pid || p.status === "restarting";
                      return (
                        <tr key={p.pid} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 font-mono text-white/40">{p.pid}</td>
                          <td className="py-2 px-3">
                            <div className="font-medium text-white/90">{p.name}</div>
                            {p.description && (
                              <div className="text-[9px] text-white/40">{p.description}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-white/70">{p.cpu}%</td>
                          <td className="py-2 px-3 font-mono text-white/70">{p.memoryMb} MB</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                isRestarting
                                  ? "bg-amber-500/20 text-amber-300 animate-pulse"
                                  : p.status === "running"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : p.status === "stopped"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : "bg-white/10 text-white/50"
                              }`}
                            >
                              {isRestarting ? "Restarting..." : p.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
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
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-300 font-bold">
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
