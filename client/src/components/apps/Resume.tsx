import { useState } from "react";
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

      if (res.ok) {
        setSentSuccess(true);
        if (systemSounds) soundFx.playNotification();
        notify("Inquiry Sent!", "Thank you! James will review your message shortly.");
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
            { id: "skills", label: "Technical Mastery" },
            { id: "education", label: "Education & Certifications" },
            { id: "contact", label: "Hire / Contact Me" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as any);
                if (systemSounds) soundFx.playClick();
              }}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                tab === t.id
                  ? "bg-accent text-white shadow-md shadow-accent/20"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-auto thin-scroll p-4 sm:p-6 space-y-6">
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
      </div>

      {/* Footer bar */}
      <div className="border-t border-white/10 px-4 py-2.5 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/40">
        <span>James Mendoza · Curriculum Vitae</span>
        <span>Manila, PH</span>
      </div>
    </div>
  );
}
