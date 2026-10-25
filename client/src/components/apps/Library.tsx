import { useEffect, useState } from "react";
import { GIconExternalLink, GIconGithub } from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { fallbackProjects } from "../../data/projects";

export default function Library() {
  const [projects, setProjects] = useState(fallbackProjects);
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/projects`)
      .then((r) => r.json())
      .then((data) => data.length && setProjects(data))
      .catch(() => {});
  }, []);

  const categories = ["All", ...new Set(projects.map((p) => p.category))];
  const shown = filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Library</h2>
          <p className="text-xs text-white/50">Projects, shipped and still-shipping.</p>
        </div>
        <div className="flex gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-xs px-2.5 py-1 rounded-full border ${
                filter === c ? "bg-accent border-accent" : "border-white/15 text-white/60 hover:border-white/30"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shown.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p)}
            className="text-left rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-accent/60 transition group"
          >
            <div className="h-28 overflow-hidden">
              <img src={p.cover} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-3">
              <div className="text-sm font-medium">{p.title}</div>
              <div className="text-[11px] text-white/45 mt-0.5">{p.year} · {p.category}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {p.stack.slice(0, 3).map((s) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/60">{s}</span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6" onClick={() => setActive(null)}>
          <div className="glass rounded-2xl max-w-lg w-full p-5" onClick={(e) => e.stopPropagation()}>
            <img src={active.cover} alt={active.title} className="w-full h-40 object-cover rounded-lg mb-3" />
            <h3 className="font-display text-base font-semibold">{active.title}</h3>
            <p className="text-xs text-white/50 mb-2">{active.year} · {active.category}</p>
            <p className="text-sm text-white/80 leading-relaxed mb-3">{active.summary}</p>
            <ul className="text-xs text-white/70 space-y-1 mb-3 list-disc list-inside">
              {active.highlights.map((h) => <li key={h}>{h}</li>)}
            </ul>
            <div className="flex flex-wrap gap-1 mb-3">
              {active.stack.map((s) => <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/60">{s}</span>)}
            </div>
            <div className="flex gap-2">
              {active.links.live && (
                <a href={active.links.live} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white">
                  <GIconExternalLink size={12} /> Live
                </a>
              )}
              {active.links.repo && (
                <a href={active.links.repo} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-white/80 hover:text-white">
                  <GIconGithub size={12} /> Code
                </a>
              )}
              <button onClick={() => setActive(null)} className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
