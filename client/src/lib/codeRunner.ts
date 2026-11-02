/**
 * Universal In-Browser Code Runner & Sandbox Engine
 * Supports HTML/CSS/JS Web Sandbox, JavaScript, TypeScript, Python, SQL, and Markdown
 */

export type SupportedLanguage = "web" | "javascript" | "typescript" | "python" | "sql" | "markdown";

export interface LogEntry {
  type: "log" | "warn" | "error" | "info";
  args: string[];
  time: string;
}

export interface SqlResult {
  columns: string[];
  rows: Record<string, any>[];
  message: string;
  rowCount: number;
}

/**
 * Compiles HTML, CSS, and JS into an executable sandbox HTML document
 */
export function buildWebPreviewDoc(html: string, css: string, js: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      background: #0f111a;
      min-height: 100vh;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    (function() {
      const send = (type, args) => {
        try {
          window.parent.postMessage({
            type: 'CODEPLAY_CONSOLE',
            logType: type,
            args: args.map(a => {
              if (typeof a === 'object') {
                try { return JSON.stringify(a, null, 2); } catch { return String(a); }
              }
              return String(a);
            })
          }, '*');
        } catch (_) {}
      };

      const _log = console.log;
      const _warn = console.warn;
      const _error = console.error;

      console.log = function(...args) { _log.apply(console, args); send('log', args); };
      console.warn = function(...args) { _warn.apply(console, args); send('warn', args); };
      console.error = function(...args) { _error.apply(console, args); send('error', args); };

      window.onerror = function(msg, url, line) {
        send('error', ['[Runtime Error] ' + msg + ' (Line ' + line + ')']);
      };
    })();

    try {
      ${js}
    } catch (err) {
      console.error(err.message || String(err));
    }
  </script>
</body>
</html>`;
}

/**
 * Strip TypeScript type annotations for client-side JavaScript execution
 */
export function stripTypeScriptTypes(tsCode: string): string {
  let js = tsCode;
  // Remove interface declarations
  js = js.replace(/export\s+interface\s+\w+[\s\S]*?\{[\s\S]*?\}/g, "");
  js = js.replace(/interface\s+\w+[\s\S]*?\{[\s\S]*?\}/g, "");
  // Remove type declarations
  js = js.replace(/export\s+type\s+\w+[\s\S]*?;/g, "");
  js = js.replace(/type\s+\w+[\s\S]*?;/g, "");
  // Remove as any / as Type
  js = js.replace(/\s+as\s+[A-Za-z0-9_<>[\]]+/g, "");
  // Remove type annotations on variable declarations (let x: number = 5 -> let x = 5)
  js = js.replace(/:\s*([A-Za-z0-9_<>[\]]+|\{[^}]*\})\s*(=|;|,|\))/g, "$2");
  // Remove return type annotations (function foo(): void -> function foo())
  js = js.replace(/\):\s*[A-Za-z0-9_<>[\]]+\s*\{/g, ") {");
  return js;
}

/**
 * Run JavaScript / TypeScript safely in browser
 */
export async function executeJavaScript(
  code: string,
  isTypeScript = false
): Promise<{ logs: LogEntry[]; durationMs: number; error?: string }> {
  const logs: LogEntry[] = [];
  const getTime = () => new Date().toLocaleTimeString([], { hour12: false });

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

  const processedCode = isTypeScript ? stripTypeScriptTypes(code) : code;
  const startTime = performance.now();
  let errorMsg: string | undefined;

  try {
    const runner = new Function("console", `"use strict";\n${processedCode}`);
    const result = runner(customConsole);
    if (result instanceof Promise) {
      await result;
    }
  } catch (err: any) {
    errorMsg = err.message || String(err);
    customConsole.error(`Runtime Error: ${errorMsg}`);
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
  return { logs, durationMs, error: errorMsg };
}

/**
 * In-memory Python engine: Uses Pyodide if available or fast built-in interpreter
 */
let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

async function getPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if ((window as any).loadPyodide) {
    pyodideInstance = await (window as any).loadPyodide();
    return pyodideInstance;
  }
  if (!pyodideLoadingPromise) {
    pyodideLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
      script.onload = async () => {
        try {
          pyodideInstance = await (window as any).loadPyodide();
          resolve(pyodideInstance);
        } catch (e) {
          reject(e);
        }
      };
      script.onerror = () => reject(new Error("Network offline: Using fallback Python interpreter"));
      document.head.appendChild(script);
    });
  }
  return pyodideLoadingPromise;
}

export async function executePython(
  code: string
): Promise<{ logs: LogEntry[]; durationMs: number; error?: string }> {
  const logs: LogEntry[] = [];
  const getTime = () => new Date().toLocaleTimeString([], { hour12: false });
  const startTime = performance.now();

  try {
    const py = await getPyodide();
    py.setStdout({
      batched: (str: string) => {
        logs.push({ type: "log", args: [str], time: getTime() });
      },
    });
    py.setStderr({
      batched: (str: string) => {
        logs.push({ type: "error", args: [str], time: getTime() });
      },
    });
    const res = await py.runPythonAsync(code);
    if (res !== undefined && res !== null && typeof res !== "function") {
      logs.push({ type: "info", args: [`=> ${String(res)}`], time: getTime() });
    }
  } catch (err: any) {
    // Fallback lightweight evaluator if offline or error
    try {
      executePythonFallback(code, logs, getTime);
    } catch (fallbackErr: any) {
      logs.push({
        type: "error",
        args: [`[Python Error] ${err.message || fallbackErr.message || String(err)}`],
        time: getTime(),
      });
      return { logs, durationMs: Math.round(performance.now() - startTime), error: String(err) };
    }
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
  return { logs, durationMs };
}

function executePythonFallback(code: string, logs: LogEntry[], getTime: () => string) {
  const lines = code.split("\n");
  const scope: Record<string, any> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // print(...)
    const printMatch = line.match(/^print\((.*)\)$/);
    if (printMatch) {
      const expr = printMatch[1];
      let val = "";
      try {
        // evaluate simple expression in JS
        const cleanExpr = expr.replace(/True/g, "true").replace(/False/g, "false").replace(/None/g, "null");
        const fn = new Function(...Object.keys(scope), `return (${cleanExpr})`);
        val = String(fn(...Object.values(scope)));
      } catch {
        val = expr.replace(/^['"]|['"]$/g, "");
      }
      logs.push({ type: "log", args: [val], time: getTime() });
      continue;
    }

    // variable assignment: x = 10
    const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const expr = assignMatch[2];
      try {
        const cleanExpr = expr.replace(/True/g, "true").replace(/False/g, "false").replace(/None/g, "null");
        const fn = new Function(...Object.keys(scope), `return (${cleanExpr})`);
        scope[varName] = fn(...Object.values(scope));
      } catch {
        scope[varName] = expr;
      }
    }
  }
}

/**
 * In-memory SQL execution engine: Supports CREATE, INSERT, SELECT, WHERE, ORDER BY, LIMIT
 */
export function executeSql(script: string): {
  result?: SqlResult;
  logs: LogEntry[];
  durationMs: number;
  error?: string;
} {
  const startTime = performance.now();
  const logs: LogEntry[] = [];
  const getTime = () => new Date().toLocaleTimeString([], { hour12: false });

  const tables: Record<string, { cols: string[]; rows: Record<string, any>[] }> = {};
  const statements = script
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  let lastSelect: SqlResult | undefined;

  try {
    for (const stmt of statements) {
      // 1. CREATE TABLE
      if (/^CREATE\s+TABLE/i.test(stmt)) {
        const match = stmt.match(/CREATE\s+TABLE\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)/i);
        if (match) {
          const tableName = match[1];
          const cols = match[2].split(",").map((c) => c.trim().split(/\s+/)[0]);
          tables[tableName] = { cols, rows: [] };
          logs.push({
            type: "info",
            args: [`✓ Created table "${tableName}" with columns [${cols.join(", ")}]`],
            time: getTime(),
          });
        }
      }
      // 2. INSERT INTO
      else if (/^INSERT\s+INTO/i.test(stmt)) {
        const match = stmt.match(
          /INSERT\s+INTO\s+([a-zA-Z0-9_]+)(?:\s*\(([\s\S]*?)\))?\s+VALUES\s*\(([\s\S]*?)\)/i
        );
        if (match) {
          const tableName = match[1];
          if (!tables[tableName]) {
            throw new Error(`Table "${tableName}" does not exist`);
          }
          const rawVals = match[3]
            .split(",")
            .map((v) => v.trim().replace(/^['"`]|['"`]$/g, ""));
          const row: Record<string, any> = {};
          tables[tableName].cols.forEach((col, idx) => {
            const raw = rawVals[idx] ?? "";
            row[col] = !isNaN(Number(raw)) && raw !== "" ? Number(raw) : raw;
          });
          tables[tableName].rows.push(row);
          logs.push({
            type: "log",
            args: [`✓ Inserted 1 row into "${tableName}"`],
            time: getTime(),
          });
        }
      }
      // 3. SELECT
      else if (/^SELECT/i.test(stmt)) {
        const match = stmt.match(
          /SELECT\s+([\s\S]*?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]*?))?(?:\s+ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i
        );
        if (match) {
          const selColsStr = match[1].trim();
          const tableName = match[2].trim();
          const whereClause = match[3]?.trim();
          const orderCol = match[4]?.trim();
          const orderDir = (match[5] || "ASC").toUpperCase();
          const limitNum = match[6] ? parseInt(match[6], 10) : undefined;

          if (!tables[tableName]) {
            throw new Error(`Table "${tableName}" does not exist`);
          }

          let rows = [...tables[tableName].rows];

          // Filter WHERE
          if (whereClause) {
            const wMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*(=|!=|>|<|>=|<=)\s*(.+)/);
            if (wMatch) {
              const [, col, op, valRaw] = wMatch;
              const val = valRaw.trim().replace(/^['"`]|['"`]$/g, "");
              const numVal = Number(val);
              rows = rows.filter((r) => {
                const rVal = r[col];
                if (!isNaN(numVal) && typeof rVal === "number") {
                  if (op === "=") return rVal === numVal;
                  if (op === "!=") return rVal !== numVal;
                  if (op === ">") return rVal > numVal;
                  if (op === "<") return rVal < numVal;
                  if (op === ">=") return rVal >= numVal;
                  if (op === "<=") return rVal <= numVal;
                }
                return op === "=" ? String(rVal) === val : String(rVal) !== val;
              });
            }
          }

          // Sort ORDER BY
          if (orderCol) {
            rows.sort((a, b) => {
              const valA = a[orderCol];
              const valB = b[orderCol];
              if (valA < valB) return orderDir === "DESC" ? 1 : -1;
              if (valA > valB) return orderDir === "DESC" ? -1 : 1;
              return 0;
            });
          }

          // Limit
          if (limitNum) {
            rows = rows.slice(0, limitNum);
          }

          const cols =
            selColsStr === "*"
              ? tables[tableName].cols
              : selColsStr.split(",").map((c) => c.trim());

          lastSelect = {
            columns: cols,
            rows,
            message: `Selected ${rows.length} rows from "${tableName}"`,
            rowCount: rows.length,
          };

          logs.push({
            type: "info",
            args: [`✓ Query OK: ${rows.length} rows returned`],
            time: getTime(),
          });
        }
      }
    }
  } catch (err: any) {
    logs.push({
      type: "error",
      args: [`[SQL Error] ${err.message || String(err)}`],
      time: getTime(),
    });
    return {
      logs,
      durationMs: Math.round(performance.now() - startTime),
      error: err.message,
    };
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
  return { result: lastSelect, logs, durationMs };
}

/**
 * Lightweight, safe Markdown to HTML renderer for CodePlay
 */
export function renderMarkdownToHtml(md: string): string {
  // Escape HTML entities to prevent malicious script injection
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks: ```lang ... ```
  html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<div class="code-block my-3 rounded-lg overflow-hidden border border-white/10 bg-black/40"><div class="px-3 py-1 bg-white/5 border-b border-white/5 text-[10px] font-mono text-white/50">${lang || "code"}</div><pre class="p-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre"><code>${code}</code></pre></div>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-xs">$1</code>');

  // Headings
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-xs font-semibold text-white/90 mt-3 mb-1.5">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold text-white mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-white mt-4 mb-2 pb-1 border-b border-white/10">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-white mt-5 mb-2.5 pb-1.5 border-b border-white/15">$1</h1>');

  // Blockquotes: > quote
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-2 border-accent pl-3 my-2 text-white/70 italic text-xs">$1</blockquote>');

  // Horizontal rules: ---
  html = html.replace(/^---$/gim, '<hr class="border-white/10 my-3" />');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-white/80">$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del class="line-through text-white/40">$1</del>');

  // Unordered list items: - item
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-white/80 text-xs my-0.5">$1</li>');

  // Ordered list items: 1. item
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-white/80 text-xs my-0.5">$1</li>');

  // Parse tables & paragraphs
  const lines = html.split("\n");
  const parsedLines: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      let tHtml = '<div class="overflow-x-auto my-3"><table class="w-full text-xs text-left border-collapse border border-white/10 rounded-lg overflow-hidden">';
      tableRows.forEach((r, idx) => {
        if (/^\|?(\s*:?-+:?\s*\|)+\s*$/.test(r)) return;
        const cells = r.split("|").slice(1, -1).map((c) => c.trim());
        if (cells.length === 0) return;
        if (idx === 0) {
          tHtml += '<thead class="bg-white/5 border-b border-white/10 text-white/90"><tr>' +
            cells.map((c) => `<th class="px-3 py-2 font-medium">${c}</th>`).join("") +
            "</tr></thead><tbody>";
        } else {
          tHtml += '<tr class="border-b border-white/5 hover:bg-white/[0.02]">' +
            cells.map((c) => `<td class="px-3 py-1.5 text-white/70">${c}</td>`).join("") +
            "</tr>";
        }
      });
      tHtml += "</tbody></table></div>";
      parsedLines.push(tHtml);
      tableRows = [];
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      inTable = true;
      tableRows.push(line.trim());
    } else {
      if (inTable) {
        flushTable();
        inTable = false;
      }
      if (
        line.trim().length > 0 &&
        !line.startsWith("<h") &&
        !line.startsWith("<blockquote") &&
        !line.startsWith("<li") &&
        !line.startsWith("<div") &&
        !line.startsWith("<hr") &&
        !line.startsWith("<table")
      ) {
        parsedLines.push(`<p class="my-1 text-xs text-white/80 leading-relaxed">${line}</p>`);
      } else {
        parsedLines.push(line);
      }
    }
  }
  if (inTable) {
    flushTable();
  }

  return parsedLines.join("\n");
}
