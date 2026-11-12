import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GIconExternalLink,
  GIconGithub,
  GIconSearch,
  GIconHeart,
  GIconStar,
  GIconClose,
  GIconCode,
  GIconPaperPlane,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { fallbackProjects, type ProjectItem } from "../../data/projects";
import { getSocket } from "../../lib/socket";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import osImg from "../../assets/os.png";
import flashCardsImg from "../../assets/flash-cards.png";
import quizAppImg from "../../assets/quiz-app.png";

export interface FeedbackItem {
  id: string;
  projectId: string;
  author: string;
  role: string;
  rating: number;
  comment: string;
  ts: number;
}

const PROJECT_PREVIEWS: Record<string, string> = {
  "os-portfolio": osImg,
  os: osImg,
  "flash-cards": flashCardsImg,
  flashcards: flashCardsImg,
  "quiz-app": quizAppImg,
  quiz: quizAppImg,
};

function getProjectCover(p: ProjectItem): string | null {
  const normId = p.id?.toLowerCase().trim() || "";
  if (PROJECT_PREVIEWS[normId]) {
    return PROJECT_PREVIEWS[normId];
  }
  const normTitle = p.title?.toLowerCase().trim() || "";
  if (normTitle.includes("portfolio os") || normTitle === "os") return osImg;
  if (normTitle.includes("flash-card") || normTitle.includes("flash card")) return flashCardsImg;
  if (normTitle.includes("quiz-app") || normTitle.includes("quiz app") || normTitle.includes("quiz")) return quizAppImg;

  // Only allow explicit non-stock image covers if provided
  if (p.cover && !p.cover.includes("unsplash.com") && !p.cover.includes("placeholder")) {
    return p.cover;
  }
  return null;
}

function getProjectCategories(p: ProjectItem): string[] {
  if (Array.isArray(p.categories) && p.categories.length > 0) {
    return p.categories;
  }
  if (p.category) {
    const splitted = p.category.split(/[/\u00B7,]+/).map((s) => s.trim()).filter(Boolean);
    if (splitted.length > 0) return splitted;
  }
  return ["Web"];
}

export default function Library() {
  const { systemSounds, notify } = useOS();
  const [projects, setProjects] = useState<ProjectItem[]>(fallbackProjects);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<ProjectItem | null>(null);
  const [modalTab, setModalTab] = useState<"overview" | "highlights" | "stack" | "reviews">("overview");
  const [reviews, setReviews] = useState<FeedbackItem[]>([]);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRole, setReviewRole] = useState("Developer");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("os_library_user_likes") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    fetch(`${API_URL}/api/projects`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setProjects(data);
        }
      })
      .catch(() => {});

    fetch("https://api.github.com/users/Ememman/repos?sort=updated")
      .then((r) => r.json())
      .then((ghRepos) => {
        if (!Array.isArray(ghRepos)) return;
        setProjects((prev) => {
          const updated = [...prev];
          for (const gr of ghRepos) {
            if (gr.fork || gr.name === "Ememman") continue;
            const exists = updated.some(
              (p) =>
                p.id === gr.name.toLowerCase() ||
                p.links.repo?.toLowerCase().includes(gr.name.toLowerCase()) ||
                p.title.toLowerCase().includes(gr.name.toLowerCase())
            );
            if (!exists) {
              const langCat =
                gr.language === "Solidity"
                  ? "Blockchain"
                  : gr.language === "PHP"
                  ? "CLI / Backend"
                  : "Web";
              updated.push({
                id: gr.name.toLowerCase(),
                title: gr.name.replace(/[-_]/g, " "),
                stack: [gr.language || "TypeScript", "Vite", "Git"].filter(Boolean),
                category: langCat,
                categories: [langCat],
                year: gr.created_at ? gr.created_at.slice(0, 4) : "2026",
                cover: "",
                summary: gr.description || `Public GitHub repository ${gr.name} by Emman.`,
                highlights: [
                  `Open-source on GitHub with ${gr.stargazers_count || 0} stars`,
                  `Primary language: ${gr.language || "TypeScript"}`
                ],
                links: {
                  repo: gr.html_url,
                  live: gr.homepage || ""
                }
              });
            }
          }
          return updated;
        });
      })
      .catch(() => {});

    // Fetch initial like counts
    fetch(`${API_URL}/api/projects/likes`)
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") setLikes(data);
      })
      .catch(() => {});

    // Listen for live likes
    const socket = getSocket();
    const onLiked = ({ id, count }: { id: string; count: number }) => {
      setLikes((prev) => ({ ...prev, [id]: count }));
    };
    const onFeedback = (item: FeedbackItem) => {
      setReviews((prev) => (prev.some((f) => f.id === item.id) ? prev : [item, ...prev]));
    };
    socket.on("project:liked", onLiked);
    socket.on("project:feedback", onFeedback);
    return () => {
      socket.off("project:liked", onLiked);
      socket.off("project:feedback", onFeedback);
    };
  }, []);

  useEffect(() => {
    if (!active) {
      setReviews([]);
      return;
    }
    fetch(`${API_URL}/api/projects/${active.id}/feedback`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setReviews(data))
      .catch(() => {});
  }, [active]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${active.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: reviewAuthor.trim() || "Anonymous Visitor",
          role: reviewRole,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      if (res.ok) {
        const item = await res.json();
        setReviews((prev) => [item, ...prev]);
        setReviewComment("");
        if (systemSounds) soundFx.playNotification();
        notify("Review Posted!", "Thank you for reviewing this project!");
      }
    } catch {}
    setSubmittingReview(false);
  };

  const handleLike = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (systemSounds) soundFx.playPop();

    const isAlreadyLiked = Boolean(userLikes[id]);

    if (isAlreadyLiked) {
      // User removes reaction
      setUserLikes((prev) => {
        const next = { ...prev };
        delete next[id];
        try {
          localStorage.setItem("os_library_user_likes", JSON.stringify(next));
        } catch {}
        return next;
      });

      setLikes((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 1) - 1) }));

      try {
        await fetch(`${API_URL}/api/projects/${id}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unlike" }),
        });
      } catch {}

      notify("Reaction Removed", "Removed reaction from project.", "info");
      return;
    }

    // User adds reaction
    setUserLikes((prev) => {
      const next = { ...prev, [id]: true };
      try {
        localStorage.setItem("os_library_user_likes", JSON.stringify(next));
      } catch {}
      return next;
    });

    setLikes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

    try {
      const res = await fetch(`${API_URL}/api/projects/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
      if (res.ok) {
        notify("Project Starred!", "Thanks for supporting Emman's engineering work!", "add");
      }
    } catch {}
  };

  const categories = useMemo(() => {
    const preferredOrder = ["All", "Full-Stack", "Mobile", "Web", "Dashboard", "CLI / Backend", "Blockchain"];
    const allFound = new Set<string>();
    projects.forEach((p) => {
      getProjectCategories(p).forEach((c) => allFound.add(c));
    });

    const activeList = preferredOrder.filter((o) => {
      if (o === "All") return true;
      return allFound.has(o);
    });

    allFound.forEach((c) => {
      if (!activeList.includes(c)) activeList.push(c);
    });

    return activeList;
  }, [projects]);

  const shown = useMemo(() => {
    return projects.filter((p) => {
      const pCats = getProjectCategories(p);
      const matchesCategory =
        filter === "All" ||
        pCats.includes(filter) ||
        (filter === "Full-Stack" && pCats.some((c) => c.toLowerCase().includes("full-stack")));
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.stack.some((s) => s.toLowerCase().includes(q)) ||
        pCats.some((c) => c.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [projects, filter, search]);

  const totalLikes = Object.values(likes).reduce((a, b) => a + b, 0);

  const activeCoverSrc = active ? getProjectCover(active) : null;
  const activeCats = active ? getProjectCategories(active) : [];

  return (
    <div className="flex flex-col h-full bg-black/40 text-white select-none">
      {/* Top Bar with Search & Filters (Sticky Header) */}
      <div className="p-3 sm:p-5 border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur-md space-y-2.5 sm:space-y-3 sticky top-0 z-20 shrink-0 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">
              Engineering Library & Projects
            </h2>
            <p className="text-xs text-white/50">
              Shipped production apps, enterprise dashboards, and technical architecture.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/40 flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
              <GIconHeart size={12} className="text-rose-400" />
              <span>{totalLikes} Endorsements</span>
            </span>
          </div>
        </div>

        {/* Search input & category pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 w-full sm:w-64">
            <GIconSearch size={14} className="text-white/40 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, React, Expo, Mongo..."
              className="bg-transparent outline-none text-xs text-white placeholder:text-white/35 w-full"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((c) => {
              const isSelected = filter === c;
              return (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setFilter(c);
                    if (systemSounds) soundFx.playClick();
                  }}
                  className={`relative text-xs px-3.5 py-1.5 rounded-xl border transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? "border-accent text-white shadow-md shadow-accent/25"
                      : "border-white/15 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="libraryFilterPill"
                      className="absolute inset-0 bg-accent rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{c}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-auto thin-scroll p-4 sm:p-5">
        {shown.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <p className="font-medium text-sm">No projects match "{search}"</p>
            <p className="text-xs text-white/30 mt-1">Try searching for "React Native", "Expo", or "MongoDB".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shown.map((p) => {
              const projectLikeCount = likes[p.id] || 0;
              const coverSrc = getProjectCover(p);
              const pCats = getProjectCategories(p);

              return (
                <motion.div
                  layout
                  key={p.id}
                  whileHover={{ y: -5, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => {
                    setActive(p);
                    setModalTab("overview");
                    if (systemSounds) soundFx.playClick();
                  }}
                  className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-accent/60 transition-colors group cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-black/40"
                >
                  <div className="relative h-36 overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950">
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-[#0a0e17] via-[#0d121f] to-[#111827] relative overflow-hidden group-hover:brightness-110 transition-all">
                        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
                        <div className="relative z-10 flex flex-col items-center text-center space-y-1">
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Currently in Development</span>
                          </div>
                          <span className="text-[10px] text-white/40 font-mono tracking-tight">
                            Preview asset being finalized
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                    
                    {/* Category Tags (Support for dual tags e.g. Mobile · Full-Stack) */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10 max-w-[70%]">
                      {pCats.map((cat) => {
                        const isFullStack = cat.toLowerCase().includes("full-stack");
                        return (
                          <span
                            key={cat}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold backdrop-blur-md border ${
                              isFullStack
                                ? "bg-accent/40 border-accent/60 text-white shadow-sm shadow-accent/25"
                                : "bg-black/65 border-white/20 text-white/90"
                            }`}
                          >
                            {cat}
                          </span>
                        );
                      })}
                    </div>

                    <button
                      onClick={(e) => handleLike(p.id, e)}
                      title={userLikes[p.id] ? "Click to remove heart reaction" : "Star this project"}
                      aria-label={userLikes[p.id] ? "Remove heart reaction" : "Star this project"}
                      className={`absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border transition text-[11px] cursor-pointer z-10 ${
                        userLikes[p.id]
                          ? "bg-rose-500/35 border-rose-400/60 text-rose-200 shadow-md shadow-rose-500/25"
                          : "bg-black/60 border-white/15 hover:border-rose-400/50 hover:bg-rose-500/20 text-white"
                      }`}
                    >
                      <GIconHeart
                        size={12}
                        className={
                          userLikes[p.id]
                            ? "text-rose-400 fill-rose-400 scale-110"
                            : "text-rose-400 group-hover:scale-110 transition-transform"
                        }
                      />
                      <span className="font-semibold text-[10px]">{projectLikeCount}</span>
                    </button>

                    <div className="absolute bottom-2 left-3 right-3 z-10">
                      <div className="text-sm font-bold text-white group-hover:text-accent transition-colors">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-white/60">{p.year}</div>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col justify-between flex-1 space-y-3">
                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                      {p.summary}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.stack.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white/8 text-white/70 border border-white/5"
                        >
                          {s}
                        </span>
                      ))}
                      {p.stack.length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md text-white/40">
                          +{p.stack.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Project Inspector Modal */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 14 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="glass rounded-3xl max-w-xl w-full p-5 sm:p-6 border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    {activeCats.map((cat) => {
                      const isFullStack = cat.toLowerCase().includes("full-stack");
                      return (
                        <span
                          key={cat}
                          className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                            isFullStack
                              ? "bg-accent/30 text-accent-light border-accent/50"
                              : "bg-white/10 text-white/90 border-white/20"
                          }`}
                        >
                          {cat}
                        </span>
                      );
                    })}
                    <span className="text-[10px] text-white/40 font-mono">· {active.year}</span>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold leading-tight">{active.title}</h3>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition shrink-0 cursor-pointer"
                >
                  <GIconClose size={16} />
                </button>
              </div>

              {/* Modal Image */}
              <div className="relative h-44 rounded-2xl overflow-hidden mb-3 border border-white/10 shrink-0 bg-gradient-to-br from-slate-900 to-indigo-950">
                {activeCoverSrc ? (
                  <img
                    src={activeCoverSrc}
                    alt={active.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0a0e17] via-[#0d121f] to-[#111827] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/35 text-amber-300 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>Currently in Development</span>
                      </div>
                      <p className="text-xs text-white/50 max-w-sm">
                        Interactive preview walkthrough and production screenshots are actively being prepared for this project.
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-white/10 mb-3 text-xs gap-1 shrink-0 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setModalTab("overview")}
                  className={`px-3 py-1.5 font-medium border-b-2 transition whitespace-nowrap shrink-0 cursor-pointer ${
                    modalTab === "overview"
                      ? "border-accent text-white"
                      : "border-transparent text-white/50 hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setModalTab("highlights")}
                  className={`px-3 py-1.5 font-medium border-b-2 transition whitespace-nowrap shrink-0 cursor-pointer ${
                    modalTab === "highlights"
                      ? "border-accent text-white"
                      : "border-transparent text-white/50 hover:text-white"
                  }`}
                >
                  Technical Highlights ({active.highlights.length})
                </button>
                <button
                  onClick={() => setModalTab("stack")}
                  className={`px-3 py-1.5 font-medium border-b-2 transition whitespace-nowrap shrink-0 cursor-pointer ${
                    modalTab === "stack"
                      ? "border-accent text-white"
                      : "border-transparent text-white/50 hover:text-white"
                  }`}
                >
                  Tech Architecture
                </button>
                <button
                  onClick={() => setModalTab("reviews")}
                  className={`px-3 py-1.5 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    modalTab === "reviews"
                      ? "border-accent text-white"
                      : "border-transparent text-white/50 hover:text-white"
                  }`}
                >
                  <GIconStar size={12} className={modalTab === "reviews" ? "text-accent" : "text-white/40"} />
                  <span>Reviews ({reviews.length})</span>
                </button>
              </div>

              {/* Modal Tab Content */}
              <div className="overflow-y-auto thin-scroll flex-1 pr-1 space-y-3 text-xs">
                {modalTab === "overview" && (
                  <div className="space-y-3">
                    <p className="text-white/80 leading-relaxed sm:text-sm">
                      {active.summary}
                    </p>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-white/40 uppercase tracking-wide block mb-1">
                        System Scale
                      </span>
                      <span className="text-white/85 text-xs">
                        Engineered for high concurrency, real-time synchronization, and multi-platform consistency.
                      </span>
                    </div>
                  </div>
                )}

                {modalTab === "highlights" && (
                  <div className="space-y-2">
                    {active.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2 text-white/80"
                      >
                        <span className="w-5 h-5 rounded-md bg-accent/20 text-accent flex items-center justify-center shrink-0 text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{h}</span>
                      </div>
                    ))}
                  </div>
                )}

                {modalTab === "stack" && (
                  <div className="space-y-3">
                    <p className="text-white/60">
                      Technologies chosen for reliability, performance, and cross-platform flexibility:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {active.stack.map((s) => (
                        <div
                          key={s}
                          className="px-3 py-1.5 rounded-xl bg-white/8 border border-white/10 flex items-center gap-1.5 font-medium text-white/90"
                        >
                          <GIconCode size={12} className="text-accent" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {modalTab === "reviews" && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white/90">Add Project Review / Endorsement</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setReviewRating(s)}
                              className={`p-0.5 transition hover:scale-125 ${
                                s <= reviewRating ? "text-amber-400" : "text-white/20"
                              }`}
                            >
                              <GIconStar size={14} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <form onSubmit={handleReviewSubmit} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Your Name / Handle"
                            value={reviewAuthor}
                            onChange={(e) => setReviewAuthor(e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs focus:outline-none focus:border-accent text-white"
                          />
                          <select
                            value={reviewRole}
                            onChange={(e) => setReviewRole(e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs focus:outline-none focus:border-accent text-white/80"
                          >
                            <option value="Engineer">Software Engineer</option>
                            <option value="Architect">Tech Lead / Architect</option>
                            <option value="Product Manager">Product Manager</option>
                            <option value="Recruiter">Recruiter / Talent Partner</option>
                            <option value="Visitor">Community Member</option>
                          </select>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Write constructive technical review or feedback..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs focus:outline-none focus:border-accent resize-none placeholder:text-white/30 text-white"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={submittingReview || !reviewComment.trim()}
                            className="px-3 py-1.5 rounded-xl bg-accent hover:brightness-110 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-accent/20 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <GIconPaperPlane size={11} />
                            {submittingReview ? "Submitting..." : "Submit Review"}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="space-y-2.5">
                      {reviews.length === 0 ? (
                        <p className="text-center py-6 text-white/40 text-xs">
                          No reviews yet for this project. Be the first to share feedback!
                        </p>
                      ) : (
                        reviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white/90">{rev.author}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                                  {rev.role}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5 text-amber-400">
                                {Array.from({ length: rev.rating }).map((_, i) => (
                                  <GIconStar key={i} size={11} />
                                ))}
                              </div>
                            </div>
                            <p className="text-white/75 text-xs leading-relaxed">{rev.comment}</p>
                            <span className="text-[10px] text-white/30 block">
                              {new Date(rev.ts).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Action Footer */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
                <button
                  onClick={() => handleLike(active.id)}
                  title={userLikes[active.id] ? "Click to remove heart reaction" : "Star this project"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    userLikes[active.id]
                      ? "bg-rose-500/35 text-rose-200 border-rose-400/60 shadow-md shadow-rose-500/20"
                      : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30"
                  }`}
                >
                  <GIconHeart size={13} className={userLikes[active.id] ? "text-rose-300 fill-rose-300" : "text-rose-400"} />
                  <span>{userLikes[active.id] ? "Liked" : "Star Project"} ({likes[active.id] || 0})</span>
                </button>

                <div className="flex items-center gap-2">
                  {active.links.live && (
                    <a
                      href={active.links.live}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white font-medium hover:brightness-110 shadow-md shadow-accent/20 transition"
                    >
                      <GIconExternalLink size={12} /> Live Preview
                    </a>
                  )}
                  {active.links.repo && (
                    <a
                      href={active.links.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 text-white hover:bg-white/10 transition"
                    >
                      <GIconGithub size={12} /> Source
                    </a>
                  )}
                  <button
                    onClick={() => setActive(null)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-white/15 hover:bg-white/10 text-white transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
