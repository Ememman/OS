import { useState, useEffect, useCallback, useMemo } from "react";
import { soundFx } from "../../lib/soundFx";
import { useOS } from "../../store/useOS";
import {
  GIconHistory,
  GIconTrash,
  GIconDownload,
  GIconPercent,
  GIconClose,
  GIconCopy,
  GIconCheck,
  GIconSearch,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import CustomDropdown, { type DropdownOption } from "../ui/CustomDropdown";

const CONVERT_UNIT_OPTIONS: Record<"length" | "weight" | "data" | "temp", DropdownOption[]> = {
  length: [
    { value: "m", label: "Meters (m)" },
    { value: "km", label: "Kilometers (km)" },
    { value: "cm", label: "Centimeters (cm)" },
    { value: "mm", label: "Millimeters (mm)" },
    { value: "ft", label: "Feet (ft)" },
    { value: "in", label: "Inches (in)" },
    { value: "mi", label: "Miles (mi)" },
  ],
  weight: [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "g", label: "Grams (g)" },
    { value: "mg", label: "Milligrams (mg)" },
    { value: "lb", label: "Pounds (lb)" },
    { value: "oz", label: "Ounces (oz)" },
  ],
  data: [
    { value: "b", label: "Bytes (B)" },
    { value: "kb", label: "Kilobytes (KB)" },
    { value: "mb", label: "Megabytes (MB)" },
    { value: "gb", label: "Gigabytes (GB)" },
    { value: "tb", label: "Terabytes (TB)" },
  ],
  temp: [
    { value: "c", label: "Celsius (°C)" },
    { value: "f", label: "Fahrenheit (°F)" },
    { value: "k", label: "Kelvin (K)" },
  ],
};

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
  desc?: string;
}

const DEFAULT_CONSTANTS: MathConstant[] = [
  { symbol: "π", name: "Pi", value: 3.141592653589793, category: "Math", desc: "Ratio of circle circumference to diameter" },
  { symbol: "e", name: "Euler's Number", value: 2.718281828459045, category: "Math", desc: "Base of natural logarithm" },
  { symbol: "φ", name: "Golden Ratio", value: 1.618033988749895, category: "Math", desc: "Divine proportion in geometry & art" },
  { symbol: "c", name: "Speed of Light", value: 299792458, unit: "m/s", category: "Physics", desc: "Speed of light in vacuum" },
  { symbol: "h", name: "Planck Constant", value: "6.62607015e-34", unit: "J·s", category: "Physics", desc: "Quantum of electromagnetic action" },
  { symbol: "G", name: "Gravitational Constant", value: "6.67430e-11", unit: "N·m²/kg²", category: "Physics", desc: "Newtonian gravitational constant" },
  { symbol: "kB", name: "Boltzmann Constant", value: "1.380649e-23", unit: "J/K", category: "Physics", desc: "Relates thermal energy to temperature" },
  { symbol: "NA", name: "Avogadro Number", value: "6.02214076e23", unit: "mol⁻¹", category: "Chemistry", desc: "Number of constituent particles in one mole" },
];

function formatConstantDisplay(val: number | string): string {
  const str = String(val);
  if (str.includes("e-") || str.includes("e+")) {
    const parts = str.split(/e/i);
    const base = parts[0];
    const exp = parts[1];
    const sign = exp.startsWith("-") ? "⁻" : "";
    const digits = exp.replace(/[^0-9]/g, "");
    const superscripts: Record<string, string> = {
      "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
      "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    };
    const superExp = sign + digits.split("").map((d) => superscripts[d] || d).join("");
    const numBase = parseFloat(base);
    const roundedBase = isNaN(numBase) ? base : (Math.round(numBase * 100000) / 100000).toString();
    return `${roundedBase} × 10${superExp}`;
  }
  const num = parseFloat(str);
  if (!isNaN(num) && num >= 1000000) {
    return num.toLocaleString();
  }
  if (str.length > 13) {
    return str.slice(0, 13) + "…";
  }
  return str;
}

function formatBinaryNibbles(binStr: string): string {
  const clean = binStr.replace(/^0b/, "");
  const rem = clean.length % 4;
  const padded = rem === 0 ? clean : "0".repeat(4 - rem) + clean;
  return padded.match(/.{1,4}/g)?.join(" ") || clean;
}

const MODES: { id: CalcMode; label: string; short: string }[] = [
  { id: "standard", label: "Standard", short: "Std" },
  { id: "scientific", label: "Scientific", short: "Sci" },
  { id: "converter", label: "Converter", short: "Conv" },
  { id: "programmer", label: "Programmer", short: "Prog" },
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
  const [isSecond, setIsSecond] = useState(false);

  // Modals & Panels
  const [showHistory, setShowHistory] = useState(false);
  const [showConstants, setShowConstants] = useState(false);
  const [constants, setConstants] = useState<MathConstant[]>(DEFAULT_CONSTANTS);
  const [constantSearch, setConstantSearch] = useState("");
  const [constantCategory, setConstantCategory] = useState<string>("All");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Unit Converter States
  const [convertType, setConvertType] = useState<"length" | "weight" | "data" | "temp">("length");
  const [convertFromUnit, setConvertFromUnit] = useState("m");
  const [convertToUnit, setConvertToUnit] = useState("ft");
  const [convertInput, setConvertInput] = useState("1");
  const [convertResult, setConvertResult] = useState<number | string>("3.28084");

  // Calculation History Stack
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
        if (Array.isArray(data) && data.length > 0) {
          setConstants(data);
        }
      })
      .catch(() => {});
  }, []);

  const playClick = useCallback(() => {
    if (systemSounds) soundFx.playClick();
  }, [systemSounds]);

  const copyToClipboard = useCallback((text: string, fieldId: string, label = "Value") => {
    navigator.clipboard.writeText(text).then(() => {
      if (systemSounds) soundFx.playPop();
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 1500);
      notify("Copied to Clipboard", `${label}: ${text}`, "success");
    }).catch(() => {});
  }, [systemSounds, notify]);

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

  const clearEntry = useCallback(() => {
    playClick();
    setDisplay("0");
    setWaitingForOperand(false);
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
    } else if (operation && !waitingForOperand) {
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
    } else {
      setHistoryTape(`${prevValue} ${nextOp}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
  }, [display, prevValue, operation, waitingForOperand, playClick]);

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

    let res: number | "Error" = 0;
    const toRad = angleUnit === "deg" ? (Math.PI / 180) : 1;
    const toDeg = angleUnit === "deg" ? (180 / Math.PI) : 1;

    switch (func) {
      case "sin": res = Math.sin(val * toRad); break;
      case "cos": res = Math.cos(val * toRad); break;
      case "tan": res = Math.tan(val * toRad); break;
      case "asin": res = Math.asin(val) * toDeg; break;
      case "acos": res = Math.acos(val) * toDeg; break;
      case "atan": res = Math.atan(val) * toDeg; break;
      case "sqrt": res = val >= 0 ? Math.sqrt(val) : "Error"; break;
      case "cbrt": res = Math.cbrt(val); break;
      case "sq": res = Math.pow(val, 2); break;
      case "cube": res = Math.pow(val, 3); break;
      case "log": res = val > 0 ? Math.log10(val) : "Error"; break;
      case "ln": res = val > 0 ? Math.log(val) : "Error"; break;
      case "inv": res = val !== 0 ? 1 / val : "Error"; break;
      case "exp": res = Math.exp(val); break;
      case "tenPow": res = Math.pow(10, val); break;
      case "abs": res = Math.abs(val); break;
      case "fact": {
        if (val < 0 || Math.floor(val) !== val) {
          res = "Error";
          break;
        }
        let f = 1;
        for (let i = 2; i <= Math.min(val, 170); i++) f *= i;
        res = f;
        break;
      }
      default: return;
    }

    if (res === "Error") {
      setDisplay("Error");
      setHistoryTape(`${func}(${val})`);
    } else {
      const rounded = String(Math.round(res * 100000000) / 100000000);
      setHistoryTape(`${func}(${val}) =`);
      setDisplay(rounded);
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
      else if (from === "f" && to === "k") calculated = ((num - 32) * 5) / 9 + 273.15;
      else if (from === "k" && to === "f") calculated = ((num - 273.15) * 9) / 5 + 32;
      else calculated = num;
    }

    setConvertResult(String(Math.round(calculated * 100000) / 100000));
  }, []);

  const swapUnits = () => {
    playClick();
    const prevFrom = convertFromUnit;
    const prevTo = convertToUnit;
    setConvertFromUnit(prevTo);
    setConvertToUnit(prevFrom);
    if (typeof convertResult === "string" && !isNaN(parseFloat(convertResult))) {
      setConvertInput(convertResult);
    }
  };

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
        if (showConstants) {
          setShowConstants(false);
        } else if (showHistory) {
          setShowHistory(false);
        } else {
          clearAll();
        }
      } else if (e.key === "%") {
        e.preventDefault();
        inputPercent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputDigit, inputDecimal, performOperation, handleEquals, handleBackspace, clearAll, inputPercent, showConstants, showHistory]);

  // Programmer mode computed conversions
  const parsedNum = Math.floor(parseFloat(display) || 0);
  const hexVal = (parsedNum >>> 0).toString(16).toUpperCase();
  const decVal = parsedNum.toString(10);
  const octVal = (parsedNum >>> 0).toString(8);
  const rawBinVal = (parsedNum >>> 0).toString(2);
  const binVal = formatBinaryNibbles(rawBinVal.padStart(Math.max(8, Math.ceil(rawBinVal.length / 4) * 4), "0"));

  // Dynamic Display font sizing
  const displayFontSize = useMemo(() => {
    const len = display.length;
    if (len > 18) return "text-lg";
    if (len > 14) return "text-xl";
    if (len > 11) return "text-2xl";
    return "text-3xl sm:text-4xl";
  }, [display]);

  // Filtered Constants
  const filteredConstants = useMemo(() => {
    return constants.filter((c) => {
      const matchesCategory = constantCategory === "All" || c.category.toLowerCase() === constantCategory.toLowerCase();
      const q = constantSearch.trim().toLowerCase();
      const matchesSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        (c.desc && c.desc.toLowerCase().includes(q)) ||
        (c.unit && c.unit.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [constants, constantCategory, constantSearch]);

  const categories = useMemo(() => {
    const set = new Set(constants.map((c) => c.category));
    return ["All", ...Array.from(set)];
  }, [constants]);

  const isOpActive = (op: string) => operation === op && waitingForOperand;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] p-2.5 sm:p-3 text-white select-none relative overflow-y-auto thin-scroll">
      {/* Top Header Mode Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs gap-1.5 shrink-0 sticky top-0 bg-[#0a0a0f]/95 backdrop-blur-md z-10">
        {/* Responsive Segmented Mode Tabs: Equal width grid prevents ANY truncation */}
        <div className="flex-1 min-w-0 grid grid-cols-4 gap-0.5 bg-white/[0.04] p-0.5 rounded-xl border border-white/10 text-[9.5px] sm:text-[10px]">
          {MODES.map((m) => {
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { playClick(); setMode(m.id); }}
                className={`py-1 px-0.5 rounded-lg font-medium transition-all text-center truncate cursor-pointer ${
                  isActive
                    ? "bg-accent text-white shadow-sm shadow-accent/30 font-semibold"
                    : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                }`}
                title={m.label}
              >
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action Icons: Deg/Rad Toggle, Scientific Constants Modal Toggle, Calculation History */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {mode === "scientific" && (
            <button
              onClick={() => { playClick(); setAngleUnit(angleUnit === "deg" ? "rad" : "deg"); }}
              className="text-[9.5px] uppercase font-mono px-1.5 py-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 transition-all font-semibold cursor-pointer"
              title={`Angle Mode: ${angleUnit === "deg" ? "Degrees (Click to switch to Radians)" : "Radians (Click to switch to Degrees)"}`}
            >
              {angleUnit}
            </button>
          )}

          <button
            onClick={() => {
              playClick();
              setShowConstants(!showConstants);
              if (showHistory) setShowHistory(false);
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showConstants
                ? "bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-sm shadow-amber-400/25"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-amber-400 hover:text-amber-300"
            }`}
            title="Scientific & Physical Constants"
          >
            <GIconPercent size={13} />
          </button>

          <button
            onClick={() => {
              playClick();
              setShowHistory(!showHistory);
              if (showConstants) setShowConstants(false);
            }}
            className={`relative p-1.5 rounded-lg border transition-all cursor-pointer ${
              showHistory
                ? "bg-accent/20 border-accent/40 text-accent shadow-sm shadow-accent/20"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white"
            }`}
            title="Calculation History Tape"
          >
            <GIconHistory size={13} />
            {historyList.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-accent text-[8.5px] font-mono font-bold text-white flex items-center justify-center border border-[#0a0a0f]">
                {historyList.length > 9 ? "9+" : historyList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Scientific Constants Modal / Drawer */}
      {showConstants && (
        <div className="absolute inset-x-2 top-11 bottom-2 bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 shadow-2xl z-50 flex flex-col animate-scaleIn">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                <GIconPercent size={11} />
              </span>
              <span className="text-xs font-semibold text-white">Scientific Constants</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-white/50">
                {filteredConstants.length}
              </span>
            </div>
            <button
              onClick={() => setShowConstants(false)}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Constants (Esc)"
            >
              <GIconClose size={13} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-2 shrink-0">
            <GIconSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={constantSearch}
              onChange={(e) => setConstantSearch(e.target.value)}
              placeholder="Search constants (e.g. pi, light, planck)..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-7 py-1 text-xs text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all font-mono"
            />
            {constantSearch && (
              <button
                onClick={() => setConstantSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <GIconClose size={11} />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1 mb-2 overflow-x-auto no-scrollbar shrink-0 pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { playClick(); setConstantCategory(cat); }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer shrink-0 ${
                  constantCategory === cat
                    ? "bg-amber-400 text-slate-950 font-semibold shadow-sm"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Constants Grid: Two-column cards with strictly stacked layouts to eliminate ANY overlapping */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden thin-scroll pr-0.5 min-h-0">
            {filteredConstants.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-white/40 space-y-2">
                <GIconSearch size={22} className="opacity-30" />
                <p className="text-xs">No matching constants found.</p>
                <button
                  onClick={() => { setConstantSearch(""); setConstantCategory("All"); }}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 pb-2">
                {filteredConstants.map((c, i) => (
                  <button
                    key={c.symbol + i}
                    onClick={() => insertConstant(c)}
                    className="group relative flex flex-col justify-between p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] active:bg-white/[0.14] border border-white/10 hover:border-amber-400/40 transition-all text-left overflow-hidden shadow-sm cursor-pointer"
                    title={`${c.name} (${c.symbol})\nValue: ${c.value} ${c.unit || ""}\n${c.desc || ""}\nClick to insert`}
                  >
                    {/* Top Row: Symbol badge + Name + Unit */}
                    <div className="flex items-center justify-between gap-1 mb-1.5 w-full min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="shrink-0 w-5 h-5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                          {c.symbol}
                        </span>
                        <span className="text-[10.5px] font-medium text-white/90 truncate flex-1 min-w-0">
                          {c.name}
                        </span>
                      </div>
                      {c.unit && (
                        <span className="shrink-0 text-[8px] font-mono px-1 py-0.2 rounded bg-white/5 text-white/45 border border-white/5">
                          {c.unit}
                        </span>
                      )}
                    </div>

                    {/* Dedicated Bottom Monospace Value Pill */}
                    <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded-lg border border-white/5 text-amber-300/90 font-mono text-[9.5px] tracking-tight w-full min-w-0">
                      <span className="truncate">{formatConstantDisplay(c.value)}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-[8.5px] text-amber-400 font-sans shrink-0 ml-1 font-semibold uppercase tracking-wider transition-opacity">
                        Insert
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Display Area (Standard, Scientific, Programmer) */}
      {mode !== "converter" ? (
        <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/10 p-3 mb-2 flex flex-col justify-end text-right relative group shadow-inner">
          {/* Top Tape & Action Controls */}
          <div className="flex items-center justify-between text-[11px] text-white/40 font-mono h-5 mb-0.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => copyToClipboard(display, "main-display", "Result")}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/60 hover:text-white cursor-pointer"
                title="Copy current value"
              >
                {copiedField === "main-display" ? (
                  <GIconCheck size={11} className="text-emerald-400" />
                ) : (
                  <GIconCopy size={11} />
                )}
              </button>
              <button
                onClick={handleBackspace}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/60 hover:text-rose-300 cursor-pointer font-sans"
                title="Backspace (Delete last digit)"
              >
                ⌫
              </button>
            </div>
            <div className="truncate text-right pl-2 max-w-[80%]">
              {historyTape}
            </div>
          </div>

          {/* Primary Numeric Display with Dynamic Resizing */}
          <div className={`${displayFontSize} font-mono font-medium tracking-tight truncate text-white transition-all select-text`}>
            {display}
          </div>

          {/* Programmer Base Readout in Programmer Mode */}
          {mode === "programmer" && (
            <div className="mt-2 pt-2 border-t border-white/10 text-left font-mono text-[10px] space-y-1">
              <div
                onClick={() => copyToClipboard(hexVal, "prog-hex", "HEX Value")}
                className="flex justify-between items-center text-white/60 hover:text-white hover:bg-white/5 px-1.5 py-0.5 rounded cursor-pointer transition"
                title="Click to copy HEX"
              >
                <span className="text-amber-400 font-bold">HEX</span>
                <span className="flex items-center gap-1">
                  0x{hexVal}
                  {copiedField === "prog-hex" && <GIconCheck size={10} className="text-emerald-400" />}
                </span>
              </div>
              <div
                onClick={() => copyToClipboard(decVal, "prog-dec", "DEC Value")}
                className="flex justify-between items-center text-white/60 hover:text-white hover:bg-white/5 px-1.5 py-0.5 rounded cursor-pointer transition"
                title="Click to copy DEC"
              >
                <span className="text-sky-400 font-bold">DEC</span>
                <span className="flex items-center gap-1">
                  {decVal}
                  {copiedField === "prog-dec" && <GIconCheck size={10} className="text-emerald-400" />}
                </span>
              </div>
              <div
                onClick={() => copyToClipboard(octVal, "prog-oct", "OCT Value")}
                className="flex justify-between items-center text-white/60 hover:text-white hover:bg-white/5 px-1.5 py-0.5 rounded cursor-pointer transition"
                title="Click to copy OCT"
              >
                <span className="text-emerald-400 font-bold">OCT</span>
                <span className="flex items-center gap-1">
                  0{octVal}
                  {copiedField === "prog-oct" && <GIconCheck size={10} className="text-emerald-400" />}
                </span>
              </div>
              <div
                onClick={() => copyToClipboard(rawBinVal, "prog-bin", "BIN Value")}
                className="flex justify-between items-center text-white/60 hover:text-white hover:bg-white/5 px-1.5 py-0.5 rounded cursor-pointer transition"
                title="Click to copy binary"
              >
                <span className="text-purple-400 font-bold">BIN</span>
                <span className="flex items-center gap-1 font-mono tracking-wider">
                  {binVal}
                  {copiedField === "prog-bin" && <GIconCheck size={10} className="text-emerald-400" />}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Converter Mode View */}
      {mode === "converter" && (
        <div className="flex-1 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/10 p-3.5 space-y-3.5 flex flex-col justify-between overflow-y-auto thin-scroll">
          {/* Unit Category Pills */}
          <div className="grid grid-cols-4 gap-1">
            {(["length", "weight", "data", "temp"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  playClick();
                  setConvertType(t);
                  if (t === "length") { setConvertFromUnit("m"); setConvertToUnit("ft"); }
                  if (t === "weight") { setConvertFromUnit("kg"); setConvertToUnit("lb"); }
                  if (t === "data") { setConvertFromUnit("gb"); setConvertToUnit("mb"); }
                  if (t === "temp") { setConvertFromUnit("c"); setConvertToUnit("f"); }
                }}
                className={`py-1.5 rounded-xl text-xs capitalize transition-all font-medium cursor-pointer ${
                  convertType === t
                    ? "bg-accent text-white shadow-md shadow-accent/25"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* From Input Card */}
          <div className="bg-black/30 rounded-xl border border-white/10 p-2.5">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10.5px] uppercase tracking-wider text-white/50 font-semibold">From</label>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={convertInput}
                onChange={(e) => setConvertInput(e.target.value)}
                className="w-3/5 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                placeholder="Value..."
              />
              <CustomDropdown
                value={convertFromUnit}
                onChange={(val) => setConvertFromUnit(val)}
                options={CONVERT_UNIT_OPTIONS[convertType] || []}
                containerClassName="w-2/5"
                className="w-full justify-between rounded-lg py-1.5 uppercase font-mono text-xs"
                size="sm"
                align="right"
              />
            </div>
          </div>

          {/* Swap Units Button */}
          <div className="flex justify-center -my-1">
            <button
              onClick={swapUnits}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/70 hover:text-white transition shadow-sm cursor-pointer"
              title="Swap units"
            >
              ⇄
            </button>
          </div>

          {/* To Converted Result Card */}
          <div className="bg-black/30 rounded-xl border border-white/10 p-2.5">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10.5px] uppercase tracking-wider text-white/50 font-semibold">To</label>
              <button
                onClick={() => copyToClipboard(String(convertResult), "converter-res", "Converted value")}
                className="text-[10px] text-accent hover:underline flex items-center gap-1 cursor-pointer font-mono"
              >
                {copiedField === "converter-res" ? (
                  <>
                    <GIconCheck size={10} className="text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <GIconCopy size={10} /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <div className="w-3/5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-accent font-mono text-sm truncate flex items-center font-bold">
                {convertResult}
              </div>
              <CustomDropdown
                value={convertToUnit}
                onChange={(val) => setConvertToUnit(val)}
                options={CONVERT_UNIT_OPTIONS[convertType] || []}
                containerClassName="w-2/5"
                className="w-full justify-between rounded-lg py-1.5 uppercase font-mono text-xs"
                size="sm"
                align="right"
              />
            </div>
          </div>
        </div>
      )}

      {/* Keypad Grid for Standard, Scientific & Programmer Modes */}
      {mode !== "converter" && (
        <div className="flex-1 flex flex-col justify-end gap-1.5">
          {/* Scientific Mode Extra Rows */}
          {mode === "scientific" && (
            <div className="grid grid-cols-4 gap-1 text-xs font-mono">
              <button
                onClick={() => { playClick(); setIsSecond(!isSecond); }}
                className={`p-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  isSecond
                    ? "bg-amber-400/25 border-amber-400/50 text-amber-300"
                    : "bg-white/5 border-white/5 hover:bg-white/10 text-white/70"
                }`}
                title="Toggle 2nd Functions"
              >
                2nd
              </button>
              <button
                onClick={() => performScientific(isSecond ? "asin" : "sin")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 active:scale-95 transition cursor-pointer"
              >
                {isSecond ? "sin⁻¹" : "sin"}
              </button>
              <button
                onClick={() => performScientific(isSecond ? "acos" : "cos")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 active:scale-95 transition cursor-pointer"
              >
                {isSecond ? "cos⁻¹" : "cos"}
              </button>
              <button
                onClick={() => performScientific(isSecond ? "atan" : "tan")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 active:scale-95 transition cursor-pointer"
              >
                {isSecond ? "tan⁻¹" : "tan"}
              </button>

              <button
                onClick={() => performScientific(isSecond ? "cbrt" : "sqrt")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 active:scale-95 transition cursor-pointer"
              >
                {isSecond ? "∛x" : "√x"}
              </button>
              <button
                onClick={() => performScientific(isSecond ? "cube" : "sq")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 active:scale-95 transition cursor-pointer"
              >
                {isSecond ? "x³" : "x²"}
              </button>
              <button
                onClick={() => performScientific(isSecond ? "exp" : "ln")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 active:scale-95 transition cursor-pointer"
              >
                {isSecond ? "eˣ" : "ln"}
              </button>
              <button
                onClick={() => performScientific(isSecond ? "tenPow" : "log")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 active:scale-95 transition cursor-pointer"
              >
                {isSecond ? "10ˣ" : "log"}
              </button>

              <button
                onClick={() => { playClick(); setDisplay(String(Math.PI)); setWaitingForOperand(false); }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-amber-300 active:scale-95 transition cursor-pointer font-bold"
              >
                π
              </button>
              <button
                onClick={() => { playClick(); setDisplay(String(Math.E)); setWaitingForOperand(false); }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-amber-300 active:scale-95 transition cursor-pointer font-bold"
              >
                e
              </button>
              <button
                onClick={() => performScientific("inv")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 active:scale-95 transition cursor-pointer"
              >
                1/x
              </button>
              <button
                onClick={() => performOperation("^")}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isOpActive("^")
                    ? "bg-amber-400 text-slate-950 font-bold border-amber-400"
                    : "bg-white/5 border-white/5 hover:bg-white/10 text-amber-300 font-bold"
                }`}
              >
                xʸ
              </button>
            </div>
          )}

          {/* Programmer Bitwise Extras Row */}
          {mode === "programmer" && (
            <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
              <button
                onClick={() => performOperation("AND")}
                className={`py-1.5 px-1 rounded-xl border transition cursor-pointer ${
                  isOpActive("AND") ? "bg-sky-400 text-slate-950 font-bold" : "bg-white/5 border-white/5 hover:bg-white/10 text-sky-300"
                }`}
              >
                AND
              </button>
              <button
                onClick={() => performOperation("OR")}
                className={`py-1.5 px-1 rounded-xl border transition cursor-pointer ${
                  isOpActive("OR") ? "bg-sky-400 text-slate-950 font-bold" : "bg-white/5 border-white/5 hover:bg-white/10 text-sky-300"
                }`}
              >
                OR
              </button>
              <button
                onClick={() => performOperation("XOR")}
                className={`py-1.5 px-1 rounded-xl border transition cursor-pointer ${
                  isOpActive("XOR") ? "bg-sky-400 text-slate-950 font-bold" : "bg-white/5 border-white/5 hover:bg-white/10 text-sky-300"
                }`}
              >
                XOR
              </button>
              <button
                onClick={() => {
                  playClick();
                  const num = Math.floor(parseFloat(display) || 0);
                  setDisplay(String(~num));
                }}
                className="py-1.5 px-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sky-300 transition cursor-pointer"
              >
                NOT
              </button>

              <button
                onClick={() => performOperation("<<")}
                className={`py-1.5 px-1 rounded-xl border transition cursor-pointer ${
                  isOpActive("<<") ? "bg-emerald-400 text-slate-950 font-bold" : "bg-white/5 border-white/5 hover:bg-white/10 text-emerald-300"
                }`}
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => performOperation(">>")}
                className={`py-1.5 px-1 rounded-xl border transition cursor-pointer ${
                  isOpActive(">>") ? "bg-emerald-400 text-slate-950 font-bold" : "bg-white/5 border-white/5 hover:bg-white/10 text-emerald-300"
                }`}
              >
                &gt;&gt;
              </button>
              <button
                onClick={() => { playClick(); setDisplay(String(parsedNum >>> 0)); }}
                className="py-1.5 px-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 transition cursor-pointer"
              >
                UINT
              </button>
              <button
                onClick={handleBackspace}
                className="py-1.5 px-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-rose-300 transition cursor-pointer"
              >
                ⌫
              </button>
            </div>
          )}

          {/* Standard Numeric Keypad with macOS / Fluent Polish */}
          <div className="grid grid-cols-4 gap-1.5 text-sm sm:text-base font-medium pb-1">
            <button
              onClick={display === "0" && prevValue === null ? clearAll : clearEntry}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 text-rose-400 font-semibold border border-white/10 transition cursor-pointer"
              title={display === "0" ? "All Clear" : "Clear Entry"}
            >
              {display === "0" && prevValue === null ? "AC" : "C"}
            </button>
            <button
              onClick={toggleSign}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 text-white/75 border border-white/10 transition cursor-pointer"
              title="Negate"
            >
              ±
            </button>
            <button
              onClick={inputPercent}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 text-white/75 border border-white/10 transition cursor-pointer"
              title="Percent"
            >
              %
            </button>
            <button
              onClick={() => performOperation("÷")}
              className={`py-2 sm:py-2.5 px-2 rounded-xl font-bold text-base sm:text-lg active:scale-95 transition cursor-pointer border ${
                isOpActive("÷")
                  ? "bg-accent text-white border-accent shadow-[0_0_12px_rgba(0,145,255,0.5)] ring-2 ring-accent/50"
                  : "bg-accent/20 hover:bg-accent/30 text-accent border-accent/25"
              }`}
            >
              ÷
            </button>

            <button
              onClick={() => inputDigit(7)}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white border border-white/[0.06] transition cursor-pointer"
            >
              7
            </button>
            <button
              onClick={() => inputDigit(8)}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white border border-white/[0.06] transition cursor-pointer"
            >
              8
            </button>
            <button
              onClick={() => inputDigit(9)}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white border border-white/[0.06] transition cursor-pointer"
            >
              9
            </button>
            <button
              onClick={() => performOperation("×")}
              className={`py-2 sm:py-2.5 px-2 rounded-xl font-bold text-base sm:text-lg active:scale-95 transition cursor-pointer border ${
                isOpActive("×")
                  ? "bg-accent text-white border-accent shadow-[0_0_12px_rgba(0,145,255,0.5)] ring-2 ring-accent/50"
                  : "bg-accent/20 hover:bg-accent/30 text-accent border-accent/25"
              }`}
            >
              ×
            </button>

            <button
              onClick={() => inputDigit(4)}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white border border-white/[0.06] transition cursor-pointer"
            >
              4
            </button>
            <button
              onClick={() => inputDigit(5)}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white border border-white/[0.06] transition cursor-pointer"
            >
              5
            </button>
            <button
              onClick={() => inputDigit(6)}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white border border-white/[0.06] transition cursor-pointer"
            >
              6
            </button>
            <button
              onClick={() => performOperation("-")}
              className={`py-2 sm:py-2.5 px-2 rounded-xl font-bold text-base sm:text-lg active:scale-95 transition cursor-pointer border ${
                isOpActive("-")
                  ? "bg-accent text-white border-accent shadow-[0_0_12px_rgba(0,145,255,0.5)] ring-2 ring-accent/50"
                  : "bg-accent/20 hover:bg-accent/30 text-accent border-accent/25"
              }`}
            >
              −
            </button>

            <button
              onClick={() => inputDigit(1)}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white border border-white/[0.06] transition cursor-pointer"
            >
              1
            </button>
            <button
              onClick={() => inputDigit(2)}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white border border-white/[0.06] transition cursor-pointer"
            >
              2
            </button>
            <button
              onClick={() => inputDigit(3)}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white border border-white/[0.06] transition cursor-pointer"
            >
              3
            </button>
            <button
              onClick={() => performOperation("+")}
              className={`py-2 sm:py-2.5 px-2 rounded-xl font-bold text-base sm:text-lg active:scale-95 transition cursor-pointer border ${
                isOpActive("+")
                  ? "bg-accent text-white border-accent shadow-[0_0_12px_rgba(0,145,255,0.5)] ring-2 ring-accent/50"
                  : "bg-accent/20 hover:bg-accent/30 text-accent border-accent/25"
              }`}
            >
              +
            </button>

            <button
              onClick={() => inputDigit(0)}
              className="col-span-2 py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white border border-white/[0.06] transition text-left pl-5 cursor-pointer"
            >
              0
            </button>
            <button
              onClick={inputDecimal}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] active:bg-white/[0.16] active:scale-95 text-white font-bold border border-white/[0.06] transition cursor-pointer"
            >
              .
            </button>
            <button
              onClick={handleEquals}
              className="py-2 sm:py-2.5 px-2 rounded-xl bg-gradient-to-r from-accent to-blue-600 hover:brightness-110 active:scale-95 text-white font-bold text-base sm:text-lg shadow-lg shadow-accent/25 transition cursor-pointer"
            >
              =
            </button>
          </div>
        </div>
      )}

      {/* History Drawer Modal */}
      {showHistory && (
        <div className="absolute inset-x-2 top-11 bottom-2 bg-slate-950/95 backdrop-blur-2xl rounded-2xl border border-white/15 p-3 flex flex-col z-40 shadow-2xl animate-scaleIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs shrink-0">
            <span className="font-semibold text-white/90 flex items-center gap-1.5">
              <GIconHistory size={13} className="text-accent" /> Calculation Tape
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={exportHistory}
                disabled={historyList.length === 0}
                className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition disabled:opacity-30 cursor-pointer"
                title="Download history tape"
              >
                <GIconDownload size={13} />
              </button>
              <button
                onClick={() => { playClick(); setHistoryList([]); }}
                disabled={historyList.length === 0}
                className="p-1 rounded text-white/50 hover:text-rose-400 hover:bg-white/10 transition disabled:opacity-30 cursor-pointer"
                title="Clear history tape"
              >
                <GIconTrash size={13} />
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Close history (Esc)"
              >
                <GIconClose size={13} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto thin-scroll space-y-1.5 font-mono text-xs pr-0.5">
            {historyList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-white/30 space-y-2">
                <GIconHistory size={24} className="opacity-30" />
                <p>No calculation history yet.</p>
                <span className="text-[10px] text-white/20">Calculations will be saved automatically here.</span>
              </div>
            ) : (
              historyList.map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    playClick();
                    setDisplay(h.result);
                    setShowHistory(false);
                    notify("Loaded from History", `${h.result}`, "info");
                  }}
                  className="group p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] active:bg-white/[0.14] border border-white/5 hover:border-accent/40 cursor-pointer transition flex items-center justify-between"
                  title="Click to load result into calculator"
                >
                  <div className="truncate mr-2 min-w-0">
                    <span className="text-white/50 group-hover:text-white/70 block truncate text-[11px]">{h.expression}</span>
                    <span className="text-[9.5px] text-white/30 block mt-0.5">{new Date(h.ts).toLocaleTimeString()}</span>
                  </div>
                  <span className="text-accent font-bold shrink-0 text-sm">= {h.result}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
