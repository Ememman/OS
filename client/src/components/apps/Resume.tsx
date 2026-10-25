import { GIconDownload, GIconMail, GIconMapPin } from "../icons/GravityIcons";

const EXPERIENCE = [
  {
    role: "Full-Stack Developer — SandreaLee Salon System",
    period: "2025 — Present",
    points: [
      "Built customer and staff React Native/Expo apps sharing a Node/Express/MongoDB backend.",
      "Designed role-based auth (customer, staff, admin), GPS attendance, and a leaderboard gamification system.",
      "Built a React admin dashboard with real-time updates via Socket.IO and full CRUD across six modules."
    ]
  },
  {
    role: "Web Developer — Straive IMS (Inventory Management System)",
    period: "2025",
    points: [
      "Built a PHP MVC inventory system and deployed it to production hosting.",
      "Diagnosed and fixed a routing architecture issue limiting the app to two-segment URL paths.",
      "Designed a dark, collapsible sidebar UI system reused across the app."
    ]
  }
];

const SKILLS = ["React", "React Native / Expo", "Node.js", "Express", "MongoDB", "PHP (MVC)", "MySQL", "Socket.IO", "Tailwind CSS", "REST APIs"];

export default function Resume() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-2xl font-semibold">Bron Mendoza</h2>
          <p className="text-sm text-white/60">Full-Stack Developer — MERN &amp; Mobile</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><GIconMapPin size={13} className="text-white/60" /> Manila, Philippines</span>
            <span className="flex items-center gap-1.5"><GIconMail size={13} className="text-white/60" /> hello@example.com</span>
          </div>
        </div>
        <a
          href="/resume.pdf"
          download
          className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-accent text-white shrink-0 hover:brightness-110 active:scale-95 transition"
        >
          <GIconDownload size={14} /> Download PDF
        </a>
      </div>

      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wide text-white/40 mb-2">Experience</h3>
        <div className="space-y-4">
          {EXPERIENCE.map((e) => (
            <div key={e.role}>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5">
                <div className="text-sm font-medium">{e.role}</div>
                <div className="text-[11px] text-white/40 shrink-0">{e.period}</div>
              </div>
              <ul className="mt-1 text-xs text-white/65 list-disc list-inside space-y-0.5">
                {e.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wide text-white/40 mb-2">Skills</h3>
        <div className="flex flex-wrap gap-1.5">
          {SKILLS.map((s) => (
            <span key={s} className="text-[11px] px-2 py-1 rounded-full bg-white/8 text-white/70">{s}</span>
          ))}
        </div>
      </section>

      <p className="text-[10px] text-white/30 mt-6">
        Edit this content in src/components/apps/Resume.jsx, and drop your real PDF at client/public/resume.pdf so the download button works.
      </p>
    </div>
  );
}
