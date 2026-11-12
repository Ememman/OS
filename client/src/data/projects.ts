export interface ProjectItem {
  id: string;
  title: string;
  stack: string[];
  category: string;
  categories?: string[];
  year: string;
  cover: string;
  summary: string;
  highlights: string[];
  links: {
    repo?: string;
    live?: string;
  };
}

export const fallbackProjects: ProjectItem[] = [
  {
    id: "os-portfolio",
    title: "Portfolio OS — Web Desktop Operating System",
    stack: ["React 19", "TypeScript", "Tailwind CSS v4", "Framer Motion", "Node.js", "Socket.IO"],
    category: "Full-Stack · Web",
    categories: ["Full-Stack", "Web"],
    year: "2026",
    cover: "",
    summary:
      "A production-grade web operating system and interactive developer portfolio. Features draggable multi-instance windows, responsive macOS/Windows docks, real-time live chat with Socket.IO, audio engine with visualizers, interactive retro games, dynamic terminal shell, and live GitHub integration.",
    highlights: [
      "Real-time WebSocket chat with anti-spam, presence, typing indicators, and reactions",
      "Fluid multi-window compositor with maximize, minimize, snap, and z-index ordering",
      "Audio player engine with HTML5 Audio & WebAudio analyzer visualizer",
      "Retro arcade games suite (Block Blast, 2048, Snake, Minesweeper)"
    ],
    links: { repo: "https://github.com/Ememman/OS", live: "https://ememman.github.io/OS/" }
  },
  {
    id: "flash-cards",
    title: "Flash-Cards — Interactive Study Platform",
    stack: ["React.js", "Vite", "Tailwind CSS", "JavaScript"],
    category: "Web",
    categories: ["Web"],
    year: "2026",
    cover: "",
    summary:
      "A responsive, modern flashcard application designed to make studying and memorization interactive and seamless. Features card creation, deck organization, flip animations, and quick review cycles.",
    highlights: [
      "Interactive 3D card flip transitions with smooth CSS transforms",
      "Deck organization and categorization with local persistence",
      "Optimized responsive layout for mobile and desktop study sessions"
    ],
    links: { repo: "https://github.com/Ememman/Flash-Cards", live: "https://ememman.github.io/Flash-Cards/" }
  },
  {
    id: "quiz-app",
    title: "Quiz-App — Timed Knowledge Challenge",
    stack: ["React", "Vite", "Tailwind CSS", "JavaScript"],
    category: "Web",
    categories: ["Web"],
    year: "2026",
    cover: "",
    summary:
      "A sleek, browser-based quiz application featuring instant answer validation, 60-second timed challenges, live score tracking, custom Letter 'Q' brand theme, and lifetime performance statistics.",
    highlights: [
      "60-second countdown timer with high-stakes instant feedback",
      "Real-time score calculation and lifetime statistics tracking",
      "Responsive UI with custom dark & orange neon aesthetic"
    ],
    links: { repo: "https://github.com/Ememman/Quiz-App", live: "https://ememman.github.io/Quiz-App/" }
  },
  {
    id: "sandrealee-mobile",
    title: "SandreaLee Salon — Mobile Application",
    stack: ["React Native", "Expo", "Node.js", "Express", "MongoDB", "Socket.IO"],
    category: "Mobile · Full-Stack",
    categories: ["Mobile", "Full-Stack"],
    year: "2025–2026",
    cover: "",
    summary:
      "Comprehensive enterprise full-stack mobile suite for clients and salon staff. Unifies customer booking workflows (stylist selection, calendar scheduling, real-time OTP verification, and payment-proof upload) with staff shift management, GPS-geofenced attendance, and gamified performance leaderboard.",
    highlights: [
      "Customer booking flow with multi-step OTP signup, service picker, and payment receipt scoring",
      "Staff operations portal with GPS-geofenced attendance & real-time shift checklists",
      "Bidirectional WebSocket updates for instantaneous booking confirmations and live alerts",
      "Cross-platform React Native & Expo architecture with offline AsyncStorage synchronization"
    ],
    links: { repo: "https://github.com/Ememman", live: "" }
  },
  {
    id: "sandrealee-website",
    title: "SandreaLee Salon — Website",
    stack: ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"],
    category: "Web · Full-Stack",
    categories: ["Web", "Full-Stack"],
    year: "2025–2026",
    cover: "",
    summary:
      "Official full-stack marketing website and customer acquisition portal for SandreaLee Salon. Features responsive glassmorphic design, dynamic service catalogs with tiered pricing, online booking inquiries, stylist portfolio showcases, and direct mobile application links.",
    highlights: [
      "Responsive glassmorphism UI with fluid scroll-reveal animations and dark aesthetic",
      "Dynamic service catalog & pricing tiers connected to live MongoDB backend",
      "Interactive testimonials carousel & direct mobile application store links",
      "Full SEO optimization, semantic HTML, and cross-browser responsiveness"
    ],
    links: { repo: "https://github.com/Ememman", live: "" }
  },
  {
    id: "sandrealee-admin",
    title: "SandreaLee Salon — Admin Dashboard",
    stack: ["React", "Node.js", "Express", "MongoDB", "Socket.IO"],
    category: "Dashboard · Full-Stack",
    categories: ["Dashboard", "Full-Stack"],
    year: "2025–2026",
    cover: "",
    summary:
      "Mission-critical full-stack administration portal and business intelligence dashboard. Delivers end-to-end CRUD across salon branches, staff rosters, client appointments, automated payment audit logs, inventory stock alerts, and real-time Socket.IO operational metrics.",
    highlights: [
      "Real-time analytics dashboard with revenue metrics and appointment pipeline",
      "Role-based access control (RBAC) with granular admin & manager permissions",
      "Automated payment-proof scoring system and audit trail verification",
      "WebSocket hub for instant notifications on new bookings and attendance status"
    ],
    links: { repo: "https://github.com/Ememman", live: "" }
  },
  {
    id: "straive-ims",
    title: "Straive IMS — Inventory Management System",
    stack: ["PHP", "MVC", "MySQL", "Custom Router"],
    category: "Web · Full-Stack",
    categories: ["Web", "Full-Stack"],
    year: "2025",
    cover: "",
    summary:
      "A PHP MVC inventory system deployed to live hosting, with environment-based credential switching and a dark, collapsible sidebar UI. Most of the recent work went into tracking down a routing bug on the Deployed Devices module.",
    highlights: [
      "Deployed to InfinityFree with .htaccess routing fixes",
      "Diagnosed a router that only parsed two-segment controller/method paths",
      "Added flat-named controller methods to support nested three-segment routes",
      "Dark sidebar UI: icon-only when collapsed, expands on hover, #FF5000 accent"
    ],
    links: { repo: "https://github.com/Ememman", live: "https://straive-ims.infinityfreeapp.com" }
  },
  {
    id: "terminal-assessment",
    title: "Terminal Assessment — CLI Assessment Suite",
    stack: ["PHP", "CLI", "OOP"],
    category: "CLI / Backend",
    categories: ["CLI / Backend"],
    year: "2025",
    cover: "",
    summary:
      "An automated CLI terminal assessment tool built in PHP, showcasing structured command routing, argument parsing, error handling, and test validation logic.",
    highlights: [
      "CLI command dispatcher with automated argument validation",
      "Modular object-oriented architecture in PHP"
    ],
    links: { repo: "https://github.com/Ememman/TerminalAssesment2", live: "" }
  },
  {
    id: "metacrafters-solidity",
    title: "Solidity Smart Contract Token",
    stack: ["Solidity", "Ethereum", "Smart Contracts", "Web3"],
    category: "Blockchain",
    categories: ["Blockchain"],
    year: "2024",
    cover: "",
    summary:
      "Decentralized Ethereum smart contract implementation in Solidity featuring minting, burning, balance mapping, and security requirements.",
    highlights: [
      "Mint and burn functions with balance verification conditionals",
      "Public state variables for token name, abbreviation, and total supply"
    ],
    links: { repo: "https://github.com/Ememman/METACRAFTERS_SOLIDITY_MENDOZA_JAMES_EMANUEL_E._BSIT2.1", live: "" }
  }
];
