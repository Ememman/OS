import { useState, useRef, useEffect } from "react";
import { useOS, APPS } from "../../store/useOS";
import { fallbackProjects } from "../../data/projects";
import { fileTree } from "../../data/files";
import { API_URL } from "../../lib/config";
import { GIconTerminal, GIconFolder, GIconFileText } from "../icons/GravityIcons";

const BANNER = `
  ██████╗  ██████╗ ██████╗ ████████╗███████╗ ██████╗ ██╗     ██╗ ██████╗      ██████╗ ███████╗
  ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██║     ██║██╔═══██╗    ██╔═══██╗██╔════╝
  ██████╔╝██║   ██║██████╔╝   ██║   █████╗  ██║   ██║██║     ██║██║   ██║    ██║   ██║███████╗
  ██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝  ██║   ██║██║     ██║██║   ██║    ██║   ██║╚════██║
  ██║     ╚██████╔╝██║  ██║   ██║   ██║     ╚██████╔╝███████╗██║╚██████╔╝    ╚██████╔╝███████║
  ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝      ╚═════╝ ╚══════╝
  Type 'help' for available commands or 'neofetch' for system info.
`;

const COMMANDS = [
  "help", "clear", "neofetch", "whoami", "skills", "projects",
  "ls", "cat", "open", "theme", "date", "uptime", "history", "matrix",
  "sysinfo", "server", "ping", "quote", "joke", "curl", "guestbook", "sudo"
];

export default function Terminal() {
  const { openApp, accents, setAccent, wallpapers, setWallpaper, osMode } = useOS();
  const [history, setHistory] = useState([
    { type: "banner", content: BANNER },
    { type: "system", content: "Portfolio OS Kernel v2.4.0 (Gravity Edition) initialized." },
    { type: "system", content: "Logged in as bron@portfolio-os. Type 'help' to start." },
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

  // Keep input focused
  const focusInput = () => {
    if (!matrixActive) inputRef.current?.focus();
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
          <div className="space-y-2 py-1">
            <p className="text-white/90 font-semibold">Available Terminal Commands:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div><span className="text-emerald-400 font-bold">whoami</span> - Developer profile & intro</div>
              <div><span className="text-emerald-400 font-bold">skills</span> - Technical skill stacks</div>
              <div><span className="text-emerald-400 font-bold">projects</span> - Showcase of live projects</div>
              <div><span className="text-emerald-400 font-bold">sysinfo</span> - Live server CPU, RAM & diagnostics</div>
              <div><span className="text-emerald-400 font-bold">ping [host]</span> - Test roundtrip response time</div>
              <div><span className="text-emerald-400 font-bold">quote</span> - Random inspirational tech quote</div>
              <div><span className="text-emerald-400 font-bold">joke</span> - Programmer humor</div>
              <div><span className="text-emerald-400 font-bold">curl [url]</span> - Inspect API endpoints</div>
              <div><span className="text-emerald-400 font-bold">guestbook</span> - Open social guestbook ledger</div>
              <div><span className="text-emerald-400 font-bold">open &lt;app&gt;</span> - Launch any OS app</div>
              <div><span className="text-emerald-400 font-bold">ls / dir</span> - List files and directories</div>
              <div><span className="text-emerald-400 font-bold">cat &lt;file&gt;</span> - Read file contents</div>
              <div><span className="text-emerald-400 font-bold">theme &lt;name&gt;</span> - Switch accent color or wallpaper</div>
              <div><span className="text-emerald-400 font-bold">neofetch</span> - System specs & OS stats</div>
              <div><span className="text-emerald-400 font-bold">matrix</span> - Toggle digital rain effect</div>
              <div><span className="text-emerald-400 font-bold">date</span> - View current system time</div>
              <div><span className="text-emerald-400 font-bold">uptime</span> - Check active session uptime</div>
              <div><span className="text-emerald-400 font-bold">clear</span> - Clear terminal screen</div>
            </div>
            <p className="text-white/40 text-[11px] pt-1">Tip: Use Tab for autocompletion, and ↑/↓ to browse history.</p>
          </div>
        );
        break;

      case "clear":
      case "cls":
        setHistory([]);
        return;

      case "sysinfo":
      case "server":
      case "ping":
      case "quote":
      case "joke":
      case "curl":
        try {
          const res = await fetch(`${API_URL}/api/terminal/exec`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: trimmed })
          });
          const data = await res.json();
          output = (
            <pre className="text-xs text-emerald-300 font-mono py-1 whitespace-pre-wrap leading-relaxed">
              {data.output || data.error}
            </pre>
          );
        } catch {
          output = <p className="text-rose-400 text-xs">Could not reach backend API at {API_URL}.</p>;
        }
        break;

      case "guestbook":
        openApp("guestbook");
        output = <p className="text-emerald-300 text-xs">Launching Guestbook & Social Ledger...</p>;
        break;

      case "whoami":
        output = (
          <div className="space-y-1.5 py-1 text-xs text-white/90">
            <p><span className="text-emerald-400 font-semibold">Name:</span> Bron Mendoza</p>
            <p><span className="text-emerald-400 font-semibold">Role:</span> Full-Stack Developer & Software Engineer</p>
            <p><span className="text-emerald-400 font-semibold">Location:</span> Manila, Philippines</p>
            <p><span className="text-emerald-400 font-semibold">Specialization:</span> MERN Stack, React Native/Expo, PHP MVC, Real-time WebSockets</p>
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

      case "projects":
        output = (
          <div className="space-y-3 py-1 text-xs">
            <p className="text-white/80 font-semibold">Featured Shipped Projects:</p>
            <div className="space-y-2">
              {fallbackProjects.map((p) => (
                <div key={p.id} className="p-2 rounded bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">{p.title}</span>
                    <span className="text-white/40 text-[11px]">{p.year} · {p.category}</span>
                  </div>
                  <p className="text-white/70 text-[11px] mt-1">{p.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.stack.map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/60">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case "open":
        if (!args[0]) {
          output = (
            <p className="text-amber-400">
              Usage: open &lt;app&gt; (e.g. open activity, open guestbook, open music, open library, open games, open settings, open files, open chats)
            </p>
          );
        } else {
          const appName = args[0].toLowerCase();
          const target = Object.keys(APPS).find((k) => k === appName);
          if (target) {
            openApp(target);
            output = <p className="text-emerald-400">Launching {APPS[target].title}…</p>;
          } else {
            output = <p className="text-rose-400">App '{appName}' not found. Available: {Object.keys(APPS).join(", ")}</p>;
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
          output = <p className="text-amber-400">Usage: cat &lt;filename&gt; (e.g. cat About_Bron.txt, cat Skills.txt)</p>;
        } else {
          const targetName = args[0].toLowerCase();
          const found = fileTree.children.find((f) => f.name.toLowerCase() === targetName);
          if (found && found.type === "text" && found.content) {
            output = (
              <pre className="text-xs text-white/80 font-mono whitespace-pre-wrap leading-relaxed py-1">
                {found.content}
              </pre>
            );
          } else {
            output = <p className="text-rose-400">cat: {args[0]}: No such text file</p>;
          }
        }
        break;

      case "neofetch":
        output = (
          <div className="flex flex-col sm:flex-row gap-4 py-2 text-xs">
            <pre className="text-accent font-bold leading-tight select-none shrink-0">
{`   /\_/\  
  ( o.o ) 
   > ^ <  
 Portfolio
   OS 2.4`}
            </pre>
            <div className="space-y-1 text-white/90">
              <p><span className="text-accent font-bold">bron@portfolio-os</span></p>
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

      case "matrix":
        setMatrixActive((prev) => !prev);
        output = <p className="text-emerald-400">Matrix digital rain {!matrixActive ? "activated" : "deactivated"}.</p>;
        break;

      case "date":
        output = <p className="text-white/90">{new Date().toString()}</p>;
        break;

      case "uptime":
        const totalSecs = Math.floor(performance.now() / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        output = <p className="text-white/90">Session up {mins} minutes, {secs} seconds.</p>;
        break;

      case "theme":
        if (!args[0]) {
          output = (
            <div className="space-y-1 text-xs">
              <p className="text-amber-400">Usage: theme accent &lt;number/name&gt; OR theme wallpaper &lt;name&gt;</p>
              <p className="text-white/60">Available accents: {accents.map((a) => a.name).join(", ")}</p>
              <p className="text-white/60">Available wallpapers: {wallpapers.map((w) => w.name).join(", ")}</p>
            </div>
          );
        } else if (args[0] === "accent" && args[1]) {
          const match = accents.find((a) => a.name.toLowerCase().includes(args[1].toLowerCase()));
          if (match) {
            setAccent(match.value);
            output = <p className="text-emerald-400">Accent set to {match.name}.</p>;
          } else {
            output = <p className="text-rose-400">Accent '{args[1]}' not found.</p>;
          }
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

      case "sudo":
        output = <p className="text-rose-400">Permission denied: guest user cannot execute administrative operations.</p>;
        break;

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
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIdx < 0 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx < 0) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIdx(-1);
        setInputVal("");
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (!inputVal) return;
      const match = COMMANDS.find((c) => c.startsWith(inputVal.toLowerCase()));
      if (match) setInputVal(match);
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

      {/* Terminal Header */}
      <div className="relative z-10 flex items-center justify-between px-3 py-1.5 bg-[#05070c] border-b border-white/10 select-none">
        <div className="flex items-center gap-2">
          <GIconTerminal size={14} className="text-emerald-400" />
          <span className="text-[11px] text-white/70 font-semibold">bron@portfolio-os:~ (portfolio-sh)</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/40">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> bash 5.2</span>
          <span>UTF-8</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="relative z-10 flex-1 p-3 sm:p-4 overflow-y-auto thin-scroll space-y-2">
        {history.map((item, idx) => {
          if (item.type === "banner") {
            return (
              <pre key={idx} className="text-[8px] xs:text-[10px] sm:text-[11px] leading-tight text-emerald-400/90 whitespace-pre overflow-x-auto select-none no-scrollbar">
                {item.content}
              </pre>
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
              <div key={idx} className="flex items-start gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] pt-1">
                <span className="text-accent font-semibold shrink-0 hidden sm:inline">bron@portfolio-os:~$</span>
                <span className="text-accent font-semibold shrink-0 sm:hidden">os:~$</span>
                <span className="text-white font-medium">{item.cmd}</span>
              </div>
            );
          }
          if (item.type === "output") {
            return (
              <div key={idx} className="pl-1">
                {item.content}
              </div>
            );
          }
          return null;
        })}

        {/* Current prompt line */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
          <span className="text-accent font-semibold shrink-0 hidden sm:inline">bron@portfolio-os:~$</span>
          <span className="text-accent font-semibold shrink-0 sm:hidden">os:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck="false"
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent text-white outline-none font-mono text-[12px] caret-emerald-400"
          />
        </div>

        <div ref={endRef} />
      </div>

      {/* Quick command buttons for convenience */}
      <div className="relative z-10 px-3 py-1.5 bg-[#05070c]/90 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none">
        <span className="text-[10px] text-white/40 shrink-0">Quick:</span>
        {["help", "sysinfo", "ping", "quote", "joke", "guestbook", "neofetch", "clear"].map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleCommand(cmd)}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] text-white/70 hover:text-white transition-colors shrink-0"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
