import { usePresence } from "../lib/usePresence";

export default function LiveBadge({ compact = false }) {
  const { online, connected } = usePresence();

  if (!connected || online === null) return null;

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/8 border border-white/10"
      title={`${online} visitor${online === 1 ? "" : "s"} online right now`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
      </span>
      {!compact && <span className="text-[10px] text-white/60">Live</span>}
      <span className="text-[10px] font-mono text-white/80">{online}</span>
    </div>
  );
}
