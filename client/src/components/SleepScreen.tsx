import { useEffect, useState } from "react";
import { useOS } from "../store/useOS";
import { GIconPower } from "./icons/GravityIcons";

export default function SleepScreen() {
  const { setSleeping } = useOS();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setDate(d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleWake = () => setSleeping(false);
    window.addEventListener("keydown", handleWake);
    return () => window.removeEventListener("keydown", handleWake);
  }, [setSleeping]);

  return (
    <div
      onClick={() => setSleeping(false)}
      className="fixed inset-0 z-[99998] bg-black/92 backdrop-blur-2xl flex flex-col items-center justify-between p-8 text-white select-none transition-all duration-300 cursor-pointer"
    >
      <div className="pt-12 text-center space-y-2">
        <h1 className="font-display text-4xl sm:text-6xl font-extralight tracking-tight text-white/95">
          {time}
        </h1>
        <p className="text-sm sm:text-base text-white/50 font-medium">
          {date}
        </p>
      </div>

      <div className="pb-8 text-center space-y-2">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2 text-white/50 animate-pulse">
          <GIconPower size={16} />
        </div>
        <p className="text-xs text-white/40 tracking-wider">
          Click anywhere or press any key to wake
        </p>
      </div>
    </div>
  );
}

