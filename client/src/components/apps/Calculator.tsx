import { useState, useEffect, useCallback } from "react";
import { soundFx } from "../../lib/soundFx";
import { useOS } from "../../store/useOS";
import {
  GIconHistory,
  GIconTrash,
  GIconDownload,
  GIconPercent,
  GIconClose,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";

interface CalcHistoryItem {
  id: string;
  expression: string;
  result: string;
  ts: number;
}

type CalcMode = "standard" | "scientific" | "converter" | "programmer";

interface MathConstant {
  symbol: string;
  name: string;
  value: number | string;
  unit?: string;
  category: string;
}

const DEFAULT_CONSTANTS: MathConstant[] = [
  { symbol: "π", name: "Pi", value: 3.141592653589793, category: "Math" },
  { symbol: "e", name: "Euler's Number", value: 2.718281828459045, category: "Math" },
  { symbol: "φ", name: "Golden Ratio", value: 1.618033988749895, category: "Math" },
  { symbol: "c", name: "Speed of Light", value: 299792458, unit: "m/s", category: "Physics" },
  { symbol: "h", name: "Planck Constant", value: "6.62607e-34", unit: "J·s", category: "Physics" },
  { symbol: "G", name: "Gravitational Constant", value: "6.6743e-11", unit: "N·m²/kg²", category: "Physics" },
];

export default function Calculator() {
  const { systemSounds, notify } = useOS();
  const [mode, setMode] = useState<CalcMode>("standard");
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [historyTape, setHistoryTape] = useState("");
  const [angleUnit, setAngleUnit] = useState<"deg" | "rad">("deg");
  const [showHistory, setShowHistory] = useState(false);
  const [showConstants, setShowConstants] = useState(false);
  const [constants, setConstants] = useState<MathConstant[]>(DEFAULT_CONSTANTS);

  // Unit Converter States
  const [convertType, setConvertType] = useState<"length" | "weight" | "data" | "temp">("length");
  const [convertFromUnit, setConvertFromUnit] = useState("m");
  const [convertToUnit, setConvertToUnit] = useState("ft");
  const [convertInput, setConvertInput] = useState("1");
  const [convertResult, setConvertResult] = useState<number | string>("3.28084");

  // History Stack
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

  // Fetch server-provided constants
  useEffect(() => {
    fetch(`${API_URL}/api/calc/constants`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setConstants(data);
      })
      .catch(() => {});
  }, []);

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
      case "AND": return Math.floor(a) & Math.floor(b);
      case "OR": return Math.floor(a) | Math.floor(b);
      case "XOR": return Math.floor(a) ^ Math.floor(b);
      case "<<": return Math.floor(a) << Math.floor(b);
      case ">>": return Math.floor(a) >> Math.floor(b);
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
      const currentValue = prevValue || 0;
      const res = calculate(currentValue, inputValue, operation);
      if (res === "Error") {
        setDisplay("Error");
        setPrevValue(null);
        setOperation(null);
        setWaitingForOperand(true);
        return;
      }
      setPrevValue(res);
      setDisplay(String(res));
      setHistoryTape(`${res} ${nextOp}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
  }, [display, prevValue, operation, playClick]);

  const handleEquals = useCallback(() => {
    playClick();
    if (operation === null || prevValue === null) return;
    const inputValue = parseFloat(display);
    const res = calculate(prevValue, inputValue, operation);

    if (res === "Error") {
      setDisplay("Error");
      setHistoryTape("");
    } else {
      const formattedRes = String(Math.round(res * 100000000) / 100000000);
      const expression = `${prevValue} ${operation} ${inputValue}`;

      setHistoryList((prev) => [
        { id: `calc-${Date.now()}`, expression, result: formattedRes, ts: Date.now() },
        ...prev.slice(0, 49),
      ]);

      setDisplay(formattedRes);
      setHistoryTape(`${expression} =`);
      setPrevValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  }, [display, prevValue, operation, playClick]);

  // Scientific Single-Operand Functions
  const performScientific = (func: string) => {
    playClick();
    const val = parseFloat(display);
    if (isNaN(val)) return;

    let res = 0;
    const toRad = angleUnit === "deg" ? (Math.PI / 180) : 1;
    const toDeg = angleUnit === "deg" ? (180 / Math.PI) : 1;

    switch (func) {
      case "sin": res = Math.sin(val * toRad); break;
      case "cos": res = Math.cos(val * toRad); break;
      case "tan": res = Math.tan(val * toRad); break;
      case "asin": res = Math.asin(val) * toDeg; break;
      case "acos": res = Math.acos(val) * toDeg; break;
      case "atan": res = Math.atan(val) * toDeg; break;
      case "sqrt": res = Math.sqrt(val); break;
      case "sq": res = Math.pow(val, 2); break;
      case "cube": res = Math.pow(val, 3); break;
      case "log": res = Math.log10(val); break;
      case "ln": res = Math.log(val); break;
      case "inv": res = val !== 0 ? 1 / val : 0; break;
      case "exp": res = Math.exp(val); break;
      case "fact": {
        let f = 1;
        for (let i = 2; i <= Math.min(val, 170); i++) f *= i;
        res = f;
        break;
      }
      default: return;
    }

    const rounded = String(Math.round(res * 10000000) / 10000000);
    setHistoryTape(`${func}(${val}) =`);
    setDisplay(rounded);
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

  // Insert Constant
  const insertConstant = (c: MathConstant) => {
    playClick();
    setDisplay(String(c.value));
    setWaitingForOperand(false);
    setShowConstants(false);
    notify("Constant Inserted", `${c.name} (${c.symbol}) = ${c.value}`, "info");
  };

  // Unit Converter Engine
  const runConversion = useCallback((valStr: string, type: string, from: string, to: string) => {
    const num = parseFloat(valStr);
    if (isNaN(num)) {
      setConvertResult("0");
      return;
    }

    const lengthToMeters: Record<string, number> = {
      m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254
    };
    const weightToKg: Record<string, number> = {
      kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495
    };
    const dataToBytes: Record<string, number> = {
      b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776
    };

    let calculated: number = 0;
    if (type === "length") {
      calculated = (num * (lengthToMeters[from] || 1)) / (lengthToMeters[to] || 1);
    } else if (type === "weight") {
      calculated = (num * (weightToKg[from] || 1)) / (weightToKg[to] || 1);
    } else if (type === "data") {
      calculated = (num * (dataToBytes[from] || 1)) / (dataToBytes[to] || 1);
    } else if (type === "temp") {
      if (from === "c" && to === "f") calculated = (num * 9) / 5 + 32;
      else if (from === "f" && to === "c") calculated = ((num - 32) * 5) / 9;
      else if (from === "c" && to === "k") calculated = num + 273.15;
      else if (from === "k" && to === "c") calculated = num - 273.15;
      else calculated = num;
    }

    setConvertResult(String(Math.round(calculated * 100000) / 100000));
  }, []);

  useEffect(() => {
    runConversion(convertInput, convertType, convertFromUnit, convertToUnit);
  }, [convertInput, convertType, convertFromUnit, convertToUnit, runConversion]);

  // Export History
  const exportHistory = () => {
    if (systemSounds) soundFx.playPop();
    const text = historyList
      .map((h) => `${new Date(h.ts).toLocaleString()}: ${h.expression} = ${h.result}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calc-history.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("Exported", "Calculation history saved to Downloads.", "success");
  };

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

  // Programmer mode computed conversions
  const parsedNum = Math.floor(parseFloat(display) || 0);
  const hexVal = (parsedNum >>> 0).toString(16).toUpperCase();
  const decVal = parsedNum.toString(10);
  const octVal = (parsedNum >>> 0).toString(8);
  const binVal = (parsedNum >>> 0).toString(2).padStart(8, "0");

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] p-3 text-white select-none relative">
      {/* Top Header Mode Bar (Sticky) */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs gap-1.5 shrink-0 sticky top-0 bg-[#0a0a0f]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 text-[10px] overflow-x-auto no-scrollbar">
          {(["standard", "scientific", "converter", "programmer"] as CalcMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { playClick(); setMode(m); }}
              className={`px-2 py-0.5 rounded-md capitalize transition shrink-0 cursor-pointer ${
                mode === m ? "bg-accent text-white font-semibold" : "text-white/60 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {mode === "scientific" && (
            <button
              onClick={() => { playClick(); setAngleUnit(angleUnit === "deg" ? "rad" : "deg"); }}
              className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30"
              title="Toggle Degree / Radian"
            >
              {angleUnit}
            </button>
          )}

          <button
            onClick={() => setShowConstants(!showConstants)}
            className="p-1 rounded bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition"
            title="Math & Physics Constants"
          >
            <GIconPercent size={12} className="text-amber-400" />
          </button>

          <button
            onClick={() => { playClick(); setShowHistory(!showHistory); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition ${
              showHistory ? "bg-accent/20 text-accent border border-accent/30" : "text-white/50 hover:text-white"
            }`}
            title="Toggle Calculation History"
          >
            <GIconHistory size={12} />
            <span className="hidden sm:inline">History</span>
            {historyList.length > 0 && (
              <span className="text-[9px] px-1 rounded-full bg-white/10 font-mono">
                {historyList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Constants Popover */}
      {showConstants && (
        <div className="absolute top-12 left-3 right-3 p-3 bg-slate-900 border border-white/20 rounded-xl shadow-2xl z-50 animate-scaleIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="text-xs font-bold text-accent flex items-center gap-1.5">
              <GIconPercent size={13} /> Scientific Constants
            </span>
            <button onClick={() => setShowConstants(false)} className="text-white/50 hover:text-white">
              <GIconClose size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto thin-scroll text-xs">
            {constants.map((c, i) => (
              <button
                key={i}
                onClick={() => insertConstant(c)}
                className="text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-amber-300 font-mono mr-1.5">{c.symbol}</span>
                  <span className="text-white/70 text-[11px]">{c.name}</span>
                </div>
                <span className="font-mono text-[10px] text-white/40">{c.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Display Area (for Standard, Scientific, Programmer) */}
      {mode !== "converter" ? (
        <div className="bg-black/35 rounded-xl border border-white/10 p-3 mb-2 flex flex-col justify-end text-right">
          <div className="text-[11px] text-white/40 font-mono h-4 truncate">
            {historyTape}
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-medium tracking-tight truncate text-white">
            {display}
          </div>

          {/* Programmer base readout in programmer mode */}
          {mode === "programmer" && (
            <div className="mt-2 pt-2 border-t border-white/10 text-left font-mono text-[10px] space-y-1">
              <div className="flex justify-between text-white/60">
                <span className="text-amber-400 font-bold">HEX</span> <span>0x{hexVal}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span className="text-sky-400 font-bold">DEC</span> <span>{decVal}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span className="text-emerald-400 font-bold">OCT</span> <span>0{octVal}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span className="text-purple-400 font-bold">BIN</span> <span>{binVal}</span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Converter Mode View */}
      {mode === "converter" && (
        <div className="flex-1 bg-black/25 rounded-xl border border-white/10 p-4 space-y-4">
          <div className="flex items-center gap-1.5 justify-center">
            {(["length", "weight", "data", "temp"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setConvertType(t);
                  if (t === "length") { setConvertFromUnit("m"); setConvertToUnit("ft"); }
                  if (t === "weight") { setConvertFromUnit("kg"); setConvertToUnit("lb"); }
                  if (t === "data") { setConvertFromUnit("gb"); setConvertToUnit("mb"); }
                  if (t === "temp") { setConvertFromUnit("c"); setConvertToUnit("f"); }
                }}
                className={`px-3 py-1 rounded-lg text-xs capitalize transition ${
                  convertType === t ? "bg-accent text-white font-medium shadow" : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">From</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={convertInput}
                  onChange={(e) => setConvertInput(e.target.value)}
                  className="w-2/3 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-accent"
                />
                <select
                  value={convertFromUnit}
                  onChange={(e) => setConvertFromUnit(e.target.value)}
                  className="w-1/3 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs uppercase"
                >
                  {convertType === "length" && (
                    <>
                      <option value="m">Meters (m)</option>
                      <option value="km">Kilometers (km)</option>
                      <option value="cm">Centimeters (cm)</option>
                      <option value="ft">Feet (ft)</option>
                      <option value="in">Inches (in)</option>
                      <option value="mi">Miles (mi)</option>
                    </>
                  )}
                  {convertType === "weight" && (
                    <>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="lb">Pounds (lb)</option>
                      <option value="oz">Ounces (oz)</option>
                    </>
                  )}
                  {convertType === "data" && (
                    <>
                      <option value="b">Bytes (B)</option>
                      <option value="kb">Kilobytes (KB)</option>
                      <option value="mb">Megabytes (MB)</option>
                      <option value="gb">Gigabytes (GB)</option>
                      <option value="tb">Terabytes (TB)</option>
                    </>
                  )}
                  {convertType === "temp" && (
                    <>
                      <option value="c">Celsius (°C)</option>
                      <option value="f">Fahrenheit (°F)</option>
                      <option value="k">Kelvin (K)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-white/60 mb-1">To (Converted Result)</label>
              <div className="flex gap-2">
                <div className="w-2/3 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-accent font-mono text-sm truncate flex items-center font-bold">
                  {convertResult}
                </div>
                <select
                  value={convertToUnit}
                  onChange={(e) => setConvertToUnit(e.target.value)}
                  className="w-1/3 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs uppercase"
                >
                  {convertType === "length" && (
                    <>
                      <option value="m">Meters (m)</option>
                      <option value="km">Kilometers (km)</option>
                      <option value="cm">Centimeters (cm)</option>
                      <option value="ft">Feet (ft)</option>
                      <option value="in">Inches (in)</option>
                      <option value="mi">Miles (mi)</option>
                    </>
                  )}
                  {convertType === "weight" && (
                    <>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="lb">Pounds (lb)</option>
                      <option value="oz">Ounces (oz)</option>
                    </>
                  )}
                  {convertType === "data" && (
                    <>
                      <option value="b">Bytes (B)</option>
                      <option value="kb">Kilobytes (KB)</option>
                      <option value="mb">Megabytes (MB)</option>
                      <option value="gb">Gigabytes (GB)</option>
                      <option value="tb">Terabytes (TB)</option>
                    </>
                  )}
                  {convertType === "temp" && (
                    <>
                      <option value="c">Celsius (°C)</option>
                      <option value="f">Fahrenheit (°F)</option>
                      <option value="k">Kelvin (K)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keypad Grid for Standard, Scientific & Programmer Modes */}
      {mode !== "converter" && (
        <div className="flex-1 grid grid-cols-4 gap-1 text-sm font-medium">
          {/* Scientific Extras Row */}
          {mode === "scientific" && (
            <>
              <button onClick={() => performScientific("sin")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/80 text-xs">sin</button>
              <button onClick={() => performScientific("cos")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/80 text-xs">cos</button>
              <button onClick={() => performScientific("tan")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/80 text-xs">tan</button>
              <button onClick={() => performOperation("^")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-amber-300 font-bold text-xs">xʸ</button>

              <button onClick={() => performScientific("sqrt")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/80 text-xs">√x</button>
              <button onClick={() => performScientific("sq")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/80 text-xs">x²</button>
              <button onClick={() => performScientific("ln")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/80 text-xs">ln</button>
              <button onClick={() => performScientific("log")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/80 text-xs">log</button>
            </>
          )}

          {/* Programmer Bitwise Extras Row */}
          {mode === "programmer" && (
            <>
              <button onClick={() => performOperation("AND")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-sky-300 font-mono text-xs">AND</button>
              <button onClick={() => performOperation("OR")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-sky-300 font-mono text-xs">OR</button>
              <button onClick={() => performOperation("XOR")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-sky-300 font-mono text-xs">XOR</button>
              <button onClick={() => {
                const num = Math.floor(parseFloat(display) || 0);
                setDisplay(String(~num));
              }} className="p-2 rounded bg-white/5 hover:bg-white/10 text-sky-300 font-mono text-xs">NOT</button>

              <button onClick={() => performOperation("<<")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-emerald-300 font-mono text-xs">&lt;&lt;</button>
              <button onClick={() => performOperation(">>")} className="p-2 rounded bg-white/5 hover:bg-white/10 text-emerald-300 font-mono text-xs">&gt;&gt;</button>
              <button onClick={() => setDisplay(String(parsedNum >>> 0))} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/80 font-mono text-xs">UINT</button>
              <button onClick={handleBackspace} className="p-2 rounded bg-white/5 hover:bg-white/10 text-rose-300 text-xs">⌫</button>
            </>
          )}

          {/* Standard Numeric Keypad */}
          <button onClick={clearAll} className="p-2.5 rounded bg-white/10 hover:bg-white/15 text-rose-400 font-semibold">C</button>
          <button onClick={toggleSign} className="p-2.5 rounded bg-white/10 hover:bg-white/15 text-white/70">±</button>
          <button onClick={inputPercent} className="p-2.5 rounded bg-white/10 hover:bg-white/15 text-white/70">%</button>
          <button onClick={() => performOperation("÷")} className="p-2.5 rounded bg-accent/20 hover:bg-accent/30 text-accent font-bold">÷</button>

          <button onClick={() => inputDigit(7)} className="p-2.5 rounded bg-white/5 hover:bg-white/10 text-white">7</button>
          <button onClick={() => inputDigit(8)} className="p-2.5 rounded bg-white/5 hover:bg-white/10 text-white">8</button>
          <button onClick={() => inputDigit(9)} className="p-2.5 rounded bg-white/5 hover:bg-white/10 text-white">9</button>
          <button onClick={() => performOperation("×")} className="p-2.5 rounded bg-accent/20 hover:bg-accent/30 text-accent font-bold">×</button>

          <button onClick={() => inputDigit(4)} className="p-2.5 rounded bg-white/5 hover:bg-white/10 text-white">4</button>
          <button onClick={() => inputDigit(5)} className="p-2.5 rounded bg-white/5 hover:bg-white/10 text-white">5</button>
          <button onClick={() => inputDigit(6)} className="p-2.5 rounded bg-white/5 hover:bg-white/10 text-white">6</button>
          <button onClick={() => performOperation("-")} className="p-2.5 rounded bg-accent/20 hover:bg-accent/30 text-accent font-bold">−</button>

          <button onClick={() => inputDigit(1)} className="p-2.5 rounded bg-white/5 hover:bg-white/10 text-white">1</button>
          <button onClick={() => inputDigit(2)} className="p-2.5 rounded bg-white/5 hover:bg-white/10 text-white">2</button>
          <button onClick={() => inputDigit(3)} className="p-2.5 rounded bg-white/5 hover:bg-white/10 text-white">3</button>
          <button onClick={() => performOperation("+")} className="p-2.5 rounded bg-accent/20 hover:bg-accent/30 text-accent font-bold">+</button>

          <button onClick={() => inputDigit(0)} className="col-span-2 p-2.5 rounded bg-white/5 hover:bg-white/10 text-white">0</button>
          <button onClick={inputDecimal} className="p-2.5 rounded bg-white/5 hover:bg-white/10 text-white font-bold">.</button>
          <button onClick={handleEquals} className="p-2.5 rounded bg-accent hover:opacity-90 text-white font-bold shadow-md shadow-accent/20">=</button>
        </div>
      )}

      {/* History Drawer Modal */}
      {showHistory && (
        <div className="absolute inset-x-3 bottom-3 top-12 bg-slate-950/95 backdrop-blur-md rounded-xl border border-white/15 p-3 flex flex-col z-40 shadow-2xl animate-scaleIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
            <span className="font-semibold text-white/90 flex items-center gap-1.5">
              <GIconHistory size={13} /> Calculation Tape
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={exportHistory}
                disabled={historyList.length === 0}
                className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition disabled:opacity-30"
                title="Download history transcript"
              >
                <GIconDownload size={13} />
              </button>
              <button
                onClick={() => setHistoryList([])}
                disabled={historyList.length === 0}
                className="p-1 rounded text-white/50 hover:text-rose-400 hover:bg-white/10 transition disabled:opacity-30"
                title="Clear history"
              >
                <GIconTrash size={13} />
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded text-white/50 hover:text-white"
              >
                <GIconClose size={13} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto thin-scroll space-y-1.5 font-mono text-xs">
            {historyList.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-xs">
                No calculation history yet.
              </div>
            ) : (
              historyList.map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    setDisplay(h.result);
                    setShowHistory(false);
                  }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition flex items-center justify-between"
                >
                  <span className="text-white/50 truncate mr-2">{h.expression}</span>
                  <span className="text-accent font-bold shrink-0">= {h.result}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
