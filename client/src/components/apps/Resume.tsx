import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GIconDownload,
  GIconMail,
  GIconMapPin,
  GIconCheck,
  GIconCode,
  GIconCpu,
  GIconPaperPlane,
  GIconGithub,
  GIconExternalLink,
  GIconBriefcase,
  GIconGraduationCap,
  GIconCopy,
  GIconLayoutCells,
  GIconLinkedin,
  GIconPrinter,
  GIconPhone,
  GIconTrophy,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import dowinnLogo from "../../assets/dowinn-group.png";
import straiveLogo from "../../assets/straive.png";
import ntcLogo from "../../assets/ntc.png";

const FULL_NAME = "JAMES EMMANUEL E. MENDOZA";
const LOCATION = "Tondo, Manila";
const PHONE = "0992 543 3570";
const CONTACT_EMAIL = "mendozajamesemmanuel@gmail.com";
const GITHUB_URL = "https://github.com/Ememman";
const LINKEDIN_URL = "https://www.linkedin.com/in/james-emmanuel-mendoza-46b377373/";

const EXPERIENCE = [
  {
    role: "Front-End Developer",
    company: "Dowinn Group",
    logo: dowinnLogo,
    period: "September 28, 2026 — Present",
    tag: "Enterprise Front-End & Automation",
    location: "12F Aseana Tower 3, Asean Ave. cor. Diosdado Macapagal Blvd. Aseana City, Parañaque",
    points: [
      "Engineered high-performance enterprise front-end web applications and internal operational portals utilizing Next.js, React, and TypeScript.",
      "Integrated TanStack Query for advanced asynchronous server-state synchronization, optimistic updates, intelligent query caching, and reduced network roundtrips.",
      "Automated cross-browser and mobile end-to-end testing pipelines using Playwright, Appium, and Selenium to ensure high software reliability and zero regression escapes.",
      "Designed clean, WCAG-accessible component architectures with Tailwind CSS and shadcn/ui; streamlined cross-functional development sprints, system documentation, and engineering workflows via Notion and GitHub."
    ],
    highlights: ["Next.js & TypeScript", "TanStack Query State Sync", "Playwright, Appium & Selenium", "Tailwind CSS & shadcn/ui"],
    stack: ["Next.js", "React", "TypeScript", "TanStack Query", "Playwright", "Appium", "Selenium", "Tailwind CSS", "shadcn/ui", "Notion", "GitHub"]
  },
  {
    role: "IT Support Specialist & Web Developer (On the Job Training)",
    company: "Straive",
    logo: straiveLogo,
    period: "February 02, 2026 — March 24, 2026",
    tag: "Enterprise IT Support & IMS Development",
    location: "SPi Global Building, Pascor Dr, Parañaque, 1700",
    points: [
      "Architected and engineered the Straive IMS (Inventory Management System) in PHP (MVC) and MySQL, implementing custom hierarchical REST routing, accessible data grids, and a high-contrast collapsible sidebar UI.",
      "Applied academic knowledge to real-world IT support — Resolved issues like BIOS configuration, BitLocker lockouts, and RDP errors, moving beyond textbook theory.",
      "Developed communication & teamwork skills — Walked frustrated users through technical fixes, collaborated closely with senior colleagues, and shared team wins.",
      "Managed time under operational pressure — Balanced weekend duties, bulk agent registrations, and documentation while prioritizing effectively.",
      "Strengthened technical skills in key tools — Hands-on with 1Kosmos (MFA/biometrics), RDP, Active Directory, BitLocker, and security tools (WorkMate, Sentinel, Netskope)."
    ],
    highlights: ["Straive IMS (PHP MVC)", "1Kosmos MFA & Biometrics", "Active Directory & BitLocker", "RDP & BIOS Resolution"],
    stack: ["PHP (MVC)", "MySQL", "1Kosmos MFA", "Active Directory", "BitLocker", "RDP", "Sentinel", "Netskope", "WorkMate", "REST APIs", "Tailwind CSS"]
  },
  {
    role: "Lead Full-Stack Developer (Capstone, Projects & Activities)",
    company: "National Teachers College (BSIT)",
    logo: ntcLogo,
    period: "2024 — 2026",
    tag: "Best in Research · Academic Honors",
    location: "629 J. Nepomuceno Street, Quiapo, Manila",
    points: [
      "Awarded Best in Research (May 02, 2026) as Lead Developer for the SandreaLee Salon (SALON) Digital Ecosystem — architected customer & staff mobile apps (React Native/Expo) and an administrative portal (React, Node.js, Express, MongoDB, Socket.IO) featuring GPS-geofenced attendance and automated payment scoring.",
      "Architected Portfolio OS — a full-featured web desktop environment and developer platform with draggable multi-instance window compositing, real-time WebSocket chatrooms with reactions, retro arcade games (Block Blast, 2048, Snake, Minesweeper), and Web Audio synthesizers.",
      "Created interactive student platforms including Flash-Cards (interactive 3D card-flip transitions and local study deck persistence) and Quiz-App (60-second timed challenges with instant feedback and lifetime score stats).",
      "Gathered system requirements, organized student & user feedback, tested basic and core functionalities, debugged critical errors, and documented code changes across all academic projects and student activities."
    ],
    highlights: ["Best in Research (May 2026)", "SandreaLee Salon Ecosystem", "Portfolio OS Web Desktop", "React Native & MERN Stack"],
    stack: ["React 19", "React Native", "Expo", "Node.js", "Express", "MongoDB", "Socket.IO", "PHP", "Tailwind CSS", "JavaScript", "TypeScript"]
  }
];

const PROFESSIONAL_COMPETENCIES = [
  {
    title: "Full-Stack & Front-End Engineering",
    desc: "Versatile developer proficient in Next.js, React, TypeScript, PHP, Node.js, and MongoDB, with hands-on expertise in design tools (Figma, Canva) and project management.",
    badge: "Core Stack",
  },
  {
    title: "Requirements Gathering & Automated Testing",
    desc: "Gathered system requirements, organized user feedback, and tested basic, core, and automated functionalities via Playwright, Appium, and Selenium.",
    badge: "SDLC & QA",
  },
  {
    title: "Code Documentation, Debugging & UX Optimization",
    desc: "Documented code changes, debugged errors, improved software performance, latency bottlenecks, responsive layouts, and overall user experience.",
    badge: "Quality & UX",
  },
  {
    title: "Programming & Root-Cause Technical Solutions",
    desc: "Proficient in programming/coding and problem-solving — identifying root causes, developing scalable technical solutions, and resolving operational blockers.",
    badge: "Problem Solving",
  },
  {
    title: "Technical Collaboration & Agile Sprints",
    desc: "Provided technical opinions and coding solutions in group discussions, design reviews, cross-functional sprints, and team collaboration with Notion and GitHub.",
    badge: "Teamwork",
  },
];

const SKILL_CATEGORIES = [
  {
    title: "Frontend, Mobile & Design",
    description: "Component architecture, native bridges, state caching, and visual UI design",
    skills: [
      { name: "Next.js & React 19", level: 92, category: "Frontend" },
      { name: "TypeScript (Strict)", level: 88, category: "Language" },
      { name: "TanStack Query & State", level: 85, category: "State" },
      { name: "Tailwind CSS & shadcn/ui", level: 90, category: "Styling" },
      { name: "React Native & Expo", level: 85, category: "Mobile" },
      { name: "Figma & Canva (UI/UX)", level: 88, category: "Design" },
    ]
  },
  {
    title: "Backend & Systems",
    description: "REST APIs, realtime sockets, MVC architecture, and database pipelines",
    skills: [
      { name: "Node.js & Express 5", level: 85, category: "Backend" },
      { name: "PHP (MVC Architecture)", level: 88, category: "Backend" },
      { name: "Socket.IO WebSockets", level: 82, category: "Realtime" },
      { name: "MongoDB & Mongoose", level: 85, category: "NoSQL" },
      { name: "RESTful API Engineering", level: 88, category: "APIs" },
      { name: "MySQL & Relational Design", level: 80, category: "SQL" },
    ]
  },
  {
    title: "Testing, IT Support & Tooling",
    description: "Automation test suites, identity, disk encryption, and project tracking",
    skills: [
      { name: "Playwright & E2E Testing", level: 85, category: "Testing" },
      { name: "Appium & Selenium", level: 80, category: "Testing" },
      { name: "1Kosmos MFA & Active Directory", level: 85, category: "Security" },
      { name: "BitLocker & RDP Support", level: 85, category: "IT Support" },
      { name: "Git, GitHub & Notion", level: 92, category: "Tooling" },
      { name: "Windows Enterprise & Linux", level: 82, category: "System" },
    ]
  }
];

interface TechStackItem {
  name: string;
  category: "Frontend" | "Backend" | "Database" | "Tooling" | "Mobile";
  glowClass: string;
  badgeColor: string;
  icon: React.ReactNode;
}

const TECH_STACK: TechStackItem[] = [
  {
    name: "Next.js",
    category: "Frontend",
    badgeColor: "text-white bg-white/10 border-white/20",
    glowClass: "hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.18)] hover:bg-white/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <circle cx="12" cy="12" r="11" fill="#000000" stroke="#ffffff" strokeWidth="1.2" />
        <path d="M8.5 8v8M15.5 8v5.5l-6-5.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "React 19",
    category: "Frontend",
    badgeColor: "text-[#61DAFB] bg-[#61DAFB]/10 border-[#61DAFB]/30",
    glowClass: "hover:border-[#61DAFB]/50 hover:shadow-[0_0_20px_rgba(97,218,251,0.22)] hover:bg-[#61DAFB]/8",
    icon: (
      <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
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
    category: "Frontend",
    badgeColor: "text-[#38BDF8] bg-[#3178C6]/15 border-[#3178C6]/30",
    glowClass: "hover:border-[#3178C6]/50 hover:shadow-[0_0_20px_rgba(49,120,198,0.22)] hover:bg-[#3178C6]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 rounded-[4px] transition-transform group-hover/tech:scale-110 duration-200">
        <rect width="24" height="24" rx="4" fill="#3178C6" />
        <path fill="#ffffff" d="M11 7.5H5.5V9.5H7.3V17H9.2V9.5H11V7.5ZM16.8 12.2C16.2 11.9 15.6 11.7 15 11.5C14.5 11.3 14.2 11.1 14 10.9C13.8 10.7 13.7 10.5 13.7 10.2C13.7 9.9 13.8 9.6 14.1 9.4C14.4 9.2 14.8 9.1 15.3 9.1C15.8 9.1 16.3 9.2 16.7 9.4C17.1 9.6 17.4 9.9 17.6 10.2L19 8.8C18.5 8.2 17.9 7.8 17.2 7.5C16.5 7.2 15.8 7.1 14.9 7.1C13.9 7.1 13.1 7.3 12.4 7.7C11.7 8.1 11.2 8.6 10.8 9.3C10.5 10 10.3 10.7 10.3 11.5C10.3 12.3 10.5 13 10.9 13.6C11.3 14.2 11.9 14.7 12.6 15C13.2 15.3 14 15.6 14.7 15.9C15.4 16.2 15.9 16.4 16.2 16.7C16.5 17 16.6 17.3 16.6 17.7C16.6 18.2 16.4 18.6 16.1 18.9C15.7 19.2 15.2 19.3 14.5 19.3C13.9 19.3 13.3 19.1 12.7 18.8C12.1 18.5 11.6 18 11.2 17.4L9.7 19C10.3 19.8 11 20.4 11.9 20.8C12.8 21.2 13.8 21.4 14.8 21.4C15.9 21.4 16.8 21.2 17.6 20.8C18.4 20.4 19 19.8 19.4 19.1C19.8 18.4 20 17.6 20 16.7C20 15.7 19.7 14.9 19.1 14.2C18.5 13.5 17.7 12.9 16.8 12.2Z" />
      </svg>
    ),
  },
  {
    name: "TanStack Query",
    category: "Frontend",
    badgeColor: "text-[#FF4154] bg-[#FF4154]/10 border-[#FF4154]/30",
    glowClass: "hover:border-[#FF4154]/50 hover:shadow-[0_0_20px_rgba(255,65,84,0.22)] hover:bg-[#FF4154]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <circle cx="12" cy="12" r="10.5" fill="#18181b" stroke="#FF4154" strokeWidth="1.2" />
        <path fill="#FF4154" d="M12 5a7 7 0 1 0 7 7 7 7 0 0 0-7-7zm0 10.5a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5z" />
        <circle cx="12" cy="12" r="1.5" fill="#FFD15C" />
      </svg>
    ),
  },
  {
    name: "Tailwind & shadcn/ui",
    category: "Frontend",
    badgeColor: "text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30",
    glowClass: "hover:border-[#38BDF8]/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.22)] hover:bg-[#38BDF8]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <path fill="#38BDF8" d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
      </svg>
    ),
  },
  {
    name: "Playwright",
    category: "Tooling",
    badgeColor: "text-[#45BA4B] bg-[#45BA4B]/10 border-[#45BA4B]/30",
    glowClass: "hover:border-[#45BA4B]/50 hover:shadow-[0_0_20px_rgba(69,186,75,0.22)] hover:bg-[#45BA4B]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <circle cx="9" cy="12" r="6" fill="#45BA4B" fillOpacity="0.85" />
        <circle cx="15" cy="12" r="6" fill="#E6533C" fillOpacity="0.85" />
        <circle cx="9" cy="12" r="2.2" fill="#ffffff" />
        <circle cx="15" cy="12" r="2.2" fill="#ffffff" />
      </svg>
    ),
  },
  {
    name: "Appium / Selenium",
    category: "Tooling",
    badgeColor: "text-[#66C0F4] bg-[#66C0F4]/10 border-[#66C0F4]/30",
    glowClass: "hover:border-[#66C0F4]/50 hover:shadow-[0_0_20px_rgba(102,192,244,0.22)] hover:bg-[#66C0F4]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200" fill="none" stroke="#66C0F4" strokeWidth="1.8">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <path d="M12 18h.01" />
        <path d="M9 6h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Figma",
    category: "Tooling",
    badgeColor: "text-[#F24E1E] bg-[#F24E1E]/10 border-[#F24E1E]/30",
    glowClass: "hover:border-[#F24E1E]/50 hover:shadow-[0_0_20px_rgba(242,78,30,0.22)] hover:bg-[#F24E1E]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <path fill="#0ACF83" d="M12 24a4 4 0 0 0 4-4v-4h-4a4 4 0 1 0 0 8z" />
        <path fill="#A259FF" d="M8 16a4 4 0 0 1-4-4 4 4 0 0 1 4-4h4v8H8z" />
        <path fill="#F24E1E" d="M8 8a4 4 0 0 1-4-4 4 4 0 0 1 4-4h4v8H8z" />
        <path fill="#FF7262" d="M12 0h4a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-4V0z" />
        <path fill="#1ABCFE" d="M20 12a4 4 0 0 1-4 4h-4v-8h4a4 4 0 0 1 4 4z" />
      </svg>
    ),
  },
  {
    name: "Canva",
    category: "Tooling",
    badgeColor: "text-[#00C4CC] bg-[#00C4CC]/10 border-[#00C4CC]/30",
    glowClass: "hover:border-[#00C4CC]/50 hover:shadow-[0_0_20px_rgba(0,196,204,0.22)] hover:bg-[#00C4CC]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <circle cx="12" cy="12" r="10" fill="#00C4CC" />
        <path fill="#ffffff" d="M15.2 14.5c-.8.6-1.8.8-2.8.5-1.4-.4-2.1-1.8-1.7-3.2.4-1.4 1.8-2.3 3.2-1.9.7.2 1.3.6 1.7 1.2l-1.2.9c-.3-.4-.6-.6-1-.7-.7-.2-1.4.3-1.6 1-.2.7.2 1.4.9 1.6.5.2 1.1 0 1.5-.2l.5.8z" />
      </svg>
    ),
  },
  {
    name: "PHP (MVC)",
    category: "Backend",
    badgeColor: "text-[#777BB4] bg-[#777BB4]/10 border-[#777BB4]/30",
    glowClass: "hover:border-[#777BB4]/50 hover:shadow-[0_0_20px_rgba(119,123,180,0.22)] hover:bg-[#777BB4]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <ellipse cx="12" cy="12" rx="11" ry="6.5" fill="#777BB4" />
        <text x="12" y="14" fill="#ffffff" fontFamily="system-ui, sans-serif" fontSize="6.5" fontWeight="900" textAnchor="middle">PHP</text>
      </svg>
    ),
  },
  {
    name: "Node.js",
    category: "Backend",
    badgeColor: "text-[#539E43] bg-[#539E43]/10 border-[#539E43]/30",
    glowClass: "hover:border-[#539E43]/50 hover:shadow-[0_0_20px_rgba(83,158,67,0.22)] hover:bg-[#539E43]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <path fill="#539E43" d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5z" />
        <path fill="#FFFFFF" d="M12 6.2c-3.1 0-4.6 1.6-4.6 3.1 0 2.4 2.8 2.7 3.8 3 1.4.4 1.9.7 1.9 1.4 0 .9-.9 1.2-1.7 1.2-1.6 0-2.2-.6-2.5-1.3L7 14.6c.6 1.4 2 2.1 4.5 2.1 3 0 4.4-1.6 4.4-3.3 0-2.5-2.8-2.9-3.8-3.1-1.2-.3-1.9-.6-1.9-1.3 0-.7.7-1.1 1.6-1.1 1.2 0 1.9.5 2.2 1.1l1.9-1c-.5-1.1-1.7-1.8-3.9-1.8z" />
      </svg>
    ),
  },
  {
    name: "MongoDB",
    category: "Database",
    badgeColor: "text-[#00ED64] bg-[#00ED64]/10 border-[#00ED64]/30",
    glowClass: "hover:border-[#00ED64]/50 hover:shadow-[0_0_20px_rgba(0,237,100,0.22)] hover:bg-[#00ED64]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <path fill="#00ED64" d="M12 2C11.5 3.5 8 9 8 13.5c0 3 2 5.5 4 6.5 2-1 4-3.5 4-6.5C16 9 12.5 3.5 12 2z" />
        <path fill="#00684A" d="M12 2v18c.3-.1.7-.3 1-.5 1.8-1 3-3.2 3-6 0-4.5-3.5-10-4-11.5z" />
      </svg>
    ),
  },
  {
    name: "React Native",
    category: "Mobile",
    badgeColor: "text-[#61DAFB] bg-[#61DAFB]/10 border-[#61DAFB]/30",
    glowClass: "hover:border-[#61DAFB]/50 hover:shadow-[0_0_20px_rgba(97,218,251,0.22)] hover:bg-[#61DAFB]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <rect x="5" y="2" width="14" height="20" rx="3" fill="#182335" stroke="#61DAFB" strokeWidth="1.5" />
        <circle cx="12" cy="18" r="1" fill="#61DAFB" />
        <path d="M9 5h6" stroke="#61DAFB" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="10.5" r="1.2" fill="#61DAFB" />
        <ellipse cx="12" cy="10.5" rx="4.5" ry="1.8" fill="none" stroke="#61DAFB" strokeWidth="0.8" transform="rotate(30 12 10.5)" />
        <ellipse cx="12" cy="10.5" rx="4.5" ry="1.8" fill="none" stroke="#61DAFB" strokeWidth="0.8" transform="rotate(-30 12 10.5)" />
      </svg>
    ),
  },
  {
    name: "Git & GitHub",
    category: "Tooling",
    badgeColor: "text-[#F05032] bg-[#F05032]/10 border-[#F05032]/30",
    glowClass: "hover:border-[#F05032]/50 hover:shadow-[0_0_20px_rgba(240,80,50,0.22)] hover:bg-[#F05032]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <path fill="#F05032" d="M21.6 10.4 13.6 2.4a2.26 2.26 0 0 0-3.2 0L8.3 4.5l3.3 3.3a2.68 2.68 0 0 1 3.4 3.4l3.2 3.2c.4-.1.7-.1 1.1-.1a2.69 2.69 0 0 1 1.9 4.6l.4.4a2.26 2.26 0 0 0 0-3.2zM7.2 5.6 2.4 10.4a2.26 2.26 0 0 0 0 3.2l8 8a2.26 2.26 0 0 0 3.2 0l2.1-2.1-3.3-3.3a2.68 2.68 0 0 1-3.4-3.4L5.7 9.5a2.68 2.68 0 0 1 1.5-3.9z" />
      </svg>
    ),
  },
  {
    name: "Notion",
    category: "Tooling",
    badgeColor: "text-white bg-white/10 border-white/25",
    glowClass: "hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.18)] hover:bg-white/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <rect width="24" height="24" rx="4" fill="#18181b" stroke="#52525b" strokeWidth="1" />
        <text x="12" y="16.5" fill="#ffffff" fontFamily="serif" fontSize="13" fontWeight="900" textAnchor="middle">N</text>
      </svg>
    ),
  },
  {
    name: "Socket.IO",
    category: "Backend",
    badgeColor: "text-[#00D8FF] bg-[#00D8FF]/10 border-[#00D8FF]/30",
    glowClass: "hover:border-[#00D8FF]/50 hover:shadow-[0_0_20px_rgba(0,216,255,0.22)] hover:bg-[#00D8FF]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <circle cx="12" cy="12" r="10.5" fill="#09090b" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.7" />
        <path fill="#ffffff" d="M12 4.5A7.5 7.5 0 0 0 4.5 12h1.8A5.7 5.7 0 0 1 12 6.3V4.5zm0 15A7.5 7.5 0 0 0 19.5 12h-1.8A5.7 5.7 0 0 1 12 17.7v1.8z" />
        <path fill="#00D8FF" d="M12.5 7.5 9 12.5h3.2L10.8 17l4.7-6h-3.2l1.2-3.5z" />
      </svg>
    ),
  },
  {
    name: "MySQL / SQL",
    category: "Database",
    badgeColor: "text-[#4479A1] bg-[#4479A1]/10 border-[#4479A1]/30",
    glowClass: "hover:border-[#4479A1]/50 hover:shadow-[0_0_20px_rgba(68,121,161,0.22)] hover:bg-[#4479A1]/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <ellipse cx="12" cy="6" rx="9" ry="3" fill="#00758F" />
        <path d="M3 6v6c0 1.66 4.03 3 9 3s9-1.34 9-3V6" fill="none" stroke="#F29111" strokeWidth="1.5" />
        <path d="M3 12v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" fill="none" stroke="#00758F" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: "Active Directory / Sec",
    category: "Tooling",
    badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    glowClass: "hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.22)] hover:bg-amber-400/8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 transition-transform group-hover/tech:scale-110 duration-200" fill="none" stroke="#FBBF24" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];

export default function Resume() {
  const { systemSounds, notify } = useOS();
  const [tab, setTab] = useState<"experience" | "skills" | "education" | "contact">("experience");
  const [skillFilter, setSkillFilter] = useState<string>("All");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

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
    navigator.clipboard?.writeText(CONTACT_EMAIL);
    setCopiedEmail(true);
    notify("Copied to Clipboard", "Email address copied successfully!", "info", 2000);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const copyPhone = () => {
    if (systemSounds) soundFx.playPop();
    navigator.clipboard?.writeText(PHONE);
    setCopiedPhone(true);
    notify("Copied to Clipboard", "Phone number copied successfully!", "info", 2000);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handlePrint = () => {
    if (systemSounds) soundFx.playClick();
    window.print();
  };

  const handleDownloadPdf = () => {
    if (systemSounds) soundFx.playClick();
    window.print();
    notify("Print / Save as PDF", "Select 'Save as PDF' in the destination dropdown to export a PDF copy.", "info", 3500);
  };

  const filteredTechStack = useMemo(() => {
    if (skillFilter === "All") return TECH_STACK;
    return TECH_STACK.filter((item) => item.category === skillFilter);
  }, [skillFilter]);

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
    <div className="h-full overflow-y-auto thin-scroll bg-[#0a0d14] text-white select-none flex flex-col">
      {/* Executive Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent shrink-0 space-y-3">
        {/* Top Bar: Name & Badges on Left, Action CTAs on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white/95 whitespace-nowrap">
              {FULL_NAME}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 shadow-[0_0_12px_rgba(56,189,248,0.2)] whitespace-nowrap">
                <img src={dowinnLogo} alt="Dowinn Group" className="w-3.5 h-3.5 rounded-sm object-contain shrink-0" />
                Front-End Developer at Dowinn Group
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 whitespace-nowrap">
                <GIconTrophy size={11} className="text-amber-300" />
                BSIT · Magna Cum Laude
              </span>
            </div>
          </div>

          {/* Action CTAs: Beautifully aligned grid on mobile, sleek flex row on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            {/* GitHub Button */}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 text-xs font-semibold rounded-xl bg-white/8 hover:bg-white/12 border border-white/12 text-white/90 hover:text-white inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all active:scale-95 shadow-sm"
              title="Visit GitHub: https://github.com/Ememman"
            >
              <GIconGithub size={13} className="text-white/90 shrink-0" />
              <span>GitHub</span>
              <GIconExternalLink size={9} className="opacity-60 shrink-0" />
            </a>

            {/* LinkedIn Button */}
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 text-xs font-semibold rounded-xl bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/40 text-[#70B5F9] hover:text-white inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all active:scale-95 shadow-sm shadow-[#0A66C2]/10"
              title={`Visit LinkedIn: ${LINKEDIN_URL}`}
            >
              <GIconLinkedin size={13} className="shrink-0 text-[#0A66C2]" />
              <span>LinkedIn</span>
              <GIconExternalLink size={9} className="opacity-60 shrink-0" />
            </a>

            {/* Print Résumé Button */}
            <button
              onClick={handlePrint}
              className="h-9 px-3 text-xs font-semibold rounded-xl bg-white/8 hover:bg-white/12 border border-white/12 text-white/90 hover:text-white inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Print Résumé"
            >
              <GIconPrinter size={12} className="text-white/80 shrink-0" />
              <span>Print Résumé</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-accent text-white inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm shadow-accent/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              title="Download PDF Copy"
            >
              <GIconDownload size={12} className="shrink-0" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Bio Paragraph: Full Width */}
        <p className="text-xs sm:text-sm text-white/75 font-medium leading-relaxed max-w-4xl">
          Front-End Developer at Dowinn Group &amp; Full-Stack Engineer · Next.js, React, TypeScript, TanStack Query, Node.js, MongoDB, PHP, Figma, Canva &amp; Automated Testing (Playwright, Appium, Selenium).
        </p>

        {/* Quick Contact & Profile Pills: Full Width Horizontal Row */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          {/* Location */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-white/75 text-[11px] sm:text-xs">
            <GIconMapPin size={12} className="text-accent shrink-0" />
            <span>{LOCATION}</span>
          </span>

          {/* Phone */}
          <button
            onClick={copyPhone}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 hover:border-emerald-400/40 hover:bg-emerald-500/10 text-white/80 hover:text-white transition cursor-pointer group text-[11px] sm:text-xs"
            title="Click to copy phone number / Call 0992 543 3570"
          >
            <GIconPhone size={11} className="text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-mono">{PHONE}</span>
            {copiedPhone ? (
              <GIconCheck size={11} className="text-emerald-400 shrink-0" />
            ) : (
              <GIconCopy size={10} className="text-white/40 group-hover:text-white shrink-0" />
            )}
          </button>

          {/* Email */}
          <button
            onClick={copyEmail}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 hover:border-accent/40 hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer group text-[11px] sm:text-xs"
            title="Click to copy email"
          >
            <GIconMail size={12} className="text-accent group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-mono">{CONTACT_EMAIL}</span>
            {copiedEmail ? (
              <GIconCheck size={11} className="text-accent shrink-0" />
            ) : (
              <GIconCopy size={10} className="text-white/40 group-hover:text-white shrink-0" />
            )}
          </button>

          {/* LinkedIn */}
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10 text-white/80 hover:text-white transition cursor-pointer group text-[11px] sm:text-xs"
            title={`Open LinkedIn Profile: ${LINKEDIN_URL}`}
          >
            <GIconLinkedin size={12} className="text-[#0A66C2] group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-mono">LinkedIn Profile</span>
            <GIconExternalLink size={9} className="text-white/40 group-hover:text-white shrink-0" />
          </a>

          {/* GitHub */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 hover:border-purple-400/40 hover:bg-purple-500/10 text-white/80 hover:text-white transition cursor-pointer group text-[11px] sm:text-xs"
            title={`Open GitHub: ${GITHUB_URL}`}
          >
            <GIconGithub size={12} className="text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-mono">github.com/Ememman</span>
            <GIconExternalLink size={9} className="text-white/40 group-hover:text-white shrink-0" />
          </a>
        </div>

        {/* Highlight Stack Chips (Smooth Horizontal Scroll to conserve vertical height) */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 overflow-x-auto thin-scroll flex-nowrap py-0.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-white/40 mr-1 shrink-0 flex items-center gap-1">
            <GIconLayoutCells size={11} className="text-accent" />
            Core Stack:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {TECH_STACK.slice(0, 8).map((tech) => (
              <span
                key={tech.name}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/8 text-[11px] text-white/85 hover:border-white/20 transition-all cursor-default select-none shrink-0"
                title={`${tech.name} · ${tech.category}`}
              >
                <span className="shrink-0 scale-90">{tech.icon}</span>
                <span className="font-medium whitespace-nowrap">{tech.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation Bar */}
      <div className="sticky top-0 z-20 shrink-0 px-3 sm:px-6 py-2.5 bg-[#090c12]/95 backdrop-blur-md border-b border-white/10 flex items-center gap-1 overflow-x-auto thin-scroll shadow-md">
        {[
          { id: "experience", label: "Work Experience", Icon: GIconBriefcase },
          { id: "skills", label: "Tech Stack & Skills", Icon: GIconCode },
          { id: "education", label: "Education & Certifications", Icon: GIconGraduationCap },
          { id: "contact", label: "Hire / Contact Me", Icon: GIconPaperPlane },
        ].map((t) => {
          const isActive = tab === t.id;
          const TabIcon = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as any);
                if (systemSounds) soundFx.playClick();
              }}
              className={`relative flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-medium transition-colors shrink-0 cursor-pointer min-h-[34px] ${
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
              <TabIcon size={13} className={`relative z-10 ${isActive ? "text-white" : "text-white/60"}`} />
              <span className="relative z-10 whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 p-4 sm:p-6 pb-12 sm:pb-8 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-6 max-w-5xl mx-auto"
          >
            {/* WORK EXPERIENCE */}
            {tab === "experience" && (
              <div className="space-y-4 sm:space-y-5">
                {EXPERIENCE.map((e, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-3.5 shadow-sm relative group/exp"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 border-b border-white/5 pb-2.5">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-white/95 group-hover/exp:text-accent transition-colors">
                          {e.role}
                        </h2>
                        <div className="text-xs text-accent font-semibold mt-1 flex flex-wrap items-center gap-1.5 leading-snug">
                          {e.logo && (
                            <img
                              src={e.logo}
                              alt={`${e.company} logo`}
                              className="w-5 h-5 rounded-md object-contain bg-white/10 p-0.5 border border-white/15 shadow-xs shrink-0"
                            />
                          )}
                          <span className="font-semibold text-accent">{e.company}</span>
                          <span className="text-white/30">·</span>
                          <span className="text-white/55 font-normal text-[11px] sm:text-xs">{e.location}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/8 text-white/70 font-mono">
                          {e.period}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25 font-semibold">
                          {e.tag}
                        </span>
                      </div>
                    </div>

                    {/* Key Highlights Pill Badges */}
                    {e.highlights && (
                      <div className="flex flex-wrap gap-1.5">
                        {e.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20"
                          >
                            <GIconCheck size={10} className="text-accent" />
                            {h}
                          </span>
                        ))}
                      </div>
                    )}

                    <ul className="text-xs text-white/80 space-y-2 leading-relaxed pl-1">
                      {e.points.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-accent shrink-0 mt-0.5 font-bold">▪</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-white/5">
                      {e.stack.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/70 font-mono"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TECH STACK & SKILLS */}
            {tab === "skills" && (
              <div className="space-y-6">
                {/* Professional Skills & Engineering Competencies (From Official CV) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <GIconCode size={16} className="text-accent" />
                      <h2 className="font-display font-semibold text-sm text-white/95">
                        Technical and Professional Skills
                      </h2>
                    </div>
                    <span className="text-[10px] text-white/50 font-mono">Core Competencies</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {PROFESSIONAL_COMPETENCIES.map((comp, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8 hover:border-accent/30 transition-all space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-bold text-white/90 group-hover:text-accent transition-colors flex items-center gap-1.5">
                            <span className="text-accent">▪</span>
                            <span>{comp.title}</span>
                          </h3>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 shrink-0">
                            {comp.badge}
                          </span>
                        </div>
                        <p className="text-xs text-white/75 leading-relaxed pl-3">
                          {comp.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack Interactive Grid */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <GIconLayoutCells size={16} className="text-accent" />
                      <h2 className="font-display font-semibold text-sm text-white/95">
                        Interactive Tech Stack Directory
                      </h2>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto thin-scroll">
                      {["All", "Frontend", "Backend", "Mobile", "Database", "Tooling"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSkillFilter(cat);
                            if (systemSounds) soundFx.playClick();
                          }}
                          className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                            skillFilter === cat
                              ? "bg-accent text-white font-semibold shadow-sm"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tech Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                    {filteredTechStack.map((tech) => (
                      <div
                        key={tech.name}
                        className={`group/tech flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.025] border border-white/8 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] cursor-default ${tech.glowClass}`}
                      >
                        <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0 shadow-inner">
                          {tech.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white/90 group-hover/tech:text-white transition-colors truncate">
                            {tech.name}
                          </div>
                          <span className={`inline-block text-[9px] font-medium px-1.5 py-0.2 rounded mt-0.5 border ${tech.badgeColor}`}>
                            {tech.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skill Categories Progress Deep-Dive */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SKILL_CATEGORIES.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <GIconCpu size={15} className="text-accent shrink-0" />
                          <h3 className="font-display font-semibold text-xs sm:text-sm text-white/95">
                            {cat.title}
                          </h3>
                        </div>
                        <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {cat.skills.map((s) => (
                          <div key={s.name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-white/80 font-medium text-[11px] truncate">{s.name}</span>
                              <span className="text-accent font-mono text-[10px] font-semibold">{s.level}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-accent to-sky-300 rounded-full transition-all duration-700"
                                style={{ width: `${s.level}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EDUCATION & CERTIFICATIONS */}
            {tab === "education" && (
              <div className="space-y-4 sm:space-y-5">
                {/* Degree Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-white">
                          Bachelor of Science in Information Technology
                        </h2>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                          <GIconTrophy size={11} className="text-amber-300" />
                          Magna Cum Laude
                        </span>
                      </div>
                      <div className="text-xs text-accent font-semibold mt-1 flex flex-wrap items-center gap-1.5 leading-snug">
                        <img
                          src={ntcLogo}
                          alt="National Teachers College logo"
                          className="w-5 h-5 rounded-md object-contain bg-white/10 p-0.5 border border-white/15 shadow-xs shrink-0"
                        />
                        <span className="font-semibold text-accent">National Teachers College</span>
                        <span className="text-white/30">·</span>
                        <span className="text-white/55 font-normal text-[11px] sm:text-xs">629 J. Nepomuceno Street, Quiapo, Manila</span>
                      </div>
                    </div>
                    <span className="text-xs text-white/70 font-mono bg-white/8 px-2.5 py-1 rounded-md self-start sm:self-auto border border-white/10">
                      2022 — 2026
                    </span>
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed pt-1">
                    Graduated Magna Cum Laude with high academic distinction. Comprehensive coursework covering software engineering, relational &amp; NoSQL database architecture, systems analysis and design, web technologies, and enterprise infrastructure.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                    {[
                      "Software Engineering",
                      "Web Systems & Technologies",
                      "Mobile App Development",
                      "Database Management Systems",
                      "Information Assurance & Security",
                      "Data Structures & Algorithms",
                      "Systems Analysis & Design",
                      "Object-Oriented Programming",
                    ].map((course) => (
                      <span key={course} className="text-[10px] px-2.5 py-1 rounded-md bg-white/5 border border-white/8 text-white/70 font-mono">
                        {course}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certifications & Achievements */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <GIconTrophy size={15} className="text-amber-400" />
                      <span>Achievements and Certifications</span>
                    </h3>
                    <span className="text-[10px] text-white/50 font-mono">Official Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Best in Research (SALON) */}
                    <div className="sm:col-span-2 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 flex items-start gap-3 relative shadow-[0_0_20px_rgba(245,158,11,0.08)]">
                      <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
                        <GIconTrophy size={18} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            <span>Best in Research (SALON)</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              Major Honor
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-amber-300/80 bg-amber-400/10 px-2 py-0.5 rounded">
                            May 02, 2026
                          </span>
                        </div>
                        <p className="text-[11px] text-white/75 leading-relaxed">
                          Awarded Best in Research for the design, development, and architectural implementation of the SandreaLee Salon (SALON) Digital Ecosystem across mobile, web, and backend services.
                        </p>
                      </div>
                    </div>

                    {/* Web Development (SoloLearn) */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8 hover:border-white/15 transition-colors flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-white/95">Web Development</span>
                          <span className="text-[10px] font-mono text-white/50">Jan 30, 2025</span>
                        </div>
                        <div className="text-[11px] text-accent font-medium">SoloLearn</div>
                        <p className="text-[10px] text-white/60">
                          Certified proficiency in modern web architecture, JavaScript interactions, and responsive full-stack styling.
                        </p>
                      </div>
                    </div>

                    {/* HTML5 (SoloLearn) */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8 hover:border-white/15 transition-colors flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-white/95">HTML5 Certification</span>
                          <span className="text-[10px] font-mono text-white/50">Nov 01, 2023</span>
                        </div>
                        <div className="text-[11px] text-accent font-medium">SoloLearn</div>
                        <p className="text-[10px] text-white/60">
                          Certified mastery in semantic HTML5 markup, accessibility, DOM layout, and modern browser standards.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HIRE / CONTACT ME */}
            {tab === "contact" && (
              <div className="max-w-2xl mx-auto space-y-5">
                {/* Contact Quick Channel Cards: 4 equal cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email Card */}
                  <button
                    onClick={copyEmail}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-accent/40 hover:bg-white/[0.06] transition-all text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/25 text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <GIconMail size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white">Direct Email</div>
                      <div className="text-[11px] text-white/50 truncate font-mono mt-0.5">{CONTACT_EMAIL}</div>
                    </div>
                    <span className="text-[10px] text-accent font-semibold px-2 py-0.5 rounded bg-accent/15">
                      {copiedEmail ? "Copied!" : "Copy"}
                    </span>
                  </button>

                  {/* Phone Card */}
                  <button
                    onClick={copyPhone}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-400/40 hover:bg-white/[0.06] transition-all text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <GIconPhone size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white">Mobile Phone</div>
                      <div className="text-[11px] text-white/50 truncate font-mono mt-0.5">{PHONE}</div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/15">
                      {copiedPhone ? "Copied!" : "Copy"}
                    </span>
                  </button>

                  {/* LinkedIn Card */}
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#0A66C2]/40 hover:bg-white/[0.06] transition-all text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#0A66C2]/15 border border-[#0A66C2]/30 text-[#70B5F9] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <GIconLinkedin size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white">LinkedIn Profile</div>
                      <div className="text-[11px] text-white/50 truncate font-mono mt-0.5">james-emmanuel-mendoza</div>
                    </div>
                    <GIconExternalLink size={12} className="text-white/40 group-hover:text-white" />
                  </a>

                  {/* GitHub Card */}
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-400/40 hover:bg-white/[0.06] transition-all text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <GIconGithub size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white">GitHub Profile</div>
                      <div className="text-[11px] text-white/50 truncate font-mono mt-0.5">github.com/Ememman</div>
                    </div>
                    <GIconExternalLink size={12} className="text-white/40 group-hover:text-white" />
                  </a>
                </div>

                {/* Inquiry Form */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-white">
                      Send an Inquiry to James
                    </h2>
                    <p className="text-xs text-white/50 mt-0.5">
                      Have a role, software project, or technical consultation? Send a message directly to my inbox.
                    </p>
                  </div>

                  {sentSuccess ? (
                    <div className="text-center py-8 space-y-2.5">
                      <div className="w-12 h-12 aspect-square shrink-0 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xl mx-auto shadow-[0_0_20px_rgba(56,189,248,0.25)]">
                        ✓
                      </div>
                      <h3 className="font-display font-semibold text-sm text-white">Message Dispatched!</h3>
                      <p className="text-xs text-white/60 max-w-sm mx-auto">
                        Thank you for reaching out. James will review your inquiry and get in touch with you at <strong>{contactEmail}</strong>.
                      </p>
                      <button
                        onClick={() => {
                          setSentSuccess(false);
                          setContactMessage("");
                        }}
                        className="mt-3 text-xs text-accent underline cursor-pointer hover:text-white transition"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="space-y-3.5">
                      {contactErrors.length > 0 && (
                        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                          <div className="font-semibold text-rose-200">Please review:</div>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/90">
                            {contactErrors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-white/50 uppercase tracking-wide block font-semibold">Your Name</label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="e.g. Sarah Jenkins"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-white/50 uppercase tracking-wide block font-semibold">Your Email</label>
                          <input
                            type="email"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="sarah@company.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent transition"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-white/50 uppercase tracking-wide block font-semibold">Subject</label>
                        <input
                          type="text"
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                          placeholder="e.g. Full-Stack Role / Contract Work"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-white/50 uppercase tracking-wide block font-semibold">Message</label>
                        <textarea
                          rows={4}
                          required
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Describe your project, timeline, or position details..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent resize-none thin-scroll transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sending}
                        className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/85 disabled:opacity-40 text-white font-medium transition shadow-lg shadow-accent/20 flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-98"
                      >
                        <GIconPaperPlane size={14} />
                        <span>{sending ? "Sending..." : "Submit Inquiry to James"}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer bar */}
      <div className="border-t border-white/10 px-4 py-3 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/50 shrink-0 mb-16 sm:mb-4">
        <span>{FULL_NAME} · Official Curriculum Vitae</span>
        <div className="flex items-center gap-3">
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition flex items-center gap-1"
          >
            <GIconLinkedin size={12} />
            <span>LinkedIn</span>
          </a>
          <span>·</span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition flex items-center gap-1"
          >
            <GIconGithub size={12} />
            <span>@Ememman</span>
          </a>
          <span>·</span>
          <span>{LOCATION}</span>
        </div>
      </div>
    </div>
  );
}
