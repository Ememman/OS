import { useEffect, useState } from "react";
import { GIconHeart, GIconWrench, GIconSparkles, GIconRocket } from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { getSocket } from "../../lib/socket";

const TAG_META: Record<string, { label: string; Icon: any; color: string }> = {
  fix: { label: "Fix", Icon: GIconWrench, color: "#D98A4E" },
  feature: { label: "Feature", Icon: GIconSparkles, color: "#5FBF7C" },
  launch: { label: "Launch", Icon: GIconRocket, color: "#8E7BE0" },
};

export default function Updates() {
  const [updates, setUpdates] = useState([]);
  const [reactions, setReactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [justReacted, setJustReacted] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/updates`).then((r) => r.json()),
      fetch(`${API_URL}/api/updates/reactions`).then((r) => r.json()).catch(() => ({}))
    ])
      .then(([u, r]) => {
        setUpdates(u);
        setReactions(r || {});
      })
      .catch(() => setUpdates([]))
      .finally(() => setLoading(false));
  }, []);

  // Live sync — when anyone (on any device) reacts to an update, everyone
  // currently viewing this app sees the count update instantly.
  useEffect(() => {
    const socket = getSocket();
    const onReacted = ({ id, count }) => setReactions((r) => ({ ...r, [id]: count }));
    socket.on("update:reacted", onReacted);
    return () => socket.off("update:reacted", onReacted);
  }, []);

  const react = (id) => {
    setJustReacted(id);
    setTimeout(() => setJustReacted(null), 400);
    fetch(`${API_URL}/api/updates/${id}/react`, { method: "POST" }).catch(() => {});
  };

  return (
    <div className="p-4">
      <div className="mb-3">
        <h2 className="font-display text-lg font-semibold">Updates</h2>
        <p className="text-xs text-white/50">What's shipping on this portfolio and the projects behind it.</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 animate-pulse">
              <div className="h-3 w-16 bg-white/10 rounded-full mb-2.5" />
              <div className="h-3.5 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-2.5 w-full bg-white/8 rounded mb-1.5" />
              <div className="h-2.5 w-2/3 bg-white/8 rounded" />
            </div>
          ))}
        </div>
      )}
      {!loading && updates.length === 0 && (
        <p className="text-xs text-white/40">No updates yet — start the API server to see live entries.</p>
      )}

      <div className="space-y-3">
        {updates.map((u) => {
          const meta = TAG_META[u.tag] || TAG_META.feature;
          const Icon = meta.Icon;
          return (
            <div key={u.id} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${meta.color}22`, color: meta.color }}>
                  <Icon size={10} /> {meta.label}
                </span>
                <span className="text-[10px] text-white/40">{new Date(u.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="text-sm font-medium mb-1">{u.title}</div>
              <p className="text-xs text-white/65 leading-relaxed">{u.body}</p>
              <button onClick={() => react(u.id)} className="mt-2 flex items-center gap-1.5 text-[11px] text-white/50 hover:text-rose-300 transition-colors">
                <GIconHeart size={12} className={`transition-transform ${justReacted === u.id ? "scale-150 text-rose-400" : ""}`} />
                {reactions[u.id] || 0}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
