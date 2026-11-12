import { useState, useEffect, useRef, useCallback } from "react";
import {
  GIconPlay,
  GIconRotateRight,
  GIconCopy,
  GIconCheck,
  GIconDownload,
  GIconCode,
  GIconTerminal,
  GIconTrash,
  GIconEye,
  GIconLayoutColumns,
  GIconClock,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { soundFx } from "../../lib/soundFx";
import { useOS } from "../../store/useOS";
import { useIsMobile } from "../../lib/useMediaQuery";
import {
  type SupportedLanguage,
  type LogEntry,
  type SqlResult,
  buildWebPreviewDoc,
  executeJavaScript,
  executePython,
  executeSql,
  renderMarkdownToHtml,
} from "../../lib/codeRunner";
import {
  LANGUAGE_OPTIONS,
  TEMPLATES,
  type CodeTemplate,
} from "../../data/codeTemplates";

type WebTab = "html" | "css" | "js";
type ViewMode = "split" | "editor" | "preview" | "console";
type ViewportSize = "desktop" | "tablet" | "mobile";

const SHORT_LANG_LABELS: Record<SupportedLanguage, string> = {
  web: "Web",
  javascript: "JS",
  typescript: "TS",
  python: "Python",
  sql: "SQL",
  markdown: "MD",
};

export default function CodePlay() {
  const { systemSounds, notify } = useOS();
  const isMobile = useIsMobile();

  // Active language
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>("web");
  const [activeTemplateId, setActiveTemplateId] = useState<string>("web-glass-card");

  // Web sandbox states (HTML, CSS, JS)
  const [htmlCode, setHtmlCode] = useState<string>(TEMPLATES[0].html || "");
  const [cssCode, setCssCode] = useState<string>(TEMPLATES[0].css || "");
  const [jsCode, setJsCode] = useState<string>(TEMPLATES[0].js || "");
  const [activeWebTab, setActiveWebTab] = useState<WebTab>("html");
  const [webSrcDoc, setWebSrcDoc] = useState<string>("");
  const [autoRunWeb, setAutoRunWeb] = useState<boolean>(true);

  // Script code states for non-web languages (persisted per language)
  const [scriptCodes, setScriptCodes] = useState<Record<SupportedLanguage, string>>({
    web: "",
    javascript: TEMPLATES.find((t) => t.language === "javascript")?.code || "",
    typescript: TEMPLATES.find((t) => t.language === "typescript")?.code || "",
    python: TEMPLATES.find((t) => t.language === "python")?.code || "",
    sql: TEMPLATES.find((t) => t.language === "sql")?.code || "",
    markdown: TEMPLATES.find((t) => t.language === "markdown")?.code || "",
  });

  // UI / Display mode
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "editor" : "split"
  );
  const [viewport, setViewport] = useState<ViewportSize>("desktop");

  // Console & Execution Results
  const [outputLogs, setOutputLogs] = useState<LogEntry[]>([]);
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Effective view mode for mobile vs desktop
  const effectiveView: ViewMode = isMobile && viewMode === "split" ? "editor" : viewMode;

  // DOM Refs for synchronized line-number scrolling
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const autoRunTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize Web Sandbox srcDoc on mount
  useEffect(() => {
    const initialDoc = buildWebPreviewDoc(htmlCode, cssCode, jsCode);
    setWebSrcDoc(initialDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for console logs routed from the sandboxed iframe
  useEffect(() => {
    const handleFrameMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "CODEPLAY_CONSOLE") {
        const { logType, args } = event.data;
        const getTime = () => new Date().toLocaleTimeString([], { hour12: false });
        setOutputLogs((prev) => [
          ...prev,
          {
            type: logType || "log",
            args: Array.isArray(args) ? args : [String(args)],
            time: getTime(),
          },
        ]);
      }
    };

    window.addEventListener("message", handleFrameMessage);
    return () => window.removeEventListener("message", handleFrameMessage);
  }, []);

  // Filter templates for current language
  const availableTemplates = TEMPLATES.filter((t) => t.language === selectedLang);
  const activeTemplate =
    TEMPLATES.find((t) => t.id === activeTemplateId) || availableTemplates[0];

  // Debounced Auto-refresh for Web sandbox
  const triggerWebAutoRun = useCallback(
    (h: string, c: string, j: string) => {
      if (!autoRunWeb) return;
      if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
      autoRunTimerRef.current = setTimeout(() => {
        setWebSrcDoc(buildWebPreviewDoc(h, c, j));
      }, 400);
    },
    [autoRunWeb]
  );

  // Switch Language
  const handleSelectLanguage = (lang: SupportedLanguage) => {
    if (systemSounds) soundFx.playClick();
    setSelectedLang(lang);
    const firstMatching = TEMPLATES.find((t) => t.language === lang);
    if (firstMatching) {
      setActiveTemplateId(firstMatching.id);
    }
    setOutputLogs([]);
    setExecTime(null);
    setSqlResult(null);

    // Default view mode: on mobile always start in editor; on desktop default to split
    if (isMobile) {
      setViewMode("editor");
    } else if (lang === "web" || lang === "markdown") {
      setViewMode("split");
    }
  };

  // Switch Template
  const handleSelectTemplate = (template: CodeTemplate) => {
    if (systemSounds) soundFx.playClick();
    setActiveTemplateId(template.id);
    setOutputLogs([]);
    setExecTime(null);
    setSqlResult(null);

    if (template.language === "web") {
      const h = template.html || "";
      const c = template.css || "";
      const j = template.js || "";
      setHtmlCode(h);
      setCssCode(c);
      setJsCode(j);
      setWebSrcDoc(buildWebPreviewDoc(h, c, j));
    } else {
      setScriptCodes((prev) => ({
        ...prev,
        [template.language]: template.code || "",
      }));
    }
  };

  // Reset current snippet / editor
  const handleReset = () => {
    if (systemSounds) soundFx.playClose();
    if (!activeTemplate) return;

    if (selectedLang === "web") {
      const h = activeTemplate.html || "";
      const c = activeTemplate.css || "";
      const j = activeTemplate.js || "";
      setHtmlCode(h);
      setCssCode(c);
      setJsCode(j);
      setWebSrcDoc(buildWebPreviewDoc(h, c, j));
    } else {
      setScriptCodes((prev) => ({
        ...prev,
        [selectedLang]: activeTemplate.code || "",
      }));
    }
    setOutputLogs([]);
    setExecTime(null);
    setSqlResult(null);
  };

  // Get current active editor code string
  const getCurrentCode = (): string => {
    if (selectedLang === "web") {
      if (activeWebTab === "html") return htmlCode;
      if (activeWebTab === "css") return cssCode;
      return jsCode;
    }
    return scriptCodes[selectedLang] || "";
  };

  // Update current active editor code string
  const handleCodeChange = (val: string) => {
    if (selectedLang === "web") {
      if (activeWebTab === "html") {
        setHtmlCode(val);
        triggerWebAutoRun(val, cssCode, jsCode);
      } else if (activeWebTab === "css") {
        setCssCode(val);
        triggerWebAutoRun(htmlCode, val, jsCode);
      } else {
        setJsCode(val);
        triggerWebAutoRun(htmlCode, cssCode, val);
      }
    } else {
      setScriptCodes((prev) => ({ ...prev, [selectedLang]: val }));
    }
  };

  // Synchronize textarea scroll to line numbers gutter
  const handleSyncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Key handling: Ctrl+Enter / Cmd+Enter to run, Tab indent
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runActiveCode();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const current = getCurrentCode();
      const updated = current.substring(0, start) + "  " + current.substring(end);
      handleCodeChange(updated);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Execute Code based on active language
  const runActiveCode = async () => {
    if (systemSounds) soundFx.playPop();
    setIsRunning(true);
    setExecTime(null);

    // On mobile, auto-switch to preview or console so output is immediately visible
    if (isMobile) {
      if (selectedLang === "web" || selectedLang === "markdown") {
        setViewMode("preview");
      } else {
        setViewMode("console");
      }
    }

    if (selectedLang === "web") {
      setOutputLogs([]);
      const doc = buildWebPreviewDoc(htmlCode, cssCode, jsCode);
      setWebSrcDoc(doc);
      setIsRunning(false);
      setExecTime(12);
      return;
    }

    const currentScript = scriptCodes[selectedLang] || "";

    if (selectedLang === "javascript" || selectedLang === "typescript") {
      const isTs = selectedLang === "typescript";
      const { logs, durationMs } = await executeJavaScript(currentScript, isTs);
      setOutputLogs(logs);
      setExecTime(durationMs);
      setIsRunning(false);

      // Backend AST and complexity analysis enrichment
      fetch(`${API_URL}/api/snippets/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentScript, id: activeTemplateId }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.metrics) {
            const timeStr = new Date().toLocaleTimeString([], { hour12: false });
            setOutputLogs((prev) => [
              ...prev,
              {
                type: "info",
                args: [`Server Verified · Complexity: ${data.metrics.estimatedComplexity} · ${data.lines} lines`],
                time: timeStr
              }
            ]);
          }
        })
        .catch(() => {});
      return;
    }

    if (selectedLang === "python") {
      const { logs, durationMs } = await executePython(currentScript);
      setOutputLogs(logs);
      setExecTime(durationMs);
      setIsRunning(false);
      return;
    }

    if (selectedLang === "sql") {
      const { result, logs, durationMs } = executeSql(currentScript);
      setOutputLogs(logs);
      setSqlResult(result || null);
      setExecTime(durationMs);
      setIsRunning(false);
      return;
    }

    if (selectedLang === "markdown") {
      setIsRunning(false);
      setExecTime(5);
    }
  };

  // Copy code to clipboard
  const handleCopy = () => {
    if (systemSounds) soundFx.playPop();
    let textToCopy = "";
    if (selectedLang === "web") {
      textToCopy = `<!-- HTML -->\n${htmlCode}\n\n/* CSS */\n${cssCode}\n\n// JavaScript\n${jsCode}`;
    } else {
      textToCopy = scriptCodes[selectedLang] || "";
    }

    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download / Export snippet
  const handleDownload = () => {
    if (systemSounds) soundFx.playPop();
    let content = "";
    let filename = `${activeTemplateId || "snippet"}`;
    let mimeType = "text/plain";

    if (selectedLang === "web") {
      content = buildWebPreviewDoc(htmlCode, cssCode, jsCode);
      filename += ".html";
      mimeType = "text/html";
    } else {
      content = scriptCodes[selectedLang] || "";
      const ext =
        LANGUAGE_OPTIONS.find((l) => l.id === selectedLang)?.extension || ".txt";
      filename += ext;
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("Exported", `Saved ${filename} to downloads.`);
  };

  const currentCode = getCurrentCode();
  const lines = currentCode.split("\n");

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white select-none">
      {/* 1. TOP HEADER & CONTROLS (Sticky Header) */}
      <div className="px-2.5 sm:px-3.5 py-2 border-b border-white/10 flex items-center justify-between gap-1.5 sm:gap-2 bg-[#0a0a0f]/95 backdrop-blur-md shrink-0 sticky top-0 z-20 shadow-sm">
        {/* Title & Info */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <GIconCode size={15} />
          </div>
          <div className="min-w-0 max-w-[120px] xs:max-w-[170px] sm:max-w-xs md:max-w-none">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-semibold text-white truncate">
                {activeTemplate?.title || "Code Playground"}
              </h2>
              <span className="hidden xs:inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/70 font-mono shrink-0">
                {LANGUAGE_OPTIONS.find((l) => l.id === selectedLang)?.badge}
              </span>
            </div>
            <p className="text-[10px] text-white/45 truncate hidden md:block">
              {activeTemplate?.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Desktop View Mode Toggle (Hidden on mobile) */}
          <div className="hidden md:flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 mr-1">
            <button
              onClick={() => setViewMode("split")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                viewMode === "split"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white"
              }`}
              title="Split Editor & Output"
            >
              <GIconLayoutColumns size={12} />
              <span>Split</span>
            </button>
            {(selectedLang === "web" || selectedLang === "markdown") && (
              <button
                onClick={() => setViewMode("preview")}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                  viewMode === "preview"
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:text-white"
                }`}
                title="Preview Only"
              >
                <GIconEye size={12} />
                <span>Preview</span>
              </button>
            )}
            <button
              onClick={() => setViewMode("console")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                viewMode === "console"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white"
              }`}
              title="Console Logs"
            >
              <GIconTerminal size={12} />
              <span>Console</span>
            </button>
          </div>

          {/* Reset Template */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
            title="Reset to Template"
          >
            <GIconRotateRight size={13} />
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/80 transition"
            title="Copy Code"
          >
            {copied ? (
              <GIconCheck size={13} className="text-emerald-400" />
            ) : (
              <GIconCopy size={13} />
            )}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Export / Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
            title="Export / Download File"
          >
            <GIconDownload size={13} />
          </button>

          {/* Run / Execute Button */}
          <button
            onClick={runActiveCode}
            disabled={isRunning}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-accent hover:brightness-110 active:scale-95 text-xs font-semibold text-white shadow-md shadow-accent/25 transition ml-0.5"
            title="Execute Code (⌘+Enter)"
          >
            <GIconPlay size={13} />
            <span className="inline sm:hidden">{isRunning ? "..." : "Run"}</span>
            <span className="hidden sm:inline">{isRunning ? "Running..." : "Run (⌘Enter)"}</span>
          </button>
        </div>
      </div>

      {/* 2. LANGUAGE SELECTOR BAR */}
      <div className="px-2.5 sm:px-3 py-1.5 bg-black/50 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto thin-scroll">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] uppercase font-mono text-white/40 mr-1 hidden xs:inline">
            Lang:
          </span>
          {LANGUAGE_OPTIONS.map((lang) => {
            const isActive = selectedLang === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => handleSelectLanguage(lang.id)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${
                  isActive
                    ? "bg-accent text-white shadow-sm font-semibold"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="sm:hidden">{SHORT_LANG_LABELS[lang.id]}</span>
                <span className="hidden sm:inline">{lang.label}</span>
              </button>
            );
          })}
        </div>

        {/* Web Auto-Run Toggle */}
        {selectedLang === "web" && (
          <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-white/50 cursor-pointer select-none shrink-0 hover:text-white/80 ml-auto">
            <input
              type="checkbox"
              checked={autoRunWeb}
              onChange={(e) => setAutoRunWeb(e.target.checked)}
              className="accent-accent rounded w-3.5 h-3.5"
            />
            <span className="hidden xs:inline">Live Auto-Update</span>
            <span className="xs:hidden">Live</span>
          </label>
        )}
      </div>

      {/* 3A. DESKTOP TEMPLATES STRIP (md+) */}
      {availableTemplates.length > 0 && (
        <div className="hidden md:flex px-3 py-1.5 bg-black/25 border-b border-white/5 items-center gap-1.5 overflow-x-auto thin-scroll">
          <span className="text-[10px] uppercase font-mono text-white/40 mr-1 shrink-0 flex items-center gap-1">
            <GIconCode size={11} className="text-accent" />
            Templates:
          </span>
          {availableTemplates.map((t) => {
            const isActive = activeTemplateId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition shrink-0 ${
                  isActive
                    ? "bg-white/15 text-white border border-white/15"
                    : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                {t.title}
              </button>
            );
          })}
        </div>
      )}

      {/* 3B. MOBILE TOOLBAR: TEMPLATE DROPDOWN + VIEW SWITCHER (< md) */}
      <div className="md:hidden px-2.5 py-1.5 bg-black/30 border-b border-white/10 flex items-center justify-between gap-2">
        {/* Template Select Dropdown */}
        {availableTemplates.length > 0 && (
          <div className="relative flex-1 min-w-0 max-w-[190px]">
            <select
              value={activeTemplateId}
              onChange={(e) => {
                const found = availableTemplates.find((t) => t.id === e.target.value);
                if (found) handleSelectTemplate(found);
              }}
              className="w-full bg-[#141622] text-white text-[11px] font-medium rounded-lg px-2.5 py-1 border border-white/10 truncate focus:outline-none focus:border-accent appearance-none pr-6 cursor-pointer"
            >
              {availableTemplates.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#12131a] text-white">
                  {t.title}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/40 text-[9px]">
              ▼
            </div>
          </div>
        )}

        {/* Mobile View Switcher Segmented Control */}
        <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setViewMode("editor")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
              effectiveView === "editor"
                ? "bg-accent text-white shadow-sm font-semibold"
                : "text-white/60 hover:text-white"
            }`}
          >
            <GIconCode size={12} />
            <span>Code</span>
          </button>

          {(selectedLang === "web" || selectedLang === "markdown") && (
            <button
              onClick={() => setViewMode("preview")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                effectiveView === "preview"
                  ? "bg-accent text-white shadow-sm font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <GIconEye size={12} />
              <span>Preview</span>
            </button>
          )}

          {selectedLang !== "markdown" && (
            <button
              onClick={() => setViewMode("console")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                effectiveView === "console"
                  ? "bg-accent text-white shadow-sm font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <GIconTerminal size={12} />
              <span>{selectedLang === "sql" ? "Table" : "Console"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. WEB SUB-TABS (When in Web Mode & In Editor View) */}
      {selectedLang === "web" && (isMobile ? effectiveView === "editor" : viewMode !== "preview") && (
        <div className="px-2.5 sm:px-3 py-1 bg-[#0b0c12] border-b border-white/10 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveWebTab("html")}
              className={`px-2.5 sm:px-3 py-1 rounded-t-lg transition flex items-center gap-1.5 ${
                activeWebTab === "html"
                  ? "bg-[#0d0e15] text-amber-300 font-semibold border-b-2 border-amber-400"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              index.html
            </button>
            <button
              onClick={() => setActiveWebTab("css")}
              className={`px-2.5 sm:px-3 py-1 rounded-t-lg transition flex items-center gap-1.5 ${
                activeWebTab === "css"
                  ? "bg-[#0d0e15] text-sky-300 font-semibold border-b-2 border-sky-400"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              style.css
            </button>
            <button
              onClick={() => setActiveWebTab("js")}
              className={`px-2.5 sm:px-3 py-1 rounded-t-lg transition flex items-center gap-1.5 ${
                activeWebTab === "js"
                  ? "bg-[#0d0e15] text-yellow-300 font-semibold border-b-2 border-yellow-400"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              script.js
            </button>
          </div>

          {/* Quick Preview shortcut on mobile */}
          <button
            onClick={() => setViewMode("preview")}
            className="md:hidden flex items-center gap-1 text-[11px] text-accent hover:underline font-sans px-1"
          >
            <span>Preview</span>
            <span>↗</span>
          </button>
        </div>
      )}

      {/* 5. MAIN WORKSPACE (EDITOR + PREVIEW/OUTPUT) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* LEFT PANE: CODE EDITOR */}
        {(isMobile ? effectiveView === "editor" : viewMode !== "preview") && (
          <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#0d0e15]">
            <div className="flex-1 relative flex overflow-hidden">
              {/* Line Numbers Gutter */}
              <div
                ref={lineNumbersRef}
                className="w-8 sm:w-12 py-2.5 sm:py-3 bg-black/35 border-r border-white/5 text-right pr-1.5 sm:pr-2 text-white/25 font-mono text-[11px] sm:text-xs select-none overflow-hidden leading-relaxed"
              >
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code Input Textarea */}
              <textarea
                ref={textareaRef}
                value={currentCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onScroll={handleSyncScroll}
                onKeyDown={handleKeyDown}
                spellCheck="false"
                autoComplete="off"
                autoCapitalize="off"
                placeholder={
                  selectedLang === "web"
                    ? `Enter ${activeWebTab.toUpperCase()} code here...`
                    : `Write your ${selectedLang} code here...`
                }
                className="flex-1 h-full p-2.5 sm:p-3 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed outline-none resize-none thin-scroll allow-select whitespace-pre"
              />
            </div>

            {/* Status Bar */}
            <div className="px-3 py-1 bg-black/30 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
              <div className="flex items-center gap-2">
                <span>
                  {lines.length} lines · {currentCode.length} chars
                </span>
                <span>·</span>
                <span className="text-white/60">
                  {selectedLang === "web"
                    ? `web / ${activeWebTab}`
                    : LANGUAGE_OPTIONS.find((l) => l.id === selectedLang)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-white/30">⌘ + Enter to execute</span>
                {isMobile && (
                  <button
                    onClick={() => {
                      if (selectedLang === "web" || selectedLang === "markdown") {
                        setViewMode("preview");
                      } else {
                        setViewMode("console");
                      }
                    }}
                    className="sm:hidden text-accent text-[10px] font-sans hover:underline flex items-center gap-0.5"
                  >
                    <span>View Output</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT PANE: PREVIEW / OUTPUT CONSOLE / SQL TABLE */}
        {(isMobile ? effectiveView !== "editor" : viewMode !== "editor") && (
          <div
            className={`${
              viewMode === "preview" || isMobile ? "flex-1 w-full" : "w-full md:w-1/2 lg:w-7/12"
            } flex flex-col bg-black/40 min-h-0 relative overflow-hidden`}
          >
            {/* Header Bar for Output Pane */}
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-2 text-xs text-white/80">
                {isMobile && (
                  <button
                    onClick={() => setViewMode("editor")}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[11px] text-white/90 mr-1 transition"
                  >
                    <span>‹</span>
                    <span>Code</span>
                  </button>
                )}
                {selectedLang === "web" && effectiveView !== "console" ? (
                  <>
                    <GIconEye size={14} className="text-accent" />
                    <span className="font-semibold text-xs">Live Sandbox Preview</span>
                  </>
                ) : selectedLang === "markdown" ? (
                  <>
                    <GIconEye size={14} className="text-accent" />
                    <span className="font-semibold text-xs">Markdown Rendered View</span>
                  </>
                ) : selectedLang === "sql" ? (
                  <>
                    <GIconTerminal size={14} className="text-accent" />
                    <span className="font-semibold text-xs">SQL Result & Logs</span>
                  </>
                ) : (
                  <>
                    <GIconTerminal size={14} className="text-accent" />
                    <span className="font-semibold text-xs">Output Terminal</span>
                  </>
                )}

                {execTime !== null && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-mono">
                    <GIconClock size={10} />
                    <span>{execTime} ms</span>
                  </span>
                )}
              </div>

              {/* Controls for Web / Terminal */}
              <div className="flex items-center gap-2">
                {/* Responsive Device Toggles for Web Preview (Hidden on mobile) */}
                {selectedLang === "web" && effectiveView !== "console" && (
                  <div className="hidden sm:flex items-center bg-black/50 border border-white/10 rounded-md p-0.5 text-[10px] font-mono">
                    <button
                      onClick={() => setViewport("desktop")}
                      className={`px-1.5 py-0.5 rounded ${
                        viewport === "desktop"
                          ? "bg-white/20 text-white"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      100%
                    </button>
                    <button
                      onClick={() => setViewport("tablet")}
                      className={`px-1.5 py-0.5 rounded ${
                        viewport === "tablet"
                          ? "bg-white/20 text-white"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      768px
                    </button>
                    <button
                      onClick={() => setViewport("mobile")}
                      className={`px-1.5 py-0.5 rounded ${
                        viewport === "mobile"
                          ? "bg-white/20 text-white"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      375px
                    </button>
                  </div>
                )}

                {/* Clear Output logs */}
                {outputLogs.length > 0 && (
                  <button
                    onClick={() => setOutputLogs([])}
                    className="text-white/40 hover:text-rose-400 p-1 rounded transition"
                    title="Clear Console Output"
                  >
                    <GIconTrash size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
              {/* A. WEB SANDBOX PREVIEW */}
              {selectedLang === "web" && effectiveView !== "console" && (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#090a10] p-1.5 sm:p-2 overflow-auto">
                  <div
                    className={`h-full transition-all duration-300 rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-[#0f111a] flex flex-col ${
                      viewport === "desktop" || isMobile
                        ? "w-full"
                        : viewport === "tablet"
                        ? "w-[768px] max-w-full"
                        : "w-[375px] max-w-full"
                    }`}
                  >
                    {/* Optional Browser Chrome Bar for tablet/mobile frame on desktop */}
                    {!isMobile && viewport !== "desktop" && (
                      <div className="px-3 py-1.5 bg-black/60 border-b border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500/80"></span>
                          <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
                        </div>
                        <span>
                          {viewport === "tablet" ? "Tablet View (768px)" : "Mobile View (375px)"}
                        </span>
                        <span>100%</span>
                      </div>
                    )}

                    <iframe
                      title="CodePlay Web Preview"
                      sandbox="allow-scripts allow-modals"
                      srcDoc={webSrcDoc}
                      className="w-full flex-1 border-none bg-[#0f111a]"
                    />
                  </div>
                </div>
              )}

              {/* B. MARKDOWN LIVE PREVIEW */}
              {selectedLang === "markdown" && (
                <div
                  className="flex-1 p-4 sm:p-6 overflow-y-auto thin-scroll text-white/90 font-sans leading-relaxed select-text"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdownToHtml(scriptCodes.markdown || ""),
                  }}
                />
              )}

              {/* C. SQL TABULAR RESULT & LOGS */}
              {selectedLang === "sql" && (
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto thin-scroll p-3 space-y-3">
                  {sqlResult ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span className="font-semibold text-emerald-400">
                          {sqlResult.message}
                        </span>
                        <span className="font-mono text-[10px]">
                          {sqlResult.rowCount} {sqlResult.rowCount === 1 ? "row" : "rows"}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 shadow-inner">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-white/5 border-b border-white/10 text-white/80 font-mono">
                            <tr>
                              {sqlResult.columns.map((col, idx) => (
                                <th key={idx} className="px-3 py-2 font-semibold">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                            {sqlResult.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-white/[0.03] transition">
                                {sqlResult.columns.map((col, cIdx) => (
                                  <td key={cIdx} className="px-3 py-1.5 text-white/70">
                                    {row[col] !== undefined && row[col] !== null
                                      ? String(row[col])
                                      : "NULL"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-white/30 text-xs">
                      Run your SQL statements above to view the tabular result grid.
                    </div>
                  )}

                  {/* SQL execution output logs */}
                  {outputLogs.length > 0 && (
                    <div className="pt-2 border-t border-white/10 space-y-1 font-mono text-xs">
                      <div className="text-[10px] text-white/40 uppercase font-mono mb-1">
                        Execution Log:
                      </div>
                      {outputLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`text-xs ${
                            log.type === "error"
                              ? "text-rose-400"
                              : log.type === "warn"
                              ? "text-amber-300"
                              : "text-emerald-300"
                          }`}
                        >
                          {log.args.join(" ")}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* D. JAVASCRIPT / TYPESCRIPT / PYTHON & WEB CONSOLE DRAWER */}
              {(selectedLang === "javascript" ||
                selectedLang === "typescript" ||
                selectedLang === "python" ||
                (selectedLang === "web" && effectiveView === "console")) && (
                <div className="flex-1 p-3 overflow-y-auto thin-scroll space-y-1.5 font-mono text-xs select-text">
                  {outputLogs.length === 0 ? (
                    <div className="text-center py-12 text-white/30 text-xs">
                      Press <span className="text-accent font-semibold">Run</span> to execute code
                      and inspect output.
                    </div>
                  ) : (
                    outputLogs.map((log, idx) => {
                      const color =
                        log.type === "error"
                          ? "text-rose-400"
                          : log.type === "warn"
                          ? "text-amber-300"
                          : log.type === "info"
                          ? "text-sky-300"
                          : "text-white/85";

                      return (
                        <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-[9px] text-white/25 mt-0.5 shrink-0">
                            {log.time}
                          </span>
                          <pre className={`whitespace-pre-wrap break-all ${color}`}>
                            {log.args.join(" ")}
                          </pre>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}