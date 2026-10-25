import { useEffect, useState } from "react";

function AnalogClock({ hour, minute, second }) {
  const secAngle = second * 6;
  const minAngle = minute * 6 + second * 0.1;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const cx = 40, cy = 40, r = 36;

  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="#161a24" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const inner = i % 3 === 0 ? r - 7 : r - 5;
        const x1 = cx + Math.sin(a) * inner;
        const y1 = cy - Math.cos(a) * inner;
        const x2 = cx + Math.sin(a) * (r - 3);
        const y2 = cy - Math.cos(a) * (r - 3);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.6)" strokeWidth={i % 3 === 0 ? 2 : 1} strokeLinecap="round" />;
      })}
      <line x1={cx} y1={cy} x2={cx + Math.sin((hourAngle * Math.PI) / 180) * 18} y2={cy - Math.cos((hourAngle * Math.PI) / 180) * 18} stroke="white" strokeWidth="3.2" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.sin((minAngle * Math.PI) / 180) * 27} y2={cy - Math.cos((minAngle * Math.PI) / 180) * 27} stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.sin((secAngle * Math.PI) / 180) * 29} y2={cy - Math.cos((secAngle * Math.PI) / 180) * 29} stroke="rgb(var(--accent))" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="2.6" fill="rgb(var(--accent))" />
    </svg>
  );
}

export default function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const day = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="glass rounded-2xl px-4 py-3 shadow-xl w-full md:w-56 h-48 flex flex-col items-center justify-center gap-2 shrink-0">
      <AnalogClock hour={hour} minute={minute} second={second} />
      <div className="text-center">
        <div className="text-2xl font-display font-semibold font-mono tabular-nums leading-none">{time}</div>
        <div className="text-[11px] text-white/50 mt-1">{day}</div>
      </div>
    </div>
  );
}
