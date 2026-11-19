/**
 * Portfolio OS Knowledge Engine & Virtual Web Directory
 *
 * Powers Safari (macOS) and Google Chrome (Windows 11) with deep search capabilities
 * for both developer information (James Emmanuel E. Mendoza) and operating system architecture.
 */

export interface SearchResultItem {
  id: string;
  category: "profile" | "experience" | "skills" | "projects" | "system" | "academics";
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  keywords: string[];
  sitelinks?: { title: string; url: string; snippet?: string }[];
  badge?: string;
}

export interface KnowledgePanelData {
  id?: "developer" | "system";
  title: string;
  subtitle: string;
  description: string;
  attributes: { label: string; value: string }[];
  tags: string[];
  links: { label: string; url: string }[];
}

export const DEVELOPER_KNOWLEDGE_PANEL: KnowledgePanelData = {
  id: "developer",
  title: "James Emmanuel E. Mendoza",
  subtitle: "Full-Stack Software Developer & Front-End Specialist",
  description:
    "James Emmanuel E. Mendoza (Emman) is a software engineer based in Manila, Philippines. Specializing in the modern React and Next.js ecosystems, PHP (MVC, Laravel, CodeIgniter), and robust real-time backend microservices. Graduated Magna Cum Laude with a Bachelor of Science in Information Technology from National Teachers College.",
  attributes: [
    { label: "Current Role", value: "Technical Support Engineer at Dowinn Group" },
    { label: "Previous Role", value: "IT Support Specialist & Web Developer at Straive (OJT)" },
    { label: "Education", value: "BS in Information Technology (National Teachers College, 2022–2026)" },
    { label: "Honors", value: "Magna Cum Laude · Best in Research (SALON 2026)" },
    { label: "Location", value: "Tondo, Manila, Philippines" },
    { label: "Phone", value: "0992 543 3570" },
    { label: "Email", value: "mendozajamesemmanuel@gmail.com" },
    { label: "Primary Stack", value: "React 19, Next.js, TypeScript, PHP (Laravel, CodeIgniter), PostgreSQL, MySQL, Tailwind CSS, shadcn/ui" },
  ],
  tags: [
    "Full-Stack",
    "React & Next.js",
    "TypeScript",
    "PHP MVC",
    "Laravel",
    "CodeIgniter",
    "PostgreSQL",
    "MySQL",
    "TanStack Query",
    "Playwright",
    "Magna Cum Laude",
  ],
  links: [
    { label: "GitHub (@Ememman)", url: "https://github.com/Ememman" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/james-emmanuel-mendoza-46b377373/" },
    { label: "View CV (PDF)", url: "mendoza.dev/cv.pdf" },
  ],
};

export const SYSTEM_KNOWLEDGE_PANEL: KnowledgePanelData = {
  id: "system",
  title: "Portfolio OS",
  subtitle: "Interactive Multi-Persona Web Operating System",
  description:
    "Portfolio OS is a client-first, cloud-synchronized virtual operating system engineered by James Emmanuel E. Mendoza. It features authentic macOS Sonoma and Windows 11 desktop interfaces, draggable window manager with snap assist, ambient sound synthesis, real-time Socket.IO multi-room chat, and a persistent virtual cloud filesystem.",
  attributes: [
    { label: "Kernel Version", value: "3.2.0-LTS Virtual Kernel" },
    { label: "Frontend Stack", value: "React 19, TypeScript, Tailwind CSS v4, Framer Motion" },
    { label: "Backend Stack", value: "Express 5, NestJS 12 Parity Engine, Socket.IO v4, SQLite/JSON Store" },
    { label: "Desktop Modes", value: "macOS (Unified Menu Bar & Dock) / Windows 11 (Taskbar & Start)" },
    { label: "Color Profiles", value: "Dynamic 12-Tone Palette with Light, Dark, and Night modes" },
    { label: "Window Capabilities", value: "Freeform resizing, Snap Assist, Min/Max/Restore, Mission Control (F3)" },
    { label: "Global Hotkeys", value: "Cmd/Ctrl+K (Spotlight Search), F3 (Mission Control)" },
  ],
  tags: ["React 19", "TypeScript", "Tailwind v4", "Socket.IO", "Window Manager", "macOS & Win11", "Snap Assist"],
  links: [
    { label: "System Architecture", url: "os://system-info" },
    { label: "Keyboard Shortcuts", url: "os://shortcuts" },
    { label: "Activity Diagnostics", url: "os://diagnostics" },
  ],
};

export const BROWSER_FAVORITES = [
  {
    title: "About Me",
    url: "https://mendoza.dev/about",
    desc: "Biography & Background",
    color: "#38bdf8",
    category: "profile",
  },
  {
    title: "Experience",
    url: "https://mendoza.dev/experience",
    desc: "Dowinn Group & Straive OJT",
    color: "#10b981",
    category: "experience",
  },
  {
    title: "Technical Skills",
    url: "https://mendoza.dev/skills",
    desc: "React, Next.js, PHP, PostgreSQL",
    color: "#8b5cf6",
    category: "skills",
  },
  {
    title: "Projects",
    url: "https://mendoza.dev/projects",
    desc: "Web Apps & Mobile Systems",
    color: "#f59e0b",
    category: "projects",
  },
  {
    title: "System Architecture",
    url: "os://system-info",
    desc: "Portfolio OS Kernel & Specs",
    color: "#06b6d4",
    category: "system",
  },
  {
    title: "Keyboard Shortcuts",
    url: "os://shortcuts",
    desc: "Hotkeys & System Controls",
    color: "#ec4899",
    category: "system",
  },
  {
    title: "Curriculum Vitae",
    url: "mendoza.dev/cv.pdf",
    desc: "Download & View Executive CV",
    color: "#f43f5e",
    category: "profile",
  },
  {
    title: "GitHub Profile",
    url: "https://github.com/Ememman",
    desc: "Open Source Repositories",
    color: "#e2e8f0",
    category: "external",
  },
];

export const SEARCH_INDEX: SearchResultItem[] = [
  // 1. Profile & Bio
  {
    id: "profile-main",
    category: "profile",
    title: "James Emmanuel E. Mendoza — Full-Stack Developer Portfolio",
    url: "https://mendoza.dev",
    displayUrl: "https://mendoza.dev",
    snippet:
      "Official portfolio of James Emmanuel E. Mendoza (Emman). Full-stack web and mobile developer based in Tondo, Manila, Philippines. Magna Cum Laude BSIT graduate from National Teachers College with commercial experience in enterprise software engineering.",
    keywords: [
      "james",
      "emmanuel",
      "mendoza",
      "emman",
      "emanexe",
      "about",
      "bio",
      "profile",
      "who is",
      "contact",
      "email",
      "phone",
      "manila",
      "tondo",
      "developer",
      "software engineer",
    ],
    sitelinks: [
      { title: "Experience", url: "https://mendoza.dev/experience", snippet: "Dowinn Group & Straive OJT milestones" },
      { title: "Skills Matrix", url: "https://mendoza.dev/skills", snippet: "Frontend, Backend, Databases, QA" },
      { title: "Projects", url: "https://mendoza.dev/projects", snippet: "SandreaLee Salon, Straive IMS & Apps" },
      { title: "Curriculum Vitae", url: "mendoza.dev/cv.pdf", snippet: "Executive PDF format resume" },
    ],
    badge: "Official Website",
  },
  {
    id: "profile-contact",
    category: "profile",
    title: "Contact James Emmanuel Mendoza — Email, Phone & Manila HQ",
    url: "https://mendoza.dev/contact",
    displayUrl: "https://mendoza.dev › contact",
    snippet:
      "Get in touch with James Mendoza for full-stack software development, React/Next.js frontend contracting, or enterprise web initiatives. Location: Tondo, Manila. Phone: 0992 543 3570. Email: mendozajamesemmanuel@gmail.com.",
    keywords: ["contact", "email", "phone", "number", "location", "address", "manila", "tondo", "hire", "freelance"],
    badge: "Verified Contact",
  },

  // 2. Work Experience
  {
    id: "exp-dowinn",
    category: "experience",
    title: "Technical Support Engineer at Dowinn Group — Test Automation & Front-End Development",
    url: "https://mendoza.dev/experience#dowinn",
    displayUrl: "https://mendoza.dev › experience › dowinn-group",
    snippet:
      "September 28, 2026 – Present. Served as Technical Support Engineer providing system diagnostics and infrastructure support; automated end-to-end and mobile test suites with Playwright, Appium, and Cypress. By the third week, transitioned to active front-end engineering, developing operational web portals with Next.js, React, TypeScript, and TanStack Query.",
    keywords: [
      "dowinn",
      "dowinn group",
      "technical support engineer",
      "technical support",
      "test automation",
      "qa",
      "playwright",
      "appium",
      "cypress",
      "front-end developer",
      "frontend",
      "experience",
      "tanstack query",
      "react query",
      "shadcn",
      "tailwind",
      "notion",
      "next.js",
      "typescript",
      "automation",
      "testing",
    ],
    badge: "Current Position",
  },
  {
    id: "tech-tanstack-query",
    category: "skills",
    title: "TanStack Query (React Query) — Enterprise Server-State Architecture",
    url: "https://mendoza.dev/skills#tanstack-query",
    displayUrl: "https://tanstack.com › query › v5 › docs",
    snippet:
      "Advanced asynchronous state management, declarative caching, background prefetching, and query invalidation. Utilized by James Mendoza in production client web portals at Dowinn Group for resilient data synchronization.",
    keywords: [
      "tanstack",
      "tan stack",
      "tanstack query",
      "react query",
      "query",
      "tan stack query",
      "tanstack query react docs",
      "cache",
      "server state",
      "devtools",
      "fetching",
    ],
    badge: "Core Stack",
    sitelinks: [
      { title: "Query Devtools & Caching", url: "https://mendoza.dev/skills#tanstack-query" },
      { title: "Dowinn Group Implementation", url: "https://mendoza.dev/experience#dowinn" },
    ],
  },
  {
    id: "exp-straive",
    category: "experience",
    title: "IT Support Specialist & Web Developer at Straive (On the Job Training)",
    url: "https://mendoza.dev/experience#straive",
    displayUrl: "https://mendoza.dev › experience › straive",
    snippet:
      "February 02, 2026 – March 24, 2026. Applied academic knowledge to enterprise IT support: BIOS configuration, BitLocker lockouts, RDP, and Active Directory. Hands-on with 1Kosmos MFA, Sentinel, WorkMate, and Netskope. Architected Straive IMS (Inventory Management System) in PHP (MVC) and MySQL.",
    keywords: [
      "straive",
      "ojt",
      "on the job training",
      "it support",
      "support",
      "bitlocker",
      "rdp",
      "active directory",
      "1kosmos",
      "mfa",
      "biometrics",
      "sentinel",
      "netskope",
      "workmate",
      "straive ims",
      "inventory management system",
      "php",
      "mysql",
      "mvc",
    ],
    badge: "OJT Honors",
  },

  // 3. Technical Skills
  {
    id: "skills-all",
    category: "skills",
    title: "Technical Skills Matrix — Modern Full-Stack & Engineering Stack",
    url: "https://mendoza.dev/skills",
    displayUrl: "https://mendoza.dev › skills",
    snippet:
      "Comprehensive proficiencies: React 19, Next.js, TypeScript, PHP (Laravel, CodeIgniter, MVC), Node.js, Express, NestJS. Relational & NoSQL databases: PostgreSQL, MySQL, MongoDB. Testing & QA: Playwright, Selenium, Appium. Styling: Tailwind CSS v4, shadcn/ui.",
    keywords: [
      "skills",
      "tech stack",
      "technologies",
      "react",
      "next.js",
      "typescript",
      "javascript",
      "php",
      "laravel",
      "codeigniter",
      "postgresql",
      "mysql",
      "mongodb",
      "database",
      "databases",
      "tailwind",
      "shadcn",
      "rest",
      "api",
      "socket.io",
      "playwright",
      "selenium",
    ],
    sitelinks: [
      { title: "PostgreSQL & MySQL", url: "https://mendoza.dev/skills#databases" },
      { title: "Laravel & CodeIgniter", url: "https://mendoza.dev/skills#backend" },
      { title: "React & Next.js", url: "https://mendoza.dev/skills#frontend" },
      { title: "Testing (Playwright)", url: "https://mendoza.dev/skills#qa" },
    ],
  },
  {
    id: "skills-databases",
    category: "skills",
    title: "Database Architectures: PostgreSQL, MySQL, and MongoDB Systems",
    url: "https://mendoza.dev/skills#databases",
    displayUrl: "https://mendoza.dev › skills › databases",
    snippet:
      "Expertise in relational schema design, ACID transactions, complex joins, indexing strategies, and ORMs (Prisma, Drizzle, Eloquent) in PostgreSQL and MySQL, paired with agile NoSQL document pipelines in MongoDB.",
    keywords: ["postgresql", "postgres", "mysql", "mongodb", "sql", "nosql", "database", "schema", "prisma", "eloquent"],
  },
  {
    id: "skills-php-frameworks",
    category: "skills",
    title: "PHP Engineering: Laravel, CodeIgniter, and Custom MVC Architectures",
    url: "https://mendoza.dev/skills#php",
    displayUrl: "https://mendoza.dev › skills › php",
    snippet:
      "Robust backend engineering in PHP utilizing Laravel for enterprise REST APIs and CodeIgniter for ultra-lightweight legacy migrations. Architected custom MVC structures with secure role-based access control (RBAC).",
    keywords: ["php", "laravel", "codeigniter", "mvc", "backend", "routing", "rest api", "eloquent", "blade"],
  },

  // 4. Projects
  {
    id: "proj-sandrealee",
    category: "projects",
    title: "SandreaLee Salon Enterprise Ecosystem — Mobile, Web & Admin Portals",
    url: "https://mendoza.dev/projects#sandrealee",
    displayUrl: "https://mendoza.dev › projects › sandrealee-salon",
    snippet:
      "A complete commercial hair and beauty salon ecosystem consisting of: 1) React Native / Expo mobile app for client booking, 2) High-speed customer portal in React & Tailwind, 3) Real-time analytical admin dashboard with inventory tracking.",
    keywords: ["sandrealee", "salon", "booking", "mobile", "react native", "expo", "admin dashboard", "projects"],
    badge: "Production Client",
  },
  {
    id: "proj-portfolio-os",
    category: "projects",
    title: "Portfolio OS — Dual-Persona Web Desktop Operating System",
    url: "https://mendoza.dev/projects#os",
    displayUrl: "https://mendoza.dev › projects › portfolio-os",
    snippet:
      "Flagship personal operating system environment featuring macOS Sonoma and Windows 11 themes, real-time Socket.IO multi-room chat, retro games arcade, Lo-Fi synthesizer, and virtual cloud file storage.",
    keywords: ["portfolio os", "desktop os", "web os", "system", "operating system", "react 19", "projects", "windows 11", "macos"],
    badge: "Flagship Project",
  },
  {
    id: "proj-straive-ims",
    category: "projects",
    title: "Straive IMS — Enterprise Inventory Management System",
    url: "https://mendoza.dev/projects#straive-ims",
    displayUrl: "https://mendoza.dev › projects › straive-ims",
    snippet:
      "Developed during Straive OJT. An internal asset inventory management web system built in PHP (MVC) and MySQL. Implemented barcode/serial tracking, hierarchical REST routing, and accessible high-contrast reporting.",
    keywords: ["straive ims", "inventory", "management", "php", "mysql", "assets", "hardware", "tracking"],
  },

  // 5. Academics & Honors
  {
    id: "academic-ntc",
    category: "academics",
    title: "National Teachers College — BS in Information Technology (Magna Cum Laude)",
    url: "https://mendoza.dev/academics",
    displayUrl: "https://mendoza.dev › academics",
    snippet:
      "Graduated Magna Cum Laude with a Bachelor of Science in Information Technology (2022–2026). Awarded 'Best in Research' at SALON (May 02, 2026). Lead full-stack architect for departmental capstone initiatives.",
    keywords: [
      "national teachers college",
      "ntc",
      "education",
      "degree",
      "magna cum laude",
      "honors",
      "college",
      "best in research",
      "salon",
      "gpa",
      "academics",
      "bsit",
    ],
    badge: "Magna Cum Laude",
  },
  {
    id: "academic-certs",
    category: "academics",
    title: "Certifications & Achievements — HTML5, Web Development & Research Awards",
    url: "https://mendoza.dev/academics#certs",
    displayUrl: "https://mendoza.dev › academics › certifications",
    snippet:
      "HTML5 Certification (SoloLearn, Nov 01, 2023) • Web Development Certification (SoloLearn, Jan 30, 2025) • Best in Research Award (SALON, May 02, 2026).",
    keywords: ["certifications", "certificates", "sololearn", "html5", "web development", "awards", "research"],
  },

  // 6. Portfolio OS System & Architecture
  {
    id: "sys-info",
    category: "system",
    title: "Portfolio OS System Architecture & Technical Specifications",
    url: "os://system-info",
    displayUrl: "os://system-info",
    snippet:
      "Kernel 3.2.0-LTS. Built with React 19 + TypeScript + Tailwind CSS v4 + Framer Motion. Backend powered by Express 5 and NestJS 12 Parity with bidirectional Socket.IO sync for chat, guestbook, files, and diagnostics.",
    keywords: [
      "system",
      "os",
      "specs",
      "architecture",
      "kernel",
      "version",
      "frontend",
      "backend",
      "react 19",
      "nestjs",
      "express",
      "socket.io",
      "telemetry",
    ],
    sitelinks: [
      { title: "Keyboard Shortcuts", url: "os://shortcuts" },
      { title: "Activity Monitor", url: "os://diagnostics" },
      { title: "Filesystem Specs", url: "os://system-info#fs" },
    ],
    badge: "Kernel 3.2.0-LTS",
  },
  {
    id: "sys-shortcuts",
    category: "system",
    title: "Portfolio OS Keyboard Shortcuts & Global Hotkeys Directory",
    url: "os://shortcuts",
    displayUrl: "os://shortcuts",
    snippet:
      "Spotlight Search: Cmd/Ctrl + K • Mission Control / Window Expose: F3 • Show Desktop: Minimize all windows • Window Snapping: Drag to edges or use snap flyout • Terminal hotkeys: Ctrl+C, Ctrl+L (clear screen).",
    keywords: [
      "shortcuts",
      "keyboard shortcuts",
      "hotkeys",
      "spotlight",
      "mission control",
      "f3",
      "cmd+k",
      "ctrl+k",
      "keybindings",
      "commands",
    ],
  },
  {
    id: "sys-modes",
    category: "system",
    title: "macOS Sonoma and Windows 11 Desktop Modes — Settings & Personalization",
    url: "os://system-info#modes",
    displayUrl: "os://system-info › modes",
    snippet:
      "Switch instantaneously between macOS mode (frosted glass menu bar, animated dock, Mission Control) and Windows 11 mode (taskbar, centered Start menu, Snap Layouts). Supports Light, Dark, and Night modes with 12 calibrated accents.",
    keywords: ["macos", "windows 11", "win11", "desktop mode", "themes", "dark mode", "night mode", "accents", "dock", "taskbar"],
  },
  {
    id: "sys-chat",
    category: "system",
    title: "Real-Time Multi-Room Socket.IO Communication Infrastructure",
    url: "os://system-info#chat",
    displayUrl: "os://system-info › chat-engine",
    snippet:
      "Real-time bidirectional event sync powered by Socket.IO v4. Powers the comic-styled Chats application, live Guestbook ledger, instant cloud file synchronization, and system health broadcasting.",
    keywords: ["socket.io", "chat", "real-time", "guestbook", "sync", "events", "websockets", "network"],
  },
];

export const DEFAULT_EXPLORE_TOPICS: { title: string; query: string; category: string }[] = [
  {
    title: "James Emmanuel E. Mendoza — Biography & Experience",
    query: "James Emmanuel Mendoza",
    category: "profile",
  },
  {
    title: "Technical Support Engineer at Dowinn Group",
    query: "Dowinn Group technical support engineer",
    category: "experience",
  },
  {
    title: "Technical Skills — React 19, Next.js, TypeScript, PHP",
    query: "Technical Skills React Next.js TypeScript PHP",
    category: "skills",
  },
  {
    title: "Portfolio OS — System Architecture & Kernel 3.2.0-LTS",
    query: "Portfolio OS System Architecture",
    category: "system",
  },
  {
    title: "Straive IMS — Inventory Management System",
    query: "Straive IMS inventory management system",
    category: "projects",
  },
  {
    title: "National Teachers College — Magna Cum Laude BSIT",
    query: "National Teachers College Magna Cum Laude",
    category: "academics",
  },
  {
    title: "Keyboard Shortcuts & Global Hotkeys (⌘K, F3)",
    query: "Keyboard Shortcuts Directory",
    category: "system",
  },
  {
    title: "Curriculum Vitae (PDF Download)",
    query: "James Mendoza Resume CV",
    category: "profile",
  },
];

export const AUTOCOMPLETE_KEYWORDS: string[] = [
  // TanStack & React Ecosystem
  "tan stack",
  "tan stack query",
  "tan stack query react docs",
  "tan stack table",
  "tan stack form",
  "react 19",
  "react 19 concurrent features",
  "react native expo mobile app",
  "react loading skeleton",
  "next.js 15 app router",
  "typescript 5 strict types",
  "tailwind css v4",
  "shadcn ui components",

  // James Mendoza & Professional Background
  "james emmanuel mendoza",
  "james emmanuel e. mendoza",
  "james mendoza portfolio",
  "james mendoza resume cv",
  "james mendoza contact manila",
  "james mendoza github ememman",
  "james mendoza linkedin",
  "dowinn group",
  "dowinn group technical support engineer",
  "dowinn group enterprise portals",
  "dowinn group test automation playwright cypress",
  "straive ojt it support specialist",
  "straive ims inventory management system",
  "straive 1kosmos bitlocker active directory",
  "national teachers college",
  "national teachers college bsit",
  "national teachers college magna cum laude",
  "salon 2026 best in research award",

  // Backend, Databases & Testing
  "php mvc framework",
  "php laravel rest api",
  "php codeigniter legacy systems",
  "postgresql relational database",
  "mysql database schemas",
  "mongodb nosql aggregation",
  "socket.io real-time chat sync",
  "playwright automated e2e testing",
  "selenium and appium mobile testing",

  // Projects & Portfolio OS Specs
  "sandrealee salon mobile application",
  "sandrealee salon customer portal",
  "sandrealee salon admin dashboard",
  "portfolio os dual persona",
  "portfolio os kernel 3.2.0-lts",
  "portfolio os window manager snap assist",
  "portfolio os keyboard shortcuts cmd+k",
  "portfolio os dark mode night accents",
  "portfolio os terminal shell commands",
  "portfolio os virtual cloud filesystem",
  "portfolio os sound synthesis web audio",
];
