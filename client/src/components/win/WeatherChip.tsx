import { useEffect, useState } from "react";
import {
  GIconSun,
  GIconCloud,
  GIconClouds,
  GIconDroplet,
  GIconSnowflake,
} from "../icons/GravityIcons";
import { useOS } from "../../store/useOS";
import { API_URL } from "../../lib/config";

const CODE_MAP: Record<number, { label: string; Icon: any }> = {
  0: { label: "Clear", Icon: GIconSun },
  1: { label: "Mostly clear", Icon: GIconSun },
  2: { label: "Partly cloudy", Icon: GIconClouds },
  3: { label: "Mostly cloudy", Icon: GIconCloud },
  45: { label: "Foggy", Icon: GIconClouds },
  48: { label: "Foggy", Icon: GIconClouds },
  51: { label: "Drizzle", Icon: GIconDroplet },
  61: { label: "Rain", Icon: GIconDroplet },
  63: { label: "Rain", Icon: GIconDroplet },
  65: { label: "Heavy rain", Icon: GIconDroplet },
  80: { label: "Showers", Icon: GIconDroplet },
  95: { label: "Storms", Icon: GIconDroplet },
  71: { label: "Snow", Icon: GIconSnowflake },
};

export default function WeatherChip({ compact = false }: { compact?: boolean }) {
  const loc = useOS((s) => s.weatherLoc);
  const [weather, setWeather] = useState<any>(() => ({ temperature_2m: 31, weather_code: 2 }));

  useEffect(() => {
    let active = true;
    const fetchChipWeather = async () => {
      // 1. Try local/cloud backend proxy first
      try {
        const res = await fetch(`${API_URL}/api/weather?lat=${loc.lat}&lon=${loc.lon}`);
        if (res.ok) {
          const d = await res.json();
          if (active && d?.current) {
            setWeather(d.current);
            return;
          }
        }
      } catch {}

      // 2. Direct external API fallback
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code&timezone=auto`;
        const res = await fetch(url);
        if (res.ok) {
          const d = await res.json();
          if (active && d?.current) {
            setWeather(d.current);
          }
        }
      } catch {}
    };

    fetchChipWeather();
    return () => {
      active = false;
    };
  }, [loc.lat, loc.lon]);

  const code = weather?.weather_code ?? 2;
  const info = CODE_MAP[code] || CODE_MAP[2];
  const Icon = info.Icon;
  const temp = weather ? Math.round(weather.temperature_2m) : 31;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 h-10 rounded-xl hover:bg-white/10 active:bg-white/15 transition cursor-default">
      <Icon size={compact ? 16 : 18} className="text-sky-300 shrink-0" strokeWidth={1.75} />
      <div className="text-xs leading-tight text-left">
        <div className="font-semibold">{temp !== null ? `${temp}°C` : "31°C"}</div>
        {!compact && <div className="text-white/50 text-[10px]">{info.label}</div>}
      </div>
    </div>
  );
}
