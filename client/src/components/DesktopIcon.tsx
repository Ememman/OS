import { useState, useRef } from "react";

export default function DesktopIcon({ icon: Icon, label, onOpen, style, color }) {
  const [selected, setSelected] = useState(false);
  const lastTap = useRef(0);

  const handleClick = () => {
    setSelected(true);
    const now = Date.now();
    if (now - lastTap.current < 350) {
      onOpen();
    }
    lastTap.current = now;
  };

  return (
    <button
      onClick={handleClick}
      onDoubleClick={onOpen}
      onBlur={() => setSelected(false)}
      style={style}
      className={`group flex flex-col items-center gap-1.5 w-20 py-2 rounded-xl outline-none transition-all duration-200 hover:scale-105 active:scale-95 ${
        selected ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
          selected
            ? "bg-white/25 border-accent shadow-lg shadow-accent/25"
            : "bg-[#0c1220]/75 backdrop-blur-md border-white/15 group-hover:border-white/30 group-hover:bg-[#0c1220]/90 shadow-lg shadow-black/40"
        }`}
        style={color ? { boxShadow: selected ? `0 0 16px ${color}55` : undefined } : undefined}
      >
        <Icon size={24} className="text-white/90 group-hover:text-white transition-colors" color={color} />
      </div>
      <span
        className={`text-[11px] font-medium text-white text-center leading-tight px-1.5 py-0.5 rounded-md ${
          selected ? "bg-accent text-white shadow-sm" : "group-hover:text-white text-white/90"
        }`}
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
      >
        {label}
      </span>
    </button>
  );
}
