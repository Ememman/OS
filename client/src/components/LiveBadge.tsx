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

  return (
    <div
      role="status"
      aria-label={label}
      title={label}
      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/80"
    >
      {!compact && (
        <span className="text-[10px] font-medium">
          {isLive ? "Live" : apiStatus === "available" ? "Reconnecting" : apiStatus === "checking" ? "Checking" : "Offline"}
        </span>
      )}
      <span className={`text-[10px] ${isLive ? "font-mono font-semibold text-accent" : "font-medium"}`}>
        {compact ? compactLabel : isLive ? online : apiStatus === "available" ? "API ready" : ""}
      </span>
    </div>
  );
}
