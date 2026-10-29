import { useState, useEffect, useCallback } from "react";
import { soundFx } from "../../lib/soundFx";
import { useOS } from "../../store/useOS";

export default function Calculator() {
  const { systemSounds } = useOS();
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [historyTape, setHistoryTape] = useState("");
  const [memory, setMemory] = useState(0);

  const playClick = useCallback(() => {
    if (systemSounds) soundFx.playClick();
  }, [systemSounds]);

  const inputDigit = useCallback((digit) => {
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

  const calculate = (a, b, op) => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×":
      case "*": return a * b;
      case "÷":
      case "/": return b !== 0 ? a / b : "Error";
      default: return b;
    }
  };

  const performOperation = useCallback((nextOp) => {
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
      setHistoryTape(`${prevValue} ${operation} ${inputValue} =`);
      setDisplay(String(result));
    }
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  }, [prevValue, display, operation, playClick]);

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
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

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
      {/* Display */}
      <div className="flex flex-col items-end justify-end p-3.5 bg-black/40 rounded-xl border border-white/10 mb-3 min-h-\[90px]">
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

      {/* Buttons Keypad */}
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
  );
}
