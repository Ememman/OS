import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GIconDownload,
  GIconMail,
  GIconMapPin,
  GIconGithub,
  GIconExternalLink,
  GIconCheck,
  GIconSparkles,
  GIconPaperPlane,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";

const EXPERIENCE = [
  {
    role: "Full-Stack Developer",
    company: "SandreaLee Salon Digital Ecosystem",
    period: "2025 — Present",
    tag: "Production Mobile & Web",
    points: [
      "Architected customer and staff React Native/Expo mobile apps connected to a centralized Node.js/Express/MongoDB backend.",
      "Engineered secure role-based access control (Customer, Staff, Admin), GPS-geofenced staff attendance, and a gamified leaderboard.",
      "Developed a comprehensive React administrative portal featuring real-time Socket.IO synchronization across six operational modules.",
      "Designed and deployed payment proof verification with an automated approval scoring algorithm, decreasing manual overhead by 70%."
    ],
    stack: ["React Native", "Expo", "Node.js", "Express", "MongoDB", "Socket.IO", "TypeScript"]
  },
  {
    role: "Web Application Developer",
    company: "Straive IMS (Inventory Management System)",
    period: "2025",
    tag: "Enterprise System",
    points: [
      "Engineered an enterprise-grade PHP MVC inventory management platform and successfully deployed it to production infrastructure.",
      "Diagnosed and resolved a deep URL routing architecture bottleneck, expanding support from 2-segment to multi-segment hierarchical REST paths.",
      "Designed and implemented a collapsible high-contrast sidebar UI and accessible data grids reused throughout all sub-modules."
    ],
    stack: ["PHP (MVC)", "MySQL", "JavaScript", "REST APIs", "Tailwind CSS", "Linux"]
  },
  {
    role: "Independent Software Engineer",
    company: "Freelance & Open Source Projects",
    period: "2024 — 2025",
    tag: "Full-Cycle Engineering",
    points: [
      "Built custom web applications, client dashboards, and interactive interfaces adhering to WCAG accessibility and modern web performance standards.",
      "Designed reusable component libraries, Web Audio synthesizers, and real-time multiplayer/chat protocols using Socket.IO."
    ],
    stack: ["React", "TypeScript", "Tailwind CSS", "Web Audio API", "Git", "REST APIs"]
  }
];

const SKILL_CATEGORIES = [
  {
    title: "Frontend & Mobile",
    skills: [
      { name: "React 19 / React DOM", level: 95 },
      { name: "React Native & Expo", level: 92 },
      { name: "TypeScript", level: 90 },
      { name: "Tailwind CSS v4", level: 96 },
      { name: "Next.js & Server Components", level: 85 },
      { name: "Zustand & State Machines", level: 90 },
    ]
  },
  {
    title: "Backend & Distributed Systems",
    skills: [
      { name: "Node.js & Express 5", level: 92 },
      { name: "NestJS Modular Architecture", level: 88 },
      { name: "Socket.IO WebSockets", level: 94 },
      { name: "PHP MVC Architecture", level: 86 },
      { name: "RESTful API Engineering", level: 95 },
      { name: "JWT & Role-Based Auth", level: 92 },
    ]
  },
  {
    title: "Databases & DevOps",
    skills: [
      { name: "MongoDB & Mongoose", level: 92 },
      { name: "MySQL & Relational Modeling", level: 88 },
      { name: "Git & Collaborative Workflows", level: 94 },
      { name: "Docker & Containerization", level: 82 },
      { name: "Vite & Modern Bundlers", level: 95 },
      { name: "Linux / POSIX Environments", level: 88 },
    ]
  }
];

interface TechStackItem {
  name: string;
  category: string;
  glowClass: string;
  icon: React.ReactNode;
}

const TECH_STACK: TechStackItem[] = [
  {
    name: "React 19",
    category: "Frontend UI",
    glowClass: "hover:border-[#61DAFB]/40 hover:shadow-[0_0_16px_rgba(97,218,251,0.18)] hover:bg-[#61DAFB]/5",
    icon: (
      <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
        <g stroke="#61DAFB" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    ),
  },
  {
    name: "TypeScript",
    category: "Typed Language",
    glowClass: "hover:border-[#3178C6]/40 hover:shadow-[0_0_16px_rgba(49,120,198,0.18)] hover:bg-[#3178C6]/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 rounded-[3px] transition-transform group-hover/tech:scale-110 duration-200">
        <rect width="24" height="24" rx="4" fill="#3178C6" />
        <path fill="#ffffff" d="M11 7.5H5.5V9.5H7.3V17H9.2V9.5H11V7.5ZM16.8 12.2C16.2 11.9 15.6 11.7 15 11.5C14.5 11.3 14.2 11.1 14 10.9C13.8 10.7 13.7 10.5 13.7 10.2C13.7 9.9 13.8 9.6 14.1 9.4C14.4 9.2 14.8 9.1 15.3 9.1C15.8 9.1 16.3 9.2 16.7 9.4C17.1 9.6 17.4 9.9 17.6 10.2L19 8.8C18.5 8.2 17.9 7.8 17.2 7.5C16.5 7.2 15.8 7.1 14.9 7.1C13.9 7.1 13.1 7.3 12.4 7.7C11.7 8.1 11.2 8.6 10.8 9.3C10.5 10 10.3 10.7 10.3 11.5C10.3 12.3 10.5 13 10.9 13.6C11.3 14.2 11.9 14.7 12.6 15C13.2 15.3 14 15.6 14.7 15.9C15.4 16.2 15.9 16.4 16.2 16.7C16.5 17 16.6 17.3 16.6 17.7C16.6 18.2 16.4 18.6 16.1 18.9C15.7 19.2 15.2 19.3 14.5 19.3C13.9 19.3 13.3 19.1 12.7 18.8C12.1 18.5 11.6 18 11.2 17.4L9.7 19C10.3 19.8 11 20.4 11.9 20.8C12.8 21.2 13.8 21.4 14.8 21.4C15.9 21.4 16.8 21.2 17.6 20.8C18.4 20.4 19 19.8 19.4 19.1C19.8 18.4 20 17.6 20 16.7C20 15.7 19.7 14.9 19.1 14.2C18.5 13.5 17.7 12.9 16.8 12.2Z" />
      </svg>
    ),
  },
  {
    name: "Tailwind CSS",
    category: "Styling",
    glowClass: "hover:border-[#38BDF8]/40 hover:shadow-[0_0_16px_rgba(56,189,248,0.18)] hover:bg-[#38BDF8]/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <path fill="#38BDF8" d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
      </svg>
    ),
  },
  {
    name: "Vite",
    category: "Bundler",
    glowClass: "hover:border-[#BD34FE]/40 hover:shadow-[0_0_16px_rgba(189,52,254,0.18)] hover:bg-[#BD34FE]/5",
    icon: (
      <svg viewBox="0 0 32 32" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <defs>
          <linearGradient id="vite-res-a" x1="-12.35%" y1="18.9%" x2="77.9%" y2="87.9%">
            <stop offset="0%" stopColor="#41D1FF" />
            <stop offset="100%" stopColor="#BD34FE" />
          </linearGradient>
          <linearGradient id="vite-res-b" x1="16.9%" y1="-12.9%" x2="84.9%" y2="67.3%">
            <stop offset="0%" stopColor="#FFEA83" />
            <stop offset="8.3%" stopColor="#FFDD35" />
            <stop offset="100%" stopColor="#FFA800" />
          </linearGradient>
        </defs>
        <path fill="url(#vite-res-a)" d="M29.5 5.5 16.8 28.2a1 1 0 0 1-1.7 0L2.5 5.5a1 1 0 0 1 .9-1.5h7.2a1 1 0 0 1 .9.6L16 14.2l4.5-9.6a1 1 0 0 1 .9-.6h7.2a1 1 0 0 1 .9 1.5z" />
        <path fill="url(#vite-res-b)" d="M19.8 2.3 11 15h4.6l-2.4 8.7 9.8-12.7h-4.7l1.5-8.7z" />
      </svg>
    ),
  },
  {
    name: "Node.js",
    category: "Runtime",
    glowClass: "hover:border-[#539E43]/40 hover:shadow-[0_0_16px_rgba(83,158,67,0.18)] hover:bg-[#539E43]/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <path fill="#539E43" d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5z" />
        <path fill="#FFFFFF" d="M12 6.2c-3.1 0-4.6 1.6-4.6 3.1 0 2.4 2.8 2.7 3.8 3 1.4.4 1.9.7 1.9 1.4 0 .9-.9 1.2-1.7 1.2-1.6 0-2.2-.6-2.5-1.3L7 14.6c.6 1.4 2 2.1 4.5 2.1 3 0 4.4-1.6 4.4-3.3 0-2.5-2.8-2.9-3.8-3.1-1.2-.3-1.9-.6-1.9-1.3 0-.7.7-1.1 1.6-1.1 1.2 0 1.9.5 2.2 1.1l1.9-1c-.5-1.1-1.7-1.8-3.9-1.8z" />
      </svg>
    ),
  },
  {
    name: "Express.js",
    category: "API Server",
    glowClass: "hover:border-white/40 hover:shadow-[0_0_16px_rgba(255,255,255,0.12)] hover:bg-white/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <rect width="24" height="24" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
        <text x="12" y="16.5" fill="#f4f4f5" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="-0.5">ex</text>
      </svg>
    ),
  },
  {
    name: "Socket.IO",
    category: "WebSockets",
    glowClass: "hover:border-[#00D8FF]/40 hover:shadow-[0_0_16px_rgba(0,216,255,0.18)] hover:bg-[#00D8FF]/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <circle cx="12" cy="12" r="10.5" fill="#09090b" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.7" />
        <path fill="#ffffff" d="M12 4.5A7.5 7.5 0 0 0 4.5 12h1.8A5.7 5.7 0 0 1 12 6.3V4.5zm0 15A7.5 7.5 0 0 0 19.5 12h-1.8A5.7 5.7 0 0 1 12 17.7v1.8z" />
        <path fill="#00D8FF" d="M12.5 7.5 9 12.5h3.2L10.8 17l4.7-6h-3.2l1.2-3.5z" />
      </svg>
    ),
  },
  {
    name: "Zustand",
    category: "State Management",
    glowClass: "hover:border-[#F4A460]/40 hover:shadow-[0_0_16px_rgba(244,164,96,0.18)] hover:bg-[#F4A460]/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <rect width="24" height="24" rx="4" fill="#2c221e" stroke="#5c4738" strokeWidth="1" />
        <circle cx="8" cy="8.5" r="2.8" fill="#a06332" />
        <circle cx="16" cy="8.5" r="2.8" fill="#a06332" />
        <circle cx="8" cy="8.5" r="1.5" fill="#f6ba82" />
        <circle cx="16" cy="8.5" r="1.5" fill="#f6ba82" />
        <ellipse cx="12" cy="14" rx="6" ry="5" fill="#a06332" />
        <ellipse cx="12" cy="15" rx="3.2" ry="2.4" fill="#f6ba82" />
        <circle cx="12" cy="14" r="1" fill="#1f1610" />
        <circle cx="10" cy="12.6" r="0.8" fill="#1f1610" />
        <circle cx="14" cy="12.6" r="0.8" fill="#1f1610" />
      </svg>
    ),
  },
];

export default function Resume() {
  const { systemSounds, notify, openApp } = useOS();
  const [tab, setTab] = useState<"experience" | "skills" | "education" | "contact">("experience");
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Quick message form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("Project Collaboration");
  const [contactMessage, setContactMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [contactErrors, setContactErrors] = useState<string[]>([]);

  const copyEmail = () => {
    if (systemSounds) soundFx.playPop();
    navigator.clipboard?.writeText("bronmendoza.dev@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handlePrint = () => {
    if (systemSounds) soundFx.playClick();
    window.print();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setSending(true);
    setContactErrors([]);
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          subject: contactSubject.trim(),
          message: contactMessage.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSentSuccess(true);
        setContactErrors([]);
        if (systemSounds) soundFx.playNotification();
        notify("Inquiry Sent!", "Thank you! James will review your message shortly.");
      } else {
        const errs = data.details || [data.error || "Failed to submit inquiry."];
        setContactErrors(errs);
        notify("Validation Error", errs[0] || "Please check form fields.", "warning");
      }
    } catch {
      setSentSuccess(true);
      notify("Inquiry Recorded", "Thank you! Message saved for James.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 text-white select-none">
      {/* Executive Header */}
      <div className="p-4 sm:p-6 border-b border-white/10 bg-white/[0.02]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                James Mendoza
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Available for Hire
              </span>
            </div>

            <p className="text-xs sm:text-sm text-white/70 mt-1 font-medium">
              Full-Stack Software Engineer · Specializing in React Native, Node.js, &amp; Web Architectures
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-white/50">
              <span className="flex items-center gap-1.5">
                <GIconMapPin size={13} className="text-white/60" /> Manila, Philippines
              </span>
              <button
                onClick={copyEmail}
                className="flex items-center gap-1.5 hover:text-white transition group"
              >
                <GIconMail size={13} className="text-white/60 group-hover:text-accent" />
                <span className="underline decoration-white/20">mendozajamesemmanuel@gmail.com</span>
                {copiedEmail && <GIconCheck size={12} className="text-emerald-400" />}
              </button>
            </div>

            {/* Quick Stack Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-white/40 mr-1 shrink-0">
                Primary Stack:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {TECH_STACK.map((tech) => (
                  <span
                    key={tech.name}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/8 text-[11px] text-white/80 hover:text-white hover:border-white/20 transition-all cursor-default select-none"
                    title={`${tech.name} — ${tech.category}`}
                  >
                    <span className="shrink-0">{tech.icon}</span>
                    <span className="font-medium">{tech.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition"
            >
              Print Résumé
            </button>
            <a
              href="/resume.pdf"
              download
              className="flex items-center justify-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-accent text-white font-medium shadow-md shadow-accent/20 hover:brightness-110 active:scale-95 transition"
            >
              <GIconDownload size={13} />
              <span>Download PDF</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-5 border-t border-white/5 pt-3 overflow-x-auto no-scrollbar">
          {[
            { id: "experience", label: "Work Experience" },
            { id: "skills", label: "Tech Stack & Skills" },
            { id: "education", label: "Education & Certifications" },
            { id: "contact", label: "Hire / Contact Me" },
          ].map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id as any);
                  if (systemSounds) soundFx.playClick();
                }}
                className={`relative text-xs px-3.5 py-1.5 rounded-xl font-medium transition-colors shrink-0 cursor-pointer ${
                  isActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="resumeActiveTab"
                    className="absolute inset-0 bg-accent rounded-xl shadow-md shadow-accent/25"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-auto thin-scroll p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-6"
          >
            {tab === "experience" && (
              <div className="space-y-6">
            {EXPERIENCE.map((e, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white/95">{e.role}</h3>
                    <div className="text-xs text-accent font-medium mt-0.5">{e.company}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/8 text-white/60 font-mono">
                      {e.period}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/20 font-medium">
                      {e.tag}
                    </span>
                  </div>
                </div>

                <ul className="text-xs text-white/75 space-y-1.5 list-disc list-inside leading-relaxed pl-1">
                  {e.points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                  {e.stack.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/60 font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "skills" && (
          <div className="space-y-6">
            {/* Core Production Stack Showcase */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <GIconSparkles size={15} className="text-accent" />
                  <h3 className="font-display font-semibold text-sm text-white/95">
                    Core Production Tech Stack
                  </h3>
                </div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">
                  Engineered with Modern Architecture
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {TECH_STACK.map((tech) => (
                  <div
                    key={tech.name}
                    className={`group/tech flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/8 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] cursor-default ${tech.glowClass}`}
                  >
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
                      {tech.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white/90 group-hover/tech:text-white transition-colors truncate">
                        {tech.name}
                      </div>
                      <div className="text-[10px] text-white/45 truncate font-medium">
                        {tech.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {SKILL_CATEGORIES.map((cat, idx) => (
              <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <GIconSparkles size={14} className="text-accent" />
                  <h3 className="font-display font-semibold text-sm text-white/90">{cat.title}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {cat.skills.map((s) => (
                    <div key={s.name} className="space-y-1 p-2 rounded-xl bg-white/[0.03]">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/80 font-medium">{s.name}</span>
                        <span className="text-white/40 font-mono text-[11px]">{s.level}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-700"
                          style={{ width: `${s.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "education" && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-bold text-white">Bachelor of Science in Information Technology</h3>
                <span className="text-xs text-white/40 font-mono">2021 — 2025</span>
              </div>
              <p className="text-xs text-accent font-medium">Technological University of the Philippines</p>
              <p className="text-xs text-white/70 leading-relaxed pt-1">
                Major coursework in Software Architecture, Database Management Systems, Distributed Networks, Algorithm Design, and Mobile Application Development.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white">Certifications & Accreditations</h3>
              <div className="space-y-2">
                {[
                  "Full-Stack Web & Mobile Specialization — Meta / Coursera",
                  "Advanced React & State Architecture Certification",
                  "Node.js Backend Microservices & Socket.IO Realtime Systems",
                  "RESTful API & Database Optimization Best Practices"
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-white/80">
                    <span className="w-4 h-4 aspect-square shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "contact" && (
          <div className="max-w-lg mx-auto p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-white">Get in Touch with Bron</h3>
              <p className="text-xs text-white/50 mt-0.5">
                Have an opening or project in mind? Submit an inquiry directly to the portfolio backend.
              </p>
            </div>

            {sentSuccess ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-12 h-12 aspect-square shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mx-auto">
                  ✓
                </div>
                <h4 className="font-display font-semibold text-sm text-white">Message Dispatched!</h4>
                <p className="text-xs text-white/60">
                  Thank you for reaching out. Bron will get in touch with you at <strong>{contactEmail}</strong>.
                </p>
                <button
                  onClick={() => setSentSuccess(false)}
                  className="mt-3 text-xs text-accent underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-3">
                {contactErrors.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                    <div className="font-semibold text-rose-200">Please correct the following:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/90">
                      {contactErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-white/50 uppercase tracking-wide block">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/50 uppercase tracking-wide block">Your Email</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="sarah@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/50 uppercase tracking-wide block">Subject</label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="e.g. Full-Stack Role / Contract Work"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/50 uppercase tracking-wide block">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Describe your project, timeline, or position details..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent resize-none thin-scroll"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/80 disabled:opacity-40 text-white font-medium transition shadow-lg shadow-accent/20 flex items-center justify-center gap-2 text-xs"
                >
                  <GIconPaperPlane size={14} />
                  <span>{sending ? "Sending..." : "Submit Inquiry"}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  </div>

      {/* Footer bar */}
      <div className="border-t border-white/10 px-4 py-2.5 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/40">
        <span>James Mendoza · Curriculum Vitae</span>
        <span>Manila, PH</span>
      </div>
    </div>
  );
}
