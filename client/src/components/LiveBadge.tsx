import { usePresence } from "../lib/usePresence";

export default function LiveBadge({ compact = false }) {
  const { online, connected, apiStatus } = usePresence();

  const isLive = connected && online !== null;
  const label = isLive
    ? `${online} visitor${online === 1 ? "" : "s"} online right now. API is available.`
    : apiStatus === "available"
      ? "API is available. Live visitor updates are reconnecting."
      : apiStatus === "checking"
        ? "Checking Portfolio OS service status."
        : "Portfolio OS API is unavailable. Live updates are offline.";
  const compactLabel = isLive
    ? online
    : apiStatus === "checking"
      ? "…"
      : apiStatus === "available"
        ? "API"
        : "Offline";
  const indicatorColor = isLive || apiStatus === "available"
    ? "bg-emerald-400"
    : apiStatus === "unavailable"
      ? "bg-rose-400"
      : "bg-amber-400";

  return (
    <div
      role="status"
      aria-label={label}
      title={label}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/80"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {isLive && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${indicatorColor} opacity-50`} />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${indicatorColor}`} />
      </span>
      {!compact && <span className="text-[10px]">{isLive ? "Live" : apiStatus === "available" ? "Reconnecting" : apiStatus === "checking" ? "Checking" : "Offline"}</span>}
      <span className={`text-[10px] ${isLive ? "font-mono" : "font-medium"}`}>
        {compact ? compactLabel : isLive ? online : apiStatus === "available" ? "API ready" : ""}
      </span>
    </div>
  );
}
