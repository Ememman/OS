import { useEffect, useState } from "react";
import {
  GIconExternalLink,
  GIconGithub,
  GIconSearch,
  GIconHeart,
  GIconStar,
  GIconClose,
  GIconSparkles,
  GIconPaperPlane,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { fallbackProjects } from "../../data/projects";
import { getSocket } from "../../lib/socket";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";

interface ProjectItem {
  id: string;
  title: string;
  stack: string[];
  category: string;
  year: string;
  cover: string;
  summary: string;
  highlights: string[];
  links: {
    repo: string;
    live: string;
  };
}


export interface FeedbackItem {
  id: string;
  projectId: string;
  author: string;
  role: string;
  rating: number;
  comment: string;
  ts: number;
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

  const [likes, setLikes] = useState<Record<string, number>>({
    "sandrealee-customer": 29,
    "sandrealee-staff": 19,
    "sandrealee-admin": 36,
    "straive-ims": 18
  });

  useEffect(() => {
    // Fetch project list
    fetch(`${API_URL}/api/projects`)
      .then((r) => r.json())
      .then((data) => data.length && setProjects(data))
      .catch(() => {});

    // Fetch initial like counts
    fetch(`${API_URL}/api/projects/likes`)
      .then((r) => r.json())
      .then((data) => setLikes(data))
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
  }, []);  useEffect(() => {
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

    setLikes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

    try {
      const res = await fetch(`${API_URL}/api/projects/${id}/like`, { method: "POST" });
      if (res.ok) {
        notify("Project Starred!", "Thanks for supporting Bron's engineering work!", "add");
      }
    } catch {}
  };

  const categories = ["All", ...new Set(projects.map((p) => p.category))];

  const shown = projects.filter((p) => {
    const matchesCategory = filter === "All" || p.category === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.stack.some((s) => s.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const totalLikes = Object.values(likes).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full bg-black/40 text-white select-none">
      {/* Top Bar with Search & Filters */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.02] space-y-3">
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
              <GIconStar size={12} className="text-amber-400" />
              <span>{totalLikes} Stars Received</span>
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

          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setFilter(c);
                  if (systemSounds) soundFx.playClick();
                }}
                className={`text-xs px-3 py-1 rounded-xl border transition-all ${
                  filter === c
                    ? "bg-accent border-accent text-white shadow-md shadow-accent/20"
                    : "border-white/15 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5"
                }`}
              >
                {c}
              </button>
            ))}
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
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setActive(p);
                    setModalTab("overview");
                    if (systemSounds) soundFx.playClick();
                  }}
                  className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-accent/60 transition-all duration-300 group cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-black/40"
                >
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={p.cover}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-black/60 backdrop-blur-md border border-white/15 text-white">
                      {p.category}
                    </span>

                    <button
                      onClick={(e) => handleLike(p.id, e)}
                      title="Star this project"
                      className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 hover:border-rose-400/50 hover:bg-rose-500/20 text-white transition text-[11px]"
                    >
                      <GIconHeart size={12} className="text-rose-400 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-[10px]">{projectLikeCount}</span>
                    </button>

                    <div className="absolute bottom-2 left-3 right-3">
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Project Inspector Modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setActive(null)}
        >
          <div
            className="glass rounded-3xl max-w-xl w-full p-5 sm:p-6 border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "menuOpen 160ms cubic-bezier(.16,1,.3,1) both" }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 mb-1">
                  {active.category} · {active.year}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold leading-tight">{active.title}</h3>
              </div>
              <button
                onClick={() => setActive(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition shrink-0"
              >
                <GIconClose size={16} />
              </button>
            </div>

            {/* Modal Image */}
            <div className="relative h-44 rounded-2xl overflow-hidden mb-3 border border-white/10 shrink-0">
              <img src={active.cover} alt={active.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/10 mb-3 text-xs gap-1 shrink-0">
              <button
                onClick={() => setModalTab("overview")}
                className={`px-3 py-1.5 font-medium border-b-2 transition ${
                  modalTab === "overview"
                    ? "border-accent text-white"
                    : "border-transparent text-white/50 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setModalTab("highlights")}
                className={`px-3 py-1.5 font-medium border-b-2 transition ${
                  modalTab === "highlights"
                    ? "border-accent text-white"
                    : "border-transparent text-white/50 hover:text-white"
                }`}
              >
                Technical Highlights ({active.highlights.length})
              </button>
              <button
                onClick={() => setModalTab("stack")}
                className={`px-3 py-1.5 font-medium border-b-2 transition ${
                  modalTab === "stack"
                    ? "border-accent text-white"
                    : "border-transparent text-white/50 hover:text-white"
                }`}
              >
                Tech Architecture
              </button>
              <button
                onClick={() => setModalTab("reviews")}
                className={`px-3 py-1.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
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
                        <GIconSparkles size={12} className="text-accent" />
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
              >
                <GIconHeart size={13} className="text-rose-400" />
                <span>Star Project ({likes[active.id] || 0})</span>
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
                  className="text-xs px-3 py-1.5 rounded-xl border border-white/15 hover:bg-white/10 text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
