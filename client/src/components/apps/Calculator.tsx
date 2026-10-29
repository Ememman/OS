import { useState, useEffect, useCallback } from "react";
import { soundFx } from "../../lib/soundFx";
import { useOS } from "../../store/useOS";
import { GIconHistory, GIconTrash, GIconSliders } from "../icons/GravityIcons";

interface CalcHistoryItem {
  id: string;
  expression: string;
  result: string;
  ts: number;
}

export default function Calculator() {
  const { systemSounds } = useOS();
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [historyTape, setHistoryTape] = useState("");
  const [memory, setMemory] = useState(0);
  const [isScientific, setIsScientific] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [angleUnit, setAngleUnit] = useState<"deg" | "rad">("deg");

  const [historyList, setHistoryList] = useState<CalcHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("os_calc_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("os_calc_history", JSON.stringify(historyList));
    } catch {}
  }, [historyList]);

  const playClick = useCallback(() => {
    if (systemSounds) soundFx.playClick();
  }, [systemSounds]);

  const inputDigit = useCallback((digit: string | number) => {
    playClick();
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? String(digit) : display + digit);
    }
  }, [display, waitingForOperand, playClick]);

  const inputDecimal = useCallback(() => {
    playClick();
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, waitingForOperand, playClick]);

  const clearAll = useCallback(() => {
    playClick();
    setDisplay("0");
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistoryTape("");
  }, [playClick]);

  const toggleSign = useCallback(() => {
    playClick();
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay(String(val * -1));
    }
  }, [display, playClick]);

  const inputPercent = useCallback(() => {
    playClick();
    const current = parseFloat(display);
    if (isNaN(current)) return;
    const result = current / 100;
    setDisplay(String(result));
  }, [display, playClick]);

  const calculate = (a: number, b: number, op: string): number | "Error" => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×":
      case "*": return a * b;
      case "÷":
      case "/": return b !== 0 ? a / b : "Error";
      case "^": return Math.pow(a, b);
      default: return b;
    }
  };

  const performOperation = useCallback((nextOp: string) => {
    playClick();
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setHistoryTape(`${inputValue} ${nextOp}`);
    } else if (operation) {
      const result = calculate(prevValue, inputValue, operation);
      if (result === "Error") {
        setDisplay("Error");
        setPrevValue(null);
        setOperation(null);
        setWaitingForOperand(true);
        return;
      }
      setDisplay(String(result));
      setPrevValue(result);
      setHistoryTape(`${result} ${nextOp}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
  }, [display, prevValue, operation, playClick]);

  const handleEquals = useCallback(() => {
    playClick();
    if (!operation || prevValue === null) return;
    const inputValue = parseFloat(display);
    const result = calculate(prevValue, inputValue, operation);

    if (result === "Error") {
      setDisplay("Error");
    } else {
      const fullExpr = `${prevValue} ${operation} ${inputValue}`;
      setHistoryTape(`${fullExpr} =`);
      setDisplay(String(result));

      // Append to history
      const item: CalcHistoryItem = {
        id: `calc-${Date.now()}`,
        expression: fullExpr,
        result: String(result),
        ts: Date.now()
      };
      setHistoryList((prev) => [item, ...prev.slice(0, 24)]);
    }
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  }, [prevValue, display, operation, playClick]);

  // Scientific Functions
  const handleScientific = (fn: string) => {
    playClick();
    const val = parseFloat(display);
    if (isNaN(val)) return;

    let res: number | "Error" = 0;
    const angle = angleUnit === "deg" ? (val * Math.PI) / 180 : val;

    switch (fn) {
      case "sin": res = Math.sin(angle); break;
      case "cos": res = Math.cos(angle); break;
      case "tan": res = Math.tan(angle); break;
      case "sqrt": res = val >= 0 ? Math.sqrt(val) : "Error"; break;
      case "sq": res = Math.pow(val, 2); break;
      case "inv": res = val !== 0 ? 1 / val : "Error"; break;
      case "ln": res = val > 0 ? Math.log(val) : "Error"; break;
      case "log": res = val > 0 ? Math.log10(val) : "Error"; break;
      case "abs": res = Math.abs(val); break;
      case "pi": res = Math.PI; break;
      case "e": res = Math.E; break;
      default: return;
    }

    if (res === "Error") {
      setDisplay("Error");
    } else {
      const rounded = Math.round(res * 1e10) / 1e10;
      setDisplay(String(rounded));
      setHistoryTape(`${fn}(${val}) =`);
      setHistoryList((prev) => [
        {
          id: `calc-${Date.now()}`,
          expression: `${fn}(${val})`,
          result: String(rounded),
          ts: Date.now()
        },
        ...prev.slice(0, 24)
      ]);
    }
    setWaitingForOperand(true);
  };

  const handleBackspace = useCallback(() => {
    playClick();
    if (waitingForOperand) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  }, [display, waitingForOperand, playClick]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        inputDigit(e.key);
      } else if (e.key === ".") {
        e.preventDefault();
        inputDecimal();
      } else if (e.key === "+" || e.key === "-") {
        e.preventDefault();
        performOperation(e.key);
      } else if (e.key === "*") {
        e.preventDefault();
        performOperation("×");
      } else if (e.key === "/") {
        e.preventDefault();
        performOperation("÷");
      } else if (e.key === "^") {
        e.preventDefault();
        performOperation("^");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        clearAll();
      } else if (e.key === "%") {
        e.preventDefault();
        inputPercent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputDigit, inputDecimal, performOperation, handleEquals, handleBackspace, clearAll, inputPercent]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] p-3 text-white select-none">
      {/* Top Header Mode Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { playClick(); setIsScientific(false); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              !isScientific ? "bg-white/15 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => { playClick(); setIsScientific(true); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              isScientific ? "bg-white/15 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            Scientific
          </button>
          {isScientific && (
            <button
              onClick={() => { playClick(); setAngleUnit(angleUnit === "deg" ? "rad" : "deg"); }}
              className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30"
              title="Toggle Degree / Radian"
            >
              {angleUnit}
            </button>
          )}
        </div>

        <button
          onClick={() => { playClick(); setShowHistory(!showHistory); }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition ${
            showHistory ? "bg-accent/20 text-accent border border-accent/30" : "text-white/50 hover:text-white"
          }`}
          title="Toggle Calculation History"
        >
          <GIconHistory size={13} />
          <span>History</span>
          {historyList.length > 0 && (
            <span className="text-[10px] px-1 rounded-full bg-white/10 font-mono">
              {historyList.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Display */}
      <div className="flex flex-col items-end justify-end p-3.5 bg-black/40 rounded-xl border border-white/10 mb-2.5 min-h-[84px]">
        <div className="text-[11px] font-mono text-white/40 h-4 truncate">
          {historyTape}
        </div>
        <div className="text-3xl font-mono font-semibold tracking-tight truncate max-w-full text-white">
          {display}
        </div>
      </div>

      {/* Memory Bar */}
      <div className="flex items-center justify-between gap-1 mb-2 px-1">
        <button
          onClick={() => { playClick(); setMemory(0); }}
          className="text-[10px] text-white/40 hover:text-white px-2 py-1 rounded transition-colors"
        >
          MC
        </button>
        <button
          onClick={() => { playClick(); setDisplay(String(memory)); setWaitingForOperand(true); }}
          className="text-[10px] text-white/40 hover:text-white px-2 py-1 rounded transition-colors"
        >
          MR
        </button>
        <button
          onClick={() => { playClick(); setMemory((m) => m + parseFloat(display)); }}
          className="text-[10px] text-white/40 hover:text-white px-2 py-1 rounded transition-colors"
        >
          M+
        </button>
        <button
          onClick={() => { playClick(); setMemory((m) => m - parseFloat(display)); }}
          className="text-[10px] text-white/40 hover:text-white px-2 py-1 rounded transition-colors"
        >
          M-
        </button>
      </div>

      {/* Calculator Body & History Drawer */}
      <div className="relative flex-1 flex flex-col min-h-0">
        {showHistory ? (
          /* History Drawer */
          <div className="flex-1 flex flex-col bg-black/30 rounded-xl border border-white/10 p-2 overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 text-[11px] text-white/60">
              <span>Past Calculations</span>
              {historyList.length > 0 && (
                <button
                  onClick={() => { playClick(); setHistoryList([]); }}
                  className="flex items-center gap-1 text-rose-300 hover:text-rose-200 transition"
                >
                  <GIconTrash size={12} /> Clear
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 thin-scroll pr-1">
              {historyList.length === 0 ? (
                <div className="text-center py-10 text-white/30 text-xs">No calculation history yet</div>
              ) : (
                historyList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      playClick();
                      setDisplay(item.result);
                      setWaitingForOperand(true);
                      setShowHistory(false);
                    }}
                    className="w-full text-right p-2 rounded-lg bg-white/5 hover:bg-white/10 transition group"
                  >
                    <div className="text-[10px] text-white/40 font-mono group-hover:text-white/60">
                      {item.expression} =
                    </div>
                    <div className="text-sm font-mono font-semibold text-accent">
                      {item.result}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Keypad */
          <div className="flex-1 flex flex-col gap-1.5">
            {/* Scientific Function Row (if active) */}
            {isScientific && (
              <div className="grid grid-cols-4 gap-1.5 mb-1">
                <button onClick={() => handleScientific("sin")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-cyan-300 py-1.5 font-mono">sin</button>
                <button onClick={() => handleScientific("cos")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-cyan-300 py-1.5 font-mono">cos</button>
                <button onClick={() => handleScientific("tan")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-cyan-300 py-1.5 font-mono">tan</button>
                <button onClick={() => handleScientific("sqrt")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-cyan-300 py-1.5 font-mono">√x</button>

                <button onClick={() => handleScientific("sq")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-amber-300 py-1.5 font-mono">x²</button>
                <button onClick={() => performOperation("^")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-amber-300 py-1.5 font-mono">xʸ</button>
                <button onClick={() => handleScientific("pi")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-amber-300 py-1.5 font-mono">π</button>
                <button onClick={() => handleScientific("e")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-amber-300 py-1.5 font-mono">e</button>

                <button onClick={() => handleScientific("ln")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-violet-300 py-1.5 font-mono">ln</button>
                <button onClick={() => handleScientific("log")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-violet-300 py-1.5 font-mono">log</button>
                <button onClick={() => handleScientific("inv")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-violet-300 py-1.5 font-mono">1/x</button>
                <button onClick={() => handleScientific("abs")} className="rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-violet-300 py-1.5 font-mono">|x|</button>
              </div>
            )}

            {/* Standard Keypad */}
            <div className="grid grid-cols-4 gap-2 flex-1">
              <button
                onClick={clearAll}
                className="rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-semibold transition-all text-rose-300"
              >
                AC
              </button>
              <button
                onClick={toggleSign}
                className="rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-semibold transition-all text-white/80"
              >
                ±
              </button>
              <button
                onClick={inputPercent}
                className="rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-semibold transition-all text-white/80"
              >
                %
              </button>
              <button
                onClick={() => performOperation("÷")}
                className={`rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  operation === "÷" ? "bg-white text-black" : "bg-accent text-white hover:brightness-110"
                }`}
              >
                ÷
              </button>

              <button onClick={() => inputDigit("7")} className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all">7</button>
              <button onClick={() => inputDigit("8")} className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all">8</button>
              <button onClick={() => inputDigit("9")} className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all">9</button>
              <button
                onClick={() => performOperation("×")}
                className={`rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  operation === "×" ? "bg-white text-black" : "bg-accent text-white hover:brightness-110"
                }`}
              >
                ×
              </button>

              <button onClick={() => inputDigit("4")} className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all">4</button>
              <button onClick={() => inputDigit("5")} className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all">5</button>
              <button onClick={() => inputDigit("6")} className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all">6</button>
              <button
                onClick={() => performOperation("-")}
                className={`rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  operation === "-" ? "bg-white text-black" : "bg-accent text-white hover:brightness-110"
                }`}
              >
                −
              </button>

              <button onClick={() => inputDigit("1")} className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all">1</button>
              <button onClick={() => inputDigit("2")} className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all">2</button>
              <button onClick={() => inputDigit("3")} className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all">3</button>
              <button
                onClick={() => performOperation("+")}
                className={`rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  operation === "+" ? "bg-white text-black" : "bg-accent text-white hover:brightness-110"
                }`}
              >
                +
              </button>

              <button onClick={() => inputDigit("0")} className="col-span-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all text-left px-5">
                0
              </button>
              <button onClick={inputDecimal} className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-sm font-medium transition-all">
                .
              </button>
              <button
                onClick={handleEquals}
                className="rounded-xl bg-accent hover:brightness-110 active:scale-95 text-sm font-bold transition-all shadow-lg shadow-accent/25 text-white"
              >
                =
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
