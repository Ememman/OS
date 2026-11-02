import { useState, useEffect, useRef } from "react";
import {
  GIconPlay,
  GIconRotateRight,
  GIconCopy,
  GIconCheck,
  GIconDownload,
  GIconCode,
  GIconSparkles,
  GIconTerminal,
  GIconTrash,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { soundFx } from "../../lib/soundFx";
import { useOS } from "../../store/useOS";

interface Snippet {
  id: string;
  title: string;
  category: string;
  language: string;
  description: string;
  code: string;
}

const FALLBACK_SNIPPETS: Snippet[] = [
  {
    id: "array-pipeline",
    title: "Data Pipeline & Aggregation",
    category: "Fullstack / MERN",
    language: "javascript",
    description: "Transforms orders, aggregates category revenues, and identifies VIP customers.",
    code: `// Sample Order Dataset
const orders = [
  { id: 101, customer: "Alice", category: "Electronics", amount: 450, status: "completed" },
  { id: 102, customer: "Bob", category: "Apparel", amount: 85, status: "completed" },
  { id: 103, customer: "Charlie", category: "Electronics", amount: 1200, status: "completed" },
  { id: 104, customer: "Alice", category: "Books", amount: 45, status: "completed" },
  { id: 105, customer: "Diana", category: "Apparel", amount: 320, status: "pending" },
  { id: 106, customer: "Bob", category: "Electronics", amount: 950, status: "completed" },
];

console.log("🚀 Starting Data Pipeline processing...");

// 1. Filter completed transactions
const completed = orders.filter(o => o.status === "completed");

// 2. Aggregate revenue by category
const categoryRevenue = completed.reduce((acc, order) => {
  acc[order.category] = (acc[order.category] || 0) + order.amount;
  return acc;
}, {});

// 3. Find top spending VIP customers ($500+)
const customerTotals = completed.reduce((acc, order) => {
  acc[order.customer] = (acc[order.customer] || 0) + order.amount;
  return acc;
}, {});

const vipCustomers = Object.entries(customerTotals)
  .filter(([_, total]) => total >= 500)
  .sort((a, b) => b[1] - a[1])
  .map(([name, total]) => ({ customer: name, totalSpent: \`$\${total.toLocaleString()}\` }));

console.log("📊 Category Revenue Breakdown:", categoryRevenue);
console.log("⭐ Top VIP Customers:", vipCustomers);
console.log("✅ Total Pipeline Revenue: $" + completed.reduce((sum, o) => sum + o.amount, 0).toLocaleString());
`
  },
  {
    id: "lru-cache",
    title: "LRU Cache Implementation",
    category: "Systems & Data Structures",
    language: "javascript",
    description: "Least-Recently-Used (LRU) Cache operating with O(1) get and put operations via Map ordering.",
    code: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    // Refresh access order by re-inserting
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict the least recently used (first element in Map)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log(\`⚠️ Evicted oldest item: [Key: \${oldestKey}]\`);
    }
    this.cache.set(key, value);
  }

  dump() {
    return Array.from(this.cache.entries());
  }
}

console.log("🧠 Testing LRU Cache (Capacity = 3)...");
const lru = new LRUCache(3);

lru.put("auth:token_1", { user: "Bron", role: "admin" });
lru.put("auth:token_2", { user: "Sarah", role: "editor" });
lru.put("auth:token_3", { user: "Alex", role: "viewer" });

console.log("Cache contents:", lru.dump().map(([k, v]) => \`\${k} -> \${v.user}\`));

// Access token_1, refreshing its recency
console.log("Accessing 'auth:token_1':", lru.get("auth:token_1"));

// Insert 4th item, which should evict token_2!
lru.put("auth:token_4", { user: "David", role: "guest" });

console.log("Cache after eviction:", lru.dump().map(([k, v]) => \`\${k} -> \${v.user}\`));
console.log("Is 'auth:token_2' still present?", lru.get("auth:token_2") === -1 ? "No (Evicted ✅)" : "Yes");
`
  },
  {
    id: "benchmarks",
    title: "Sorting & Search Benchmarks",
    category: "Algorithms & Performance",
    language: "javascript",
    description: "Benchmarks Linear Search O(N) vs Binary Search O(log N) across a 100,000 element sorted array.",
    code: `console.log("⏱️ Preparing 100,000 item benchmark array...");
const SIZE = 100000;
const array = Array.from({ length: SIZE }, (_, i) => i * 2);
const target = array[Math.floor(SIZE * 0.85)]; // target near the end

// Linear Search O(N)
function linearSearch(arr, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === val) return i;
  }
  return -1;
}

// Binary Search O(log N)
function binarySearch(arr, val) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (arr[mid] === val) return mid;
    if (arr[mid] < val) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

// 1. Run Linear Search benchmark
const t0 = performance.now();
const linearIdx = linearSearch(array, target);
const t1 = performance.now();

// 2. Run Binary Search benchmark
const t2 = performance.now();
const binaryIdx = binarySearch(array, target);
const t3 = performance.now();

console.log(\`Target value: \${target}\`);
console.log(\`Linear Search index: \${linearIdx} (Duration: \${(t1 - t0).toFixed(4)} ms)\`);
console.log(\`Binary Search index: \${binaryIdx} (Duration: \${(t3 - t2).toFixed(4)} ms)\`);
console.log(\`🚀 Binary search is ~ \${Math.max(1, Math.round((t1 - t0) / Math.max(0.0001, t3 - t2)))}x faster!\`);
`
  }
];

interface LogEntry {
  type: "log" | "warn" | "error" | "info";
  args: string[];
  time: string;
}

export default function CodePlay() {
  const { systemSounds, notify } = useOS();
  const [snippetsList, setSnippetsList] = useState<Snippet[]>(FALLBACK_SNIPPETS);
  const [activeSnippetId, setActiveSnippetId] = useState<string>("array-pipeline");
  const [code, setCode] = useState<string>(FALLBACK_SNIPPETS[0].code);
  const [outputLogs, setOutputLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifiedInfo, setVerifiedInfo] = useState<any | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Fetch snippets from backend API
  useEffect(() => {
    fetch(`${API_URL}/api/snippets`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSnippetsList(data);
          const first = data[0];
          setActiveSnippetId(first.id);
          setCode(first.code);
        }
      })
      .catch(() => {});
  }, []);

  const activeSnippet = snippetsList.find((s) => s.id === activeSnippetId) || snippetsList[0];

  const handleSelectSnippet = (snippet: Snippet) => {
    if (systemSounds) soundFx.playClick();
    setActiveSnippetId(snippet.id);
    setCode(snippet.code);
    setOutputLogs([]);
    setExecTime(null);
    setVerifiedInfo(null);
  };

  const handleSyncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Run on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runCode();
      return;
    }

    // Support Tab indent
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = code.substring(0, start) + "  " + code.substring(end);
      setCode(updated);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const runCode = async () => {
    if (systemSounds) soundFx.playPop();
    setIsRunning(true);
    setOutputLogs([]);
    setExecTime(null);

    const logs: LogEntry[] = [];
    const getTime = () => new Date().toLocaleTimeString([], { hour12: false });

    // Capture console methods safely
    const customConsole = {
      log: (...args: any[]) => {
        logs.push({
          type: "log",
          args: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))),
          time: getTime(),
        });
      },
      warn: (...args: any[]) => {
        logs.push({
          type: "warn",
          args: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))),
          time: getTime(),
        });
      },
      error: (...args: any[]) => {
        logs.push({
          type: "error",
          args: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))),
          time: getTime(),
        });
      },
      info: (...args: any[]) => {
        logs.push({
          type: "info",
          args: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))),
          time: getTime(),
        });
      },
    };

    const startTime = performance.now();

    try {
      // Evaluate within a safe function closure passing intercepted console
      const runner = new Function("console", `"use strict";\n${code}`);
      const result = runner(customConsole);

      if (result instanceof Promise) {
        await result;
      }
    } catch (err: any) {
      customConsole.error(`Runtime Error: ${err.message || String(err)}`);
    }

    const endTime = performance.now();
    setExecTime(Math.round((endTime - startTime) * 100) / 100);
    setOutputLogs(logs);
    setIsRunning(false);

    // Call backend analysis endpoint
    fetch(`${API_URL}/api/snippets/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, id: activeSnippetId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setVerifiedInfo(data.metrics);
      })
      .catch(() => {});
  };

  const copyCode = () => {
    if (systemSounds) soundFx.playPop();
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notify("Code Copied", "Snippet copied to clipboard.");
  };

  const downloadSnippet = () => {
    if (systemSounds) soundFx.playPop();
    const blob = new Blob([code], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSnippetId}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("Downloaded", `Exported ${activeSnippetId}.js.`);
  };

  const resetCurrentSnippet = () => {
    if (systemSounds) soundFx.playClose();
    if (activeSnippet) {
      setCode(activeSnippet.code);
      setOutputLogs([]);
      setExecTime(null);
    }
  };

  const lines = code.split("\n");

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white select-none">
      {/* Top Header Bar */}
      <div className="px-3.5 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-black/25">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <GIconCode size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-semibold text-white truncate">{activeSnippet.title}</h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/60 font-mono">
                {activeSnippet.category}
              </span>
            </div>
            <p className="text-[10px] text-white/45 truncate hidden sm:block">
              {activeSnippet.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={resetCurrentSnippet}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
            title="Reset to Original Template"
          >
            <GIconRotateRight size={13} />
          </button>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/80 transition"
            title="Copy Code"
          >
            {copied ? <GIconCheck size={13} className="text-emerald-400" /> : <GIconCopy size={13} />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            onClick={downloadSnippet}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
            title="Export .js"
          >
            <GIconDownload size={13} />
          </button>
          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:brightness-110 active:scale-95 text-xs font-semibold text-white shadow-md shadow-accent/25 transition ml-1"
          >
            <GIconPlay size={13} />
            <span>{isRunning ? "Running..." : "Run (⌘Enter)"}</span>
          </button>
        </div>
      </div>

      {/* Snippet Selection Strip */}
      <div className="px-3 py-1.5 bg-black/40 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto thin-scroll">
        <span className="text-[10px] uppercase font-mono text-white/40 mr-1 shrink-0">Templates:</span>
        {snippetsList.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelectSnippet(s)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${
              activeSnippetId === s.id
                ? "bg-accent text-white shadow-sm"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Main Workspace (Editor + Output Split Pane) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left Side: Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#0d0e15]">
          <div className="flex-1 relative flex overflow-hidden">
            {/* Line Numbers Gutter */}
            <div
              ref={lineNumbersRef}
              className="w-10 sm:w-12 py-3 bg-black/30 border-r border-white/5 text-right pr-2 text-white/25 font-mono text-xs select-none overflow-hidden leading-relaxed"
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleSyncScroll}
              onKeyDown={handleKeyDown}
              spellCheck="false"
              autoComplete="off"
              autoCapitalize="off"
              className="flex-1 h-full p-3 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed outline-none resize-none thin-scroll allow-select whitespace-pre"
            />
          </div>

          {/* Editor Status Bar */}
          <div className="px-3 py-1 bg-black/20 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
            <span>{lines.length} lines · JavaScript (ESNext)</span>
            {verifiedInfo && (
              <span className="text-emerald-400">
                Verified {verifiedInfo.estimatedComplexity} · {verifiedInfo.hasAsync ? "Async" : "Sync"}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Output Terminal Console */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-black/40 min-h-[160px] md:min-h-0">
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <GIconTerminal size={14} className="text-accent" />
              <span className="font-semibold">Execution Output</span>
              {execTime !== null && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                  ⏱️ {execTime} ms
                </span>
              )}
            </div>
            {outputLogs.length > 0 && (
              <button
                onClick={() => setOutputLogs([])}
                className="text-white/40 hover:text-rose-400 p-1 rounded transition"
                title="Clear Output"
              >
                <GIconTrash size={12} />
              </button>
            )}
          </div>

          {/* Console Log Lines */}
          <div className="flex-1 p-3 overflow-y-auto thin-scroll space-y-1.5 font-mono text-xs select-text">
            {outputLogs.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-xs">
                Press <span className="text-accent font-semibold">Run</span> to execute code and view output.
              </div>
            ) : (
              outputLogs.map((log, idx) => {
                const color =
                  log.type === "error"
                    ? "text-rose-400"
                    : log.type === "warn"
                    ? "text-amber-300"
                    : "text-white/85";

                return (
                  <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-[9px] text-white/25 mt-0.5 shrink-0">{log.time}</span>
                    <pre className={`whitespace-pre-wrap break-all ${color}`}>
                      {log.args.join(" ")}
                    </pre>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
