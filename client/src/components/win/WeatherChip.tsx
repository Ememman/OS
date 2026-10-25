import { useEffect, useState } from "react";
import {
  GIconSun,
  GIconCloud,
  GIconClouds,
  GIconDroplet,
  GIconSnowflake,
} from "../icons/GravityIcons";
import { useOS } from "../../store/useOS";

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

export default function WeatherChip({ compact = false }) {
  const loc = useOS((s) => s.weatherLoc);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code&timezone=auto`;
    fetch(url).then((r) => r.json()).then((d) => setWeather(d.current)).catch(() => {});
  }, [loc]);

  const code = weather?.weather_code ?? 2;
  const info = CODE_MAP[code] || CODE_MAP[2];
  const Icon = info.Icon;
  const temp = weather ? Math.round(weather.temperature_2m) : null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 h-10 rounded-xl hover:bg-white/10 active:bg-white/15 transition cursor-default">
      <Icon size={compact ? 16 : 18} className="text-sky-300 shrink-0" strokeWidth={1.75} />
      <div className="text-xs leading-tight text-left">
        <div className="font-semibold">{temp !== null ? `${temp}°C` : "…"}</div>
        {!compact && <div className="text-white/50 text-[10px]">{info.label}</div>}
      </div>
    </div>
  );
}
