import { useState, useEffect, useRef } from "react";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import { API_URL } from "../../lib/config";
import { getSocket } from "../../lib/socket";
import {
  GIconActivity,
  GIconCpu,
  GIconChartLine,
  GIconSignal,
  GIconClose,
  GIconRotateRight,
  GIconTrash,
  GIconCheck,
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

export default function ActivityMonitor() {
  const { windows, closeWindow, osMode, systemSounds, notify } = useOS();
  const isWin = osMode === "win";

  const [activeTab, setActiveTab] = useState<"processes" | "performance" | "network" | "specs">("processes");
  const [sysInfo, setSysInfo] = useState<SystemInfoData | null>(null);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [testingPing, setTestingPing] = useState(false);

  // Fetch system diagnostics and metrics
  const fetchDiagnostics = async () => {
    try {
      const [infoRes, metricsRes] = await Promise.all([
        fetch(`${API_URL}/api/system/info`),
        fetch(`${API_URL}/api/system/metrics`)
      ]);
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setSysInfo(infoData);
      }
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        if (metricsData.history) {
          setMetrics(metricsData.history);
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
        const next = [...prev.slice(-14), point];
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    fetchDiagnostics();

    const socket = getSocket();
    const onTelemetry = (data: {
      time: number;
      cpuPercent: number;
      memoryMb: number;
      systemPercent: number;
      connectedClients: number;
      uptimeSeconds: number;
    }) => {
      setMetrics((prev) => {
        const point = {
          time: data.time,
          cpuPercent: data.cpuPercent,
          memoryMb: data.memoryMb,
          systemPercent: data.systemPercent,
        };
        return [...prev.slice(-14), point];
      });

      setSysInfo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          memory: prev.memory ? {
            ...prev.memory,
            heapUsedMb: data.memoryMb,
            usagePercent: data.systemPercent,
          } : prev.memory,
          realtime: {
            connectedClients: data.connectedClients,
          },
          node: prev.node ? {
            ...prev.node,
            uptimeSeconds: data.uptimeSeconds,
          } : prev.node,
        };
      });
    };

    socket.on("system:telemetry", onTelemetry);

    // Fallback polling only when socket is disconnected
    const interval = setInterval(() => {
      if (!socket.connected) fetchDiagnostics();
    }, 5000);

    return () => {
      socket.off("system:telemetry", onTelemetry);
      clearInterval(interval);
    };
  }, []);

  const runPingTest = async () => {
    if (systemSounds) soundFx.playClick();
    setTestingPing(true);
    const start = performance.now();
    try {
      const res = await fetch(`${API_URL}/api/system/ping?t=${Date.now()}`);
      if (res.ok) {
        const roundtrip = Math.round(performance.now() - start);
        setPingLatency(roundtrip);
        notify("Ping Test Completed", `API Server round-trip response time: ${roundtrip}ms`);
      } else {
        setPingLatency(-1);
      }
    } catch {
      setPingLatency(-1);
    } finally {
      setTestingPing(false);
    }
  };

  const handleEndTask = (winId: string, title: string) => {
    if (systemSounds) soundFx.playClose();
    closeWindow(winId);
    notify("Process Terminated", `Closed "${title}" successfully.`);
  };

  const currentCpu = metrics.length > 0 ? metrics[metrics.length - 1].cpuPercent : 16;
  const currentMem = sysInfo?.memory?.heapUsedMb || (metrics.length > 0 ? metrics[metrics.length - 1].memoryMb : 48);

  return (
    <div className="flex flex-col h-full select-none bg-black/40 text-white text-xs">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 bg-white/5">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("processes")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
              activeTab === "processes"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Processes ({windows.length})
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
              activeTab === "performance"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab("network")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
              activeTab === "network"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Diagnostics & Ping
          </button>
          <button
            onClick={() => setActiveTab("specs")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
              activeTab === "specs"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            System Specs
          </button>
        </div>

        <button
          onClick={fetchDiagnostics}
          title="Refresh metrics"
          className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
        >
          <GIconRotateRight size={14} className={loading ? "animate-spin text-accent" : ""} />
        </button>
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-auto thin-scroll p-4">
        {activeTab === "processes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-semibold text-white/90">
                  {isWin ? "Running Tasks & Windows" : "Active OS Processes"}
                </h3>
                <p className="text-[11px] text-white/40">
                  {windows.length} user window{windows.length === 1 ? "" : "s"} running in window manager.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white/50">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Synced
                </span>
              </div>
            </div>

            {windows.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-dashed border-white/10 bg-white/5">
                <GIconActivity size={32} className="mx-auto text-white/20 mb-2" />
                <p className="text-white/50 font-medium">No open windows</p>
                <p className="text-[11px] text-white/30">Launch apps from the dock or desktop to view running processes.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5 shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase text-white/40 tracking-wider">
                      <th className="py-2 px-3">Process Name</th>
                      <th className="py-2 px-3">PID</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Est. Memory</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {windows.map((win, idx) => {
                      const pseudoPid = 1024 + (win.id.charCodeAt(0) * 17 + idx * 43) % 8000;
                      const pseudoMem = 28 + (win.title.length * 4) + (win.maximized ? 18 : 6);
                      return (
                        <tr key={win.id} className="hover:bg-white/8 transition-colors">
                          <td className="py-2.5 px-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent" />
                            <span className="font-medium text-white/95">{win.title}</span>
                            <span className="text-[10px] text-white/40">({win.app})</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-white/50">{pseudoPid}</td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              win.minimized
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {win.minimized ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-white/60">{pseudoMem} MB</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleEndTask(win.id, win.title)}
                              className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition text-[11px]"
                            >
                              {isWin ? "End Task" : "Force Quit"}
                            </button>
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

        {activeTab === "performance" && (
          <div className="space-y-4">
            {/* Realtime Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-wide">CPU Load</div>
                <div className="text-2xl font-display font-semibold text-emerald-400 mt-1">
                  {currentCpu}%
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">{sysInfo?.cpu?.cores || 8} Cores Active</div>
              </div>

              <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-wide">Heap Memory</div>
                <div className="text-2xl font-display font-semibold text-cyan-400 mt-1">
                  {currentMem} <span className="text-xs font-normal">MB</span>
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">Total: {sysInfo?.memory?.heapTotalMb || 64} MB</div>
              </div>

              <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-wide">System RAM</div>
                <div className="text-2xl font-display font-semibold text-violet-400 mt-1">
                  {sysInfo?.memory?.usagePercent || 42}%
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">
                  {sysInfo?.memory?.systemFreeMb ? `${Math.round(sysInfo.memory.systemFreeMb / 1024)}GB Free` : "Plenty free"}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-wide">Connected Sockets</div>
                <div className="text-2xl font-display font-semibold text-accent mt-1">
                  {sysInfo?.realtime?.connectedClients || 1}
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">Real-time Visitors</div>
              </div>
            </div>

            {/* Live Chart Canvas or SVG */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white/80">CPU Utilization History</span>
                <span className="text-[11px] text-emerald-400 font-mono">{currentCpu}%</span>
              </div>
              <div className="h-28 w-full flex items-end gap-1.5 pt-2 border-b border-white/10">
                {metrics.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                    <div
                      className="w-full bg-emerald-400/70 hover:bg-emerald-300 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(4, m.cpuPercent)}%` }}
                    />
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-black/90 px-1.5 py-0.5 rounded text-[9px] pointer-events-none transition whitespace-nowrap z-10">
                      {m.cpuPercent}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-white/30 pt-1 font-mono">
                <span>30s ago</span>
                <span>15s ago</span>
                <span>Now</span>
              </div>
            </div>

            {/* Memory breakdown */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white/80">Memory Footprint</span>
                <span className="text-[11px] text-white/40">V8 Garbage Collector Stable</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/60">Node V8 Heap Used</span>
                    <span className="font-mono text-cyan-300">{sysInfo?.memory?.heapUsedMb || 44} MB</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(100, ((sysInfo?.memory?.heapUsedMb || 44) / (sysInfo?.memory?.heapTotalMb || 64)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/60">Resident Set Size (RSS)</span>
                    <span className="font-mono text-violet-300">{sysInfo?.memory?.rssMb || 86} MB</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-violet-400 transition-all duration-500 rounded-full"
                      style={{ width: "45%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "network" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white/90">API Server & Real-Time Gateway</h4>
                  <p className="text-[11px] text-white/40">Socket.IO WebSockets & Express REST Endpoint Status</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-medium">Operational</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg border border-white/5 bg-black/30">
                  <div className="text-[10px] text-white/40">API URL</div>
                  <div className="font-mono text-[11px] text-white/90 truncate mt-0.5">{API_URL}</div>
                </div>
                <div className="p-3 rounded-lg border border-white/5 bg-black/30">
                  <div className="text-[10px] text-white/40">Server Process Uptime</div>
                  <div className="font-mono text-[11px] text-white/90 mt-0.5">
                    {sysInfo?.node?.uptimeSeconds ? `${Math.floor(sysInfo.node.uptimeSeconds / 60)}m ${sysInfo.node.uptimeSeconds % 60}s` : "Online"}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-white/5 bg-black/30">
                  <div className="text-[10px] text-white/40">Realtime Clients</div>
                  <div className="font-mono text-[11px] text-accent mt-0.5">
                    {sysInfo?.realtime?.connectedClients || 1} active
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Ping Tool */}
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white">Live Ping Test</h4>
                  <p className="text-[11px] text-white/50">Measure real-time HTTP roundtrip latency between your browser and the Portfolio OS server.</p>
                </div>
                <button
                  onClick={runPingTest}
                  disabled={testingPing}
                  className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-white font-medium transition shadow-lg shadow-accent/20 flex items-center gap-1.5"
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
                        <span className="text-emerald-400">{pingLatency} ms <span className="text-white/40 font-normal text-xs">· Roundtrip</span></span>
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
                  <span className="font-mono text-white">{typeof window !== "undefined" ? `${window.innerWidth} × ${window.innerHeight}` : "1920 × 1080"}</span>
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
      </div>

      {/* Footer bar */}
      <div className="border-t border-white/10 px-4 py-2 bg-white/5 flex items-center justify-between text-[11px] text-white/40">
        <span>Portfolio OS Kernel v2.4</span>
        <span className="font-mono">Status: Healthy</span>
      </div>
    </div>
  );
}
