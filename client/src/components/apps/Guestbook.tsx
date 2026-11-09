import { useEffect, useState, useMemo, useRef } from "react";
import { API_URL } from "../../lib/config";
import { getSocket } from "../../lib/socket";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import {
  GIconPaperPlane,
  GIconHeart,
  GIconSearch,
  GIconRotateRight,
  GIconBookOpen,
  GIconTerminal,
  GIconPencil,
  GIconPersons,
  GIconPerson,
  GIconCpu,
  GIconTrash,
  GIconCopy,
  GIconCheck,
  GIconClock,
  GIconCamera,
  GIconLink,
  GIconUpload,
  GIconMapPin,
  GIconClose,
  GIconDownload,
} from "../icons/GravityIcons";
import {
  AVATAR_STYLES,
  PRESET_SEEDS,
  resolveAvatarSrc,
  generateAvatarDataUri,
} from "../../lib/avatar";

export interface GuestbookEntry {
  id: string;
  name: string;
  role: string;
  avatar: string;
  message: string;
  link?: string;
  location?: string;
  ts: number;
  reactions: number;
}

const ROLE_OPTIONS = [
  { id: "Developer", label: "Developer", Icon: GIconTerminal },
  { id: "Designer", label: "Designer", Icon: GIconPencil },
  { id: "Tech Lead", label: "Tech Lead", Icon: GIconCpu },
  { id: "Recruiter", label: "Recruiter", Icon: GIconPersons },
  { id: "Visitor", label: "Visitor", Icon: GIconPerson },
];

/**
 * Client-side image resize helper to keep uploaded photos lightweight (<15KB)
 */
function resizeImageToDataUrl(file: File, maxDim = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function Guestbook() {
  const { systemSounds, notify, photoUrl } = useOS();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<GuestbookEntry[]>(() => {
    try {
      const saved = localStorage.getItem("os_guestbook_saved");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Profile customizer state
  const [profileMode, setProfileMode] = useState<"avatar" | "photo">(() => {
    try {
      const saved = localStorage.getItem("os_guestbook_profile");
      if (saved) return JSON.parse(saved).profileMode || "avatar";
    } catch {}
    return "avatar";
  });

  const [name, setName] = useState(() => {
    try {
      const saved = localStorage.getItem("os_guestbook_profile");
      if (saved) return JSON.parse(saved).name || "";
    } catch {}
    return localStorage.getItem("os_guestbook_name") || "";
  });

  const [role, setRole] = useState(() => {
    try {
      const saved = localStorage.getItem("os_guestbook_profile");
      if (saved) return JSON.parse(saved).role || "Developer";
    } catch {}
    return "Developer";
  });

  const [link, setLink] = useState(() => {
    try {
      const saved = localStorage.getItem("os_guestbook_profile");
      if (saved) return JSON.parse(saved).link || "";
    } catch {}
    return "";
  });

  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("os_guestbook_profile");
      if (saved) return JSON.parse(saved).location || "";
    } catch {}
    return "";
  });

  const [customPhoto, setCustomPhoto] = useState(() => {
    try {
      const saved = localStorage.getItem("os_guestbook_profile");
      if (saved) return JSON.parse(saved).customPhoto || "";
    } catch {}
    return "";
  });

  const [selectedStyle, setSelectedStyle] = useState(() => {
    try {
      const saved = localStorage.getItem("os_guestbook_profile");
      if (saved) return JSON.parse(saved).selectedStyle || "lorelei";
    } catch {}
    return "lorelei";
  });

  const [seed, setSeed] = useState(() => {
    try {
      const saved = localStorage.getItem("os_guestbook_profile");
      if (saved) return JSON.parse(saved).seed || "Julian";
    } catch {}
    return "Julian";
  });

  const [customSeedInput, setCustomSeedInput] = useState("");
  const [message, setMessage] = useState("");

  // Filters & sorting
  const [mobileTab, setMobileTab] = useState<"feed" | "sign">("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "loved" | "oldest">("newest");

  const exportGuestbook = () => {
    if (systemSounds) soundFx.playPop();
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guestbook-signatures-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("Exported", "Guestbook ledger saved to Downloads.", "success");
  };

  // Save profile changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "os_guestbook_profile",
        JSON.stringify({
          profileMode,
          name,
          role,
          link,
          location,
          customPhoto,
          selectedStyle,
          seed,
        })
      );
      if (name) localStorage.setItem("os_guestbook_name", name);
    } catch {}
  }, [profileMode, name, role, link, location, customPhoto, selectedStyle, seed]);

  // Save entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("os_guestbook_saved", JSON.stringify(entries));
    } catch {}
  }, [entries]);

  // Current avatar / photo identifier to submit
  const currentAvatarPayload =
    profileMode === "photo" && customPhoto.trim()
      ? customPhoto.trim()
      : `${selectedStyle}:${seed}`;

  // Fetch entries from backend
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/guestbook`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEntries(data);
        }
      }
    } catch {
      // Retain offline entries from state
    } finally {
      setLoading(false);
    }
  };

  // Real-time synchronization
  useEffect(() => {
    fetchEntries();

    const socket = getSocket();

    const onNewEntry = (entry: GuestbookEntry) => {
      setEntries((prev) => {
        if (prev.some((e) => e.id === entry.id)) return prev;
        return [entry, ...prev];
      });
      if (systemSounds) soundFx.playNotification();
      notify("New Signature", `${entry.name} signed the ledger.`, "info", 3500);
    };

    const onReacted = ({ id, reactions }: { id: string; reactions: number }) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, reactions } : e))
      );
    };

    const onDeleted = ({ id }: { id: string }) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (systemSounds) soundFx.playClose();
      notify("Signature Removed", "A guestbook signature was removed.", "delete", 3000);
    };

    socket.on("guestbook:entry", onNewEntry);
    socket.on("guestbook:reacted", onReacted);
    socket.on("guestbook:deleted", onDeleted);

    return () => {
      socket.off("guestbook:entry", onNewEntry);
      socket.off("guestbook:reacted", onReacted);
      socket.off("guestbook:deleted", onDeleted);
    };
  }, [systemSounds, notify]);

  // Randomize avatar seed
  const handleRandomizeAvatar = () => {
    if (systemSounds) soundFx.playPop();
    const presets = PRESET_SEEDS[selectedStyle] || PRESET_SEEDS.lorelei;
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    const uniqueSeed = `${randomPreset}-${Math.floor(Math.random() * 900 + 100)}`;
    setSeed(uniqueSeed);
    setCustomSeedInput("");
  };

  // Handle local photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUri = await resizeImageToDataUrl(file, 128);
      setCustomPhoto(dataUri);
      setProfileMode("photo");
      if (systemSounds) soundFx.playPop();
      notify("Photo Updated", "Loaded custom profile photo.", "update", 2200);
    } catch {
      notify("Upload Failed", "Could not process image file.", "warning");
    }
  };

  // Submit new guestbook entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanMsg = message.trim();
    if (!cleanName || !cleanMsg) return;

    setSubmitting(true);
    setFormError(null);
    if (systemSounds) soundFx.playClick();

    const payload = {
      name: cleanName,
      role,
      avatar: currentAvatarPayload,
      message: cleanMsg,
      link: link.trim() || undefined,
      location: location.trim() || undefined,
    };

    try {
      const res = await fetch(`${API_URL}/api/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        const created: GuestbookEntry = data;
        setEntries((prev) => [created, ...prev.filter((e) => e.id !== created.id)]);
        setMessage("");
        setFormError(null);
        setMobileTab("feed");
        if (systemSounds) soundFx.playNotification();
        notify("Guestbook Signed", "Your message was published to the ledger.", "add");
      } else {
        const errMsg = Array.isArray(data.details) ? data.details.join(" ") : (data.error || "Failed to post signature.");
        setFormError(errMsg);
        notify("Validation Error", errMsg, "warning");
      }
    } catch {
      // Local session signature fallback
      const fallbackEntry: GuestbookEntry = {
        id: `local-${Date.now()}`,
        name: cleanName,
        role,
        avatar: currentAvatarPayload,
        message: cleanMsg,
        link: link.trim() || undefined,
        location: location.trim() || undefined,
        ts: Date.now(),
        reactions: 0,
      };
      setEntries((prev) => [fallbackEntry, ...prev]);
      setMessage("");
      setMobileTab("feed");
      notify("Signed Locally", "Your message is saved for this session.", "add");
    } finally {
      setSubmitting(false);
    }
  };

  // Heart an entry
  const handleReact = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (systemSounds) soundFx.playPop();

    setEntries((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, reactions: (item.reactions || 0) + 1 } : item
      )
    );

    try {
      await fetch(`${API_URL}/api/guestbook/${id}/react`, { method: "POST" });
    } catch {}
  };

  // Delete an entry
  const handleDelete = async (id: string, authorName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (systemSounds) soundFx.playClose();

    setEntries((prev) => prev.filter((item) => item.id !== id));
    notify("Signature Deleted", `Removed entry by ${authorName}.`, "delete");

    try {
      await fetch(`${API_URL}/api/guestbook/${id}`, { method: "DELETE" });
    } catch {}
  };

  // Copy entry text
  const handleCopy = (item: GuestbookEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (systemSounds) soundFx.playPop();
    const textToCopy = `"${item.message}" — ${item.name} (${item.role})${item.link ? ` [${item.link}]` : ""}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered and sorted entries
  const displayedEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = entries.filter((e) => {
      const matchesRole = filterRole === "All" || e.role === filterRole;
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.link && e.link.toLowerCase().includes(q));
      return matchesRole && matchesSearch;
    });

    if (sortBy === "loved") {
      list = [...list].sort((a, b) => (b.reactions || 0) - (a.reactions || 0));
    } else if (sortBy === "oldest") {
      list = [...list].sort((a, b) => a.ts - b.ts);
    } else {
      list = [...list].sort((a, b) => b.ts - a.ts);
    }

    return list;
  }, [entries, searchQuery, filterRole, sortBy]);

  // Current preview image src
  const activePreviewSrc = useMemo(() => {
    if (profileMode === "photo" && customPhoto.trim()) {
      return customPhoto.trim();
    }
    return generateAvatarDataUri(selectedStyle, seed);
  }, [profileMode, customPhoto, selectedStyle, seed]);

  const activePresets = PRESET_SEEDS[selectedStyle] || PRESET_SEEDS.lorelei;

  return (
    <div className="flex flex-col h-full bg-[#0c0e14] text-white text-xs select-none overflow-hidden">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.08] px-4 py-3 bg-[#0c0e14]/95 backdrop-blur-md shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <GIconBookOpen size={16} className="text-white/80" />
            <h2 className="font-display text-sm font-semibold tracking-tight text-white/95">
              Guestbook & Visitor Ledger
            </h2>
          </div>
          <p className="text-[11px] text-white/50">
            Public registry of visitor notes, engineering thoughts, and custom profiles.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/60 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline">Live synced</span>
          </div>

          <button
            onClick={exportGuestbook}
            title="Export Guestbook Signatures (.json)"
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.08] hover:bg-white/[0.06] text-white/60 hover:text-white transition cursor-pointer text-xs"
          >
            <GIconDownload size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={fetchEntries}
            title="Refresh entries"
            className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.06] text-white/60 hover:text-white transition cursor-pointer"
          >
            <GIconRotateRight size={13} className={loading ? "animate-spin text-white/90" : ""} />
          </button>
        </div>
      </div>

      {/* Mobile Segmented View Switcher */}
      <div className="lg:hidden sticky top-[57px] z-10 flex items-center p-2 border-b border-white/[0.08] bg-[#0c0e14]/95 backdrop-blur-md shrink-0 gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (systemSounds) soundFx.playClick();
            setMobileTab("feed");
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${
            mobileTab === "feed"
              ? "bg-white/15 text-white border border-white/10 shadow-sm"
              : "text-white/50 hover:text-white"
          }`}
        >
          <GIconBookOpen size={13} />
          <span>Signatures ({entries.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (systemSounds) soundFx.playClick();
            setMobileTab("sign");
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${
            mobileTab === "sign"
              ? "bg-accent/20 text-accent border border-accent/30 shadow-sm"
              : "text-white/50 hover:text-white"
          }`}
        >
          <GIconPencil size={13} />
          <span>Sign Guestbook</span>
        </button>
      </div>

      {/* Main 2-Column Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Profile & Sign Form */}
        <div className={`lg:col-span-5 p-4 border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-y-auto thin-scroll space-y-4 bg-white/[0.01] ${
          mobileTab === "sign" ? "block" : "hidden lg:block"
        }`}>
          <div className="flex items-center justify-between pb-1">
            <span className="font-semibold text-white/90 flex items-center gap-1.5 text-xs">
              <GIconPencil size={13} className="text-white/70" />
              <span>Your Profile & Signature</span>
            </span>
            <span className="text-[10px] text-white/40 font-mono">
              Saved locally
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Profile Picture & Avatar Studio Card */}
            <div className="p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-white/90">Profile Picture</span>

                {/* Profile Mode Toggle */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/40 border border-white/[0.08] text-[10px]">
                  <button
                    type="button"
                    onClick={() => setProfileMode("avatar")}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      profileMode === "avatar"
                        ? "bg-white/15 text-white font-medium border border-white/10"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    Vector Avatar
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileMode("photo")}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      profileMode === "photo"
                        ? "bg-white/15 text-white font-medium border border-white/10"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    Custom Photo
                  </button>
                </div>
              </div>

              {/* Avatar / Photo Header Row */}
              <div className="flex items-center gap-3">
                <div
                  onClick={() => {
                    if (profileMode === "avatar") {
                      handleRandomizeAvatar();
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  title={profileMode === "avatar" ? "Click to roll new seed" : "Click to upload image"}
                  className="relative w-14 h-14 aspect-square rounded-2xl border border-white/10 bg-black/40 p-1 shrink-0 overflow-hidden shadow-inner group cursor-pointer hover:border-white/30 transition"
                >
                  <img
                    src={activePreviewSrc}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                    {profileMode === "avatar" ? (
                      <GIconRotateRight size={14} className="text-white" />
                    ) : (
                      <GIconCamera size={14} className="text-white" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  {profileMode === "avatar" ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/70">DiceBear Generator</span>
                        <button
                          type="button"
                          onClick={handleRandomizeAvatar}
                          title="Roll a random avatar seed"
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white text-[10px] font-medium transition cursor-pointer"
                        >
                          <GIconRotateRight size={11} />
                          <span>Roll Seed</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-white/40 leading-snug">
                        Pick a vector style or type your handle to generate.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/70">Upload or URL</span>
                        {customPhoto && (
                          <button
                            type="button"
                            onClick={() => setCustomPhoto("")}
                            className="flex items-center gap-1 text-[10px] text-rose-400 hover:underline cursor-pointer"
                          >
                            <GIconClose size={10} />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-white/40 leading-snug">
                        Use your own personal headshot, GitHub avatar, or photo.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Vector Mode Controls */}
              {profileMode === "avatar" && (
                <div className="space-y-2.5 pt-1 border-t border-white/[0.04]">
                  {/* Style Switcher */}
                  <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/30 border border-white/[0.08] overflow-x-auto thin-scroll">
                    {AVATAR_STYLES.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSelectedStyle(st.id);
                          const presets = PRESET_SEEDS[st.id] || PRESET_SEEDS.lorelei;
                          setSeed(presets[0]);
                          setCustomSeedInput("");
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition cursor-pointer ${
                          selectedStyle === st.id
                            ? "bg-white/15 text-white shadow-sm border border-white/10"
                            : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Preset Seed Chips */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono">
                      Presets
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {activePresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setSeed(preset);
                            setCustomSeedInput("");
                          }}
                          className={`px-2 py-0.5 rounded-lg border text-[10px] transition cursor-pointer ${
                            seed === preset && !customSeedInput
                              ? "bg-white/15 border-white/30 text-white font-medium"
                              : "bg-white/[0.02] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.05]"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Seed Input */}
                  <div>
                    <input
                      type="text"
                      maxLength={24}
                      value={customSeedInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomSeedInput(val);
                        setSeed(val.trim() || activePresets[0]);
                      }}
                      placeholder="Or enter custom seed name..."
                      className="w-full bg-black/25 border border-white/[0.08] rounded-xl px-2.5 py-1 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-white/20 transition"
                    />
                  </div>
                </div>
              )}

              {/* Custom Photo Mode Controls */}
              {profileMode === "photo" && (
                <div className="space-y-2 pt-1 border-t border-white/[0.04]">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white text-[11px] font-medium transition cursor-pointer"
                    >
                      <GIconUpload size={12} />
                      <span>Upload Local Photo</span>
                    </button>

                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setCustomPhoto(photoUrl)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white text-[11px] transition cursor-pointer"
                        title="Use desktop profile photo"
                      >
                        Use OS Photo
                      </button>
                    )}
                  </div>

                  {/* Or paste photo URL */}
                  <div>
                    <input
                      type="url"
                      value={customPhoto.startsWith("data:") ? "" : customPhoto}
                      onChange={(e) => setCustomPhoto(e.target.value)}
                      placeholder="Or paste direct image URL (e.g. GitHub/LinkedIn avatar)..."
                      className="w-full bg-black/25 border border-white/[0.08] rounded-xl px-2.5 py-1 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-white/20 transition"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-3 p-3 rounded-2xl border border-white/[0.08] bg-white/[0.015]">
              <div className="text-[11px] font-medium text-white/90">Identity & Links</div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-white/50 uppercase tracking-wide block font-mono">
                  Your Name *
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  maxLength={36}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex River"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/[0.05] transition"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-[10px] text-white/50 uppercase tracking-wide block font-mono">
                  Role or Background
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.Icon;
                    const isSelected = role === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRole(opt.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] transition cursor-pointer ${
                          isSelected
                            ? "bg-white/12 border-white/25 text-white font-medium shadow-sm"
                            : "bg-white/[0.02] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.05]"
                        }`}
                      >
                        <Icon size={12} className={isSelected ? "text-white" : "text-white/50"} />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Profile Website / Link & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/50 uppercase tracking-wide font-mono flex items-center gap-1">
                    <GIconLink size={10} />
                    <span>Website or GitHub</span>
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="e.g. github.com/username"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2.5 py-1 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-white/20 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/50 uppercase tracking-wide block font-mono items-center gap-1">
                    <GIconMapPin size={10} />
                    <span>Location / Company</span>
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco or Vercel"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2.5 py-1 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-white/20 transition"
                  />
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-white/60 font-medium block">
                  Guestbook Message *
                </label>
                <span className="text-[10px] text-white/40 font-mono">
                  {message.length} / 400
                </span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={400}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave an encouraging message, feedback, inquiry, or note..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/[0.05] resize-none thin-scroll transition leading-relaxed"
              />
            </div>

            {/* Validation Error Alert */}
            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">⚠</span>
                <span className="leading-tight">{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !name.trim() || !message.trim()}
              className="w-full py-2.5 rounded-xl bg-accent hover:brightness-110 active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed text-white font-medium text-xs shadow-lg shadow-accent/15 border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <GIconPaperPlane size={13} />
              <span>{submitting ? "Publishing Signature..." : "Sign Guestbook"}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Ledger Feed */}
        <div className={`lg:col-span-7 flex flex-col h-full overflow-hidden bg-white/[0.01] ${
          mobileTab === "feed" ? "flex" : "hidden lg:flex"
        }`}>
          {/* Top Filter & Search Bar */}
          <div className="p-3 border-b border-white/[0.08] space-y-2 bg-white/[0.015]">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.08] focus-within:border-white/25 transition">
                <GIconSearch size={12} className="text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search signatures by name, role, link, or message..."
                  className="bg-transparent outline-none text-xs text-white placeholder:text-white/35 w-full"
                />
              </div>

              {/* Segmented Sort Switcher */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-black/30 border border-white/[0.08] shrink-0 text-[10px]">
                <button
                  onClick={() => setSortBy("newest")}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    sortBy === "newest"
                      ? "bg-white/15 text-white font-medium border border-white/10"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setSortBy("loved")}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    sortBy === "loved"
                      ? "bg-white/15 text-white font-medium border border-white/10"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Top Loved
                </button>
                <button
                  onClick={() => setSortBy("oldest")}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    sortBy === "oldest"
                      ? "bg-white/15 text-white font-medium border border-white/10"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Oldest
                </button>
              </div>
            </div>

            {/* Role Filter Chips (Displayed when signatures exist) */}
            {entries.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto thin-scroll pt-0.5">
                <button
                  onClick={() => setFilterRole("All")}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-medium border transition shrink-0 cursor-pointer ${
                    filterRole === "All"
                      ? "bg-white/15 border-white/25 text-white"
                      : "border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  All ({entries.length})
                </button>
                {ROLE_OPTIONS.map((opt) => {
                  const count = entries.filter((e) => e.role === opt.id).length;
                  if (count === 0 && filterRole !== opt.id) return null;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setFilterRole(opt.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition shrink-0 flex items-center gap-1 cursor-pointer ${
                        filterRole === opt.id
                          ? "bg-white/15 border-white/25 text-white"
                          : "border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="font-mono text-[9px] opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-3">
            {displayedEntries.length === 0 ? (
              <div className="max-w-sm mx-auto my-12 p-8 rounded-2xl border border-white/[0.08] bg-white/[0.015] text-center space-y-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] mx-auto flex items-center justify-center text-white/50">
                  <GIconBookOpen size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-white/90 text-sm">
                    {searchQuery || filterRole !== "All"
                      ? "No matching entries"
                      : "No signatures recorded yet"}
                  </h3>
                  <p className="text-[11px] text-white/45 leading-relaxed">
                    {searchQuery || filterRole !== "All"
                      ? "Try adjusting search terms or resetting the active filter."
                      : "Be the first visitor, developer, or collaborator to customize your profile and sign the guestbook."}
                  </p>
                </div>

                {searchQuery || filterRole !== "All" ? (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterRole("All");
                    }}
                    className="text-xs text-white/80 hover:text-white underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                ) : (
                  <button
                    onClick={() => nameInputRef.current?.focus()}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white text-xs font-medium transition cursor-pointer"
                  >
                    Set Profile & Sign
                  </button>
                )}
              </div>
            ) : (
              displayedEntries.map((item) => {
                const avatarSrc = resolveAvatarSrc(item.avatar, item.name);
                const roleMeta = ROLE_OPTIONS.find((r) => r.id === item.role) || ROLE_OPTIONS[4];
                const RoleIcon = roleMeta.Icon;

                // Format website link
                const formattedLink = item.link
                  ? item.link.startsWith("http://") || item.link.startsWith("https://")
                    ? item.link
                    : `https://${item.link}`
                  : null;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.035] transition-all duration-200 group space-y-2.5"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Profile Picture / Avatar */}
                        <div className="w-10 h-10 aspect-square rounded-xl border border-white/10 bg-black/40 p-0.5 shrink-0 overflow-hidden shadow-sm">
                          <img
                            src={avatarSrc}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                            loading="lazy"
                          />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white/95 text-xs truncate">
                              {item.name}
                            </span>
                            {item.location && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] text-white/40">
                                <GIconMapPin size={9} />
                                <span className="truncate max-w-[120px]">{item.location}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md font-medium border border-white/[0.08] bg-white/[0.04] text-white/70">
                              <RoleIcon size={10} className="text-white/60" />
                              <span>{item.role}</span>
                            </span>

                            {formattedLink && (
                              <a
                                href={formattedLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md font-medium border border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.08] transition"
                                title={formattedLink}
                              >
                                <GIconLink size={9} />
                                <span className="truncate max-w-[140px]">
                                  {item.link?.replace(/^https?:\/\/(www\.)?/, "")}
                                </span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Date & Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                          <GIconClock size={11} />
                          {new Date(item.ts).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>

                        <button
                          onClick={(e) => handleDelete(item.id, item.name, e)}
                          title="Delete entry"
                          className="p-1 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <GIconTrash size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Message Body */}
                    <p className="text-white/80 text-[11px] leading-relaxed whitespace-pre-wrap pl-12">
                      {item.message}
                    </p>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] pl-12">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleCopy(item, e)}
                          title="Copy message"
                          className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white px-2 py-0.5 rounded-lg hover:bg-white/[0.05] transition cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <GIconCheck size={11} className="text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <GIconCopy size={11} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={(e) => handleReact(item.id, e)}
                        title="Heart this message"
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer ${
                          item.reactions > 0
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                            : "bg-white/[0.02] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <GIconHeart
                          size={12}
                          className={item.reactions > 0 ? "text-rose-400" : "text-white/40"}
                        />
                        <span className="font-mono text-[10px] font-semibold">
                          {item.reactions || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
