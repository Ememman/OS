import { useState, useRef } from "react";

export default function DesktopIcon({ icon: Icon, label, onOpen, style }) {
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
      className="absolute flex flex-col items-center gap-1 w-20 py-2 rounded-lg outline-none"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${selected ? "bg-white/25" : "bg-white/12"}`}>
        <Icon size={22} className="text-white/90" />
      </div>
      <span className={`text-[11px] text-white text-center leading-tight px-1 rounded ${selected ? "bg-blue-500/70" : ""}`} style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
        {label}
      </span>
    </button>
  );
}
