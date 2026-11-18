import { useEffect, useState, useCallback } from "react";
import {
  GIconSun,
  GIconCloud,
  GIconClouds,
  GIconDroplet,
  GIconSnowflake,
  GIconRotateRight,
} from "../icons/GravityIcons";
import { useOS } from "../../store/useOS";
import { API_URL } from "../../lib/config";

const CODE_MAP: Record<number, { label: string; Icon: any }> = {
  0: { label: "Sunny", Icon: GIconSun },
  1: { label: "Mostly clear", Icon: GIconSun },
  2: { label: "Partly cloudy", Icon: GIconClouds },
  3: { label: "Overcast", Icon: GIconCloud },
  45: { label: "Fog", Icon: GIconClouds },
  48: { label: "Fog", Icon: GIconClouds },
  51: { label: "Drizzle", Icon: GIconDroplet },
  61: { label: "Rain", Icon: GIconDroplet },
  63: { label: "Rain", Icon: GIconDroplet },
  65: { label: "Heavy rain", Icon: GIconDroplet },
  80: { label: "Showers", Icon: GIconDroplet },
  95: { label: "Storms", Icon: GIconDroplet },
  71: { label: "Snow", Icon: GIconSnowflake },
};

interface HourlyForecastItem {
  time: Date;
  temp: number;
  code: number;
}

function generateFallbackHourly(baseTemp = 31, baseCode = 2): HourlyForecastItem[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getTime() + i * 3600000);
    const tempOffset = i === 0 ? 0 : i === 1 ? 0 : i === 2 ? -1 : i === 3 ? -2 : i === 4 ? -2 : -3;
    return {
      time: d,
      temp: baseTemp + tempOffset,
      code: baseCode,
    };
  });
}

export default function WeatherWidget() {
  const loc = useOS((s) => s.weatherLoc);
  const [current, setCurrent] = useState<any>(() => ({
    temperature_2m: 31,
    apparent_temperature: 35,
    weather_code: 2,
    relative_humidity_2m: 65,
  }));
  const [hourly, setHourly] = useState<HourlyForecastItem[]>(() => generateFallbackHourly(31, 2));
  const [minMax, setMinMax] = useState<{ max: number; min: number } | null>({ max: 33, min: 26 });
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    let loadedData: any = null;

    // 1. Try local/cloud backend proxy first (cached & resilient)
    try {
      const serverRes = await fetch(`${API_URL}/api/weather?lat=${loc.lat}&lon=${loc.lon}`, {
        headers: { Accept: "application/json" },
      });
      if (serverRes.ok) {
        loadedData = await serverRes.json();
      }
    } catch {
      // Fallback to direct external API
    }

    // 2. Try Open-Meteo direct API if server didn't supply full data
    if (!loadedData || !loadedData.current) {
      try {
        const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;
        const directRes = await fetch(directUrl);
        if (directRes.ok) {
          loadedData = await directRes.json();
        }
      } catch {
        // Fallback to internal cache/model
      }
    }

    if (loadedData && loadedData.current) {
      setCurrent(loadedData.current);
      setIsLive(!loadedData.fallback);

      if (loadedData.daily?.temperature_2m_max?.[0] !== undefined) {
        setMinMax({
          max: Math.round(loadedData.daily.temperature_2m_max[0]),
          min: Math.round(loadedData.daily.temperature_2m_min[0]),
        });
      }

      // Parse hourly forecast robustly
      let parsedHourly: HourlyForecastItem[] = [];
      if (loadedData.hourly?.time && Array.isArray(loadedData.hourly.time)) {
        const nowMs = Date.now();
        let idx = loadedData.hourly.time.findIndex((t: string) => {
          const tMs = new Date(t).getTime();
          return Math.abs(tMs - nowMs) < 1800000 || tMs >= nowMs;
        });
        if (idx < 0) idx = 0;

        for (let i = 0; i < 6; i++) {
          const itemIdx = idx + i;
          if (itemIdx < loadedData.hourly.time.length) {
            parsedHourly.push({
              time: new Date(loadedData.hourly.time[itemIdx]),
              temp: Math.round(loadedData.hourly.temperature_2m?.[itemIdx] ?? (loadedData.current.temperature_2m ?? 31)),
              code: loadedData.hourly.weather_code?.[itemIdx] ?? (loadedData.current.weather_code ?? 2),
            });
          }
        }
      }

      if (parsedHourly.length < 6) {
        parsedHourly = generateFallbackHourly(
          Math.round(loadedData.current.temperature_2m ?? 31),
          loadedData.current.weather_code ?? 2
        );
      }
      setHourly(parsedHourly);
    } else {
      // Offline fallback guarantee
      setHourly(generateFallbackHourly(31, 2));
    }

    setIsLoading(false);
  }, [loc.lat, loc.lon]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const code = current?.weather_code ?? 2;
  const info = CODE_MAP[code] || CODE_MAP[2];
  const Icon = info.Icon;
  const temp = current ? Math.round(current.temperature_2m) : 31;
  const feelsLike = current?.apparent_temperature ? Math.round(current.apparent_temperature) : null;

  return (
    <div
      className="group relative rounded-2xl p-3 sm:p-4 shadow-xl w-full md:w-56 h-48 flex flex-col justify-between text-white shrink-0 select-none overflow-hidden transition-all hover:shadow-2xl"
      style={{ background: "linear-gradient(160deg, #1c3a63, #0d2340)" }}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white truncate">{loc.name}</span>
            {isLive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-xs" title="Live Weather Stream" />
            )}
          </div>
          <div className="text-3xl font-display font-bold leading-none mt-1 tracking-tight">
            {temp}°
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/65 mt-1 font-mono">
            {minMax && <span>H:{minMax.max}° L:{minMax.min}°</span>}
            {feelsLike && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-white/50 text-[10px]">Feels {feelsLike}°</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
          <div className="flex items-center gap-1.5">
            <Icon size={26} className="text-amber-200 drop-shadow-sm" strokeWidth={1.75} />
            <button
              onClick={fetchWeather}
              disabled={isLoading}
              className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer opacity-0 group-hover:opacity-100"
              title="Refresh weather data"
            >
              <GIconRotateRight size={12} className={isLoading ? "animate-spin text-sky-400" : ""} />
            </button>
          </div>
          <span className="text-[10.5px] font-medium text-white/70 text-right">{info.label}</span>
        </div>
      </div>

      {/* Hourly Forecast Row */}
      <div className="mt-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-white/40 text-[9px] uppercase tracking-wider font-semibold mb-1">
          <span>Hourly Forecast</span>
          <span className="font-mono lowercase text-[9px] text-white/30">next 6h</span>
        </div>
        <div className="grid grid-cols-6 gap-1 text-center">
          {hourly.map((h, i) => {
            const HIcon = (CODE_MAP[h.code] || CODE_MAP[2]).Icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-white/5 transition"
              >
                <span className="text-[9.5px] text-white/60 font-mono">
                  {i === 0 ? "Now" : h.time.toLocaleTimeString([], { hour: "numeric", hour12: true }).replace(" ", "")}
                </span>
                <HIcon size={14} className="text-white/85 my-0.5" strokeWidth={1.75} />
                <span className="text-[10.5px] font-semibold text-white font-mono">{h.temp}°</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
