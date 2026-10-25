import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, CloudSun, CloudLightning, Snowflake, CloudFog, CloudDrizzle } from "lucide-react";
import { useOS } from "../../store/useOS";

const CODE_MAP = {
  0: { label: "Sunny", Icon: Sun },
  1: { label: "Mostly clear", Icon: CloudSun },
  2: { label: "Partly cloudy", Icon: CloudSun },
  3: { label: "Overcast", Icon: Cloud },
  45: { label: "Fog", Icon: CloudFog },
  48: { label: "Fog", Icon: CloudFog },
  51: { label: "Drizzle", Icon: CloudDrizzle },
  61: { label: "Rain", Icon: CloudRain },
  63: { label: "Rain", Icon: CloudRain },
  65: { label: "Heavy rain", Icon: CloudRain },
  80: { label: "Showers", Icon: CloudRain },
  95: { label: "Storms", Icon: CloudLightning },
  71: { label: "Snow", Icon: Snowflake }
};

export default function WeatherWidget() {
  const loc = useOS((s) => s.weatherLoc);
  const [current, setCurrent] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [minMax, setMinMax] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    setCurrent(null);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setCurrent(data.current);
        setMinMax(data.daily);
        const nowHour = new Date().getHours();
        const idx = data.hourly.time.findIndex((t) => new Date(t).getHours() === nowHour);
        const start = idx >= 0 ? idx : 0;
        const slice = data.hourly.time.slice(start, start + 6).map((t, i) => ({
          time: new Date(t),
          temp: Math.round(data.hourly.temperature_2m[start + i]),
          code: data.hourly.weather_code[start + i]
        }));
        setHourly(slice);
      })
      .catch(() => setError(true));
  }, [loc]);

  const code = current?.weather_code ?? 2;
  const info = CODE_MAP[code] || CODE_MAP[2];
  const Icon = info.Icon;
  const temp = current ? Math.round(current.temperature_2m) : null;

  return (
    <div
      className="rounded-2xl px-4 py-3 shadow-xl w-full md:w-56 h-48 flex flex-col justify-between text-white shrink-0"
      style={{ background: "linear-gradient(160deg, #1c3a63, #0d2340)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium">{loc.name}</div>
          <div className="text-3xl font-display font-semibold leading-none mt-1">
            {error ? "—" : temp !== null ? `${temp}°` : "…"}
          </div>
          {minMax && (
            <div className="text-[11px] text-white/60 mt-1">
              H:{Math.round(minMax.temperature_2m_max[0])}° L:{Math.round(minMax.temperature_2m_min[0])}°
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Icon size={26} className="text-amber-200" strokeWidth={1.75} />
          <span className="text-[10px] text-white/60 text-right">{error ? "Unavailable" : info.label}</span>
        </div>
      </div>

      <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
        {hourly.map((h, i) => {
          const HIcon = (CODE_MAP[h.code] || CODE_MAP[2]).Icon;
          return (
            <div key={i} className="flex flex-col items-center gap-1 text-[10px] text-white/70">
              <span>{i === 0 ? "Now" : h.time.toLocaleTimeString([], { hour: "numeric" })}</span>
              <HIcon size={14} className="text-white/85" strokeWidth={1.75} />
              <span>{h.temp}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
