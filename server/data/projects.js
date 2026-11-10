export const projects = [
  {
    id: "os-portfolio",
    title: "Portfolio OS — Web Desktop Operating System",
    stack: ["React 19", "TypeScript", "Tailwind CSS v4", "Framer Motion", "Node.js", "Socket.IO"],
    category: "Full-Stack",
    year: "2026",
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
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
    year: "2026",
    cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop",
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
    year: "2026",
    cover: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=1200&auto=format&fit=crop",
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
    id: "sandrealee-customer",
    title: "SandreaLee Salon — Customer App",
    stack: ["React Native", "Expo", "Node.js", "Express", "MongoDB"],
    category: "Mobile",
    year: "2025–2026",
    cover: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
    summary:
      "Customer-facing booking app for a salon: multi-step signup with OTP, a guided booking flow (service → stylist → date/time → summary → payment), payment-proof upload with an auto-approval scoring system, and a chronologically sorted appointments screen backed by real API data.",
    highlights: [
      "Multi-step OTP signup + profile image sync across tabs via AsyncStorage",
      "Booking flow with payment status polling and receipt modal",
      "Fixed useFocusEffect dependency bug causing stale profile images",
      "Guest session handling for users who book without an account"
    ],
    links: { repo: "https://github.com/Ememman", live: "" }
  },
  {
    id: "sandrealee-staff",
    title: "SandreaLee Salon — Staff App",
    stack: ["React Native", "Expo", "TypeScript", "Socket.IO"],
    category: "Mobile",
    year: "2025–2026",
    cover: "https://images.unsplash.com/photo-1522336572468-97b06e8ef143?q=80&w=1200&auto=format&fit=crop",
    summary:
      "Staff-side app with GPS attendance, a gamified leaderboard, and training modules. Rebuilt the home screen to match the customer app's navigation language while pulling real-time data from backend endpoints.",
    highlights: [
      "Leaderboard + attendance display wired to live backend data",
      "Debugged rating aggregation (wrong field references, route ordering)",
      "Training modules synced between admin-dashboard saves (Mongo) and mobile reads",
      "Fixed logout-on-submit bug caused by a stale user object in API responses"
    ],
    links: { repo: "https://github.com/Ememman", live: "" }
  },
  {
    id: "sandrealee-admin",
    title: "SandreaLee Salon — Admin Dashboard",
    stack: ["React", "Node.js", "Express", "MongoDB", "Socket.IO"],
    category: "Web",
    year: "2025–2026",
    cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    summary:
      "Dark-themed admin dashboard with full CRUD across employees, appointments, payments, inventory, training, and analytics — with real-time updates over WebSockets.",
    highlights: [
      "Collapsible sidebar, dark theme (#0A0E17), real-time Socket.IO updates",
      "Restructured auth into AuthContext / AuthProvider / useAuth",
      "Fixed StaffPopulateError from a mismatched schema field name",
      "Notification service on Gmail SMTP, replacing an earlier Twilio SMS setup"
    ],
    links: { repo: "https://github.com/Ememman", live: "" }
  },
  {
    id: "straive-ims",
    title: "Straive IMS — Inventory Management System",
    stack: ["PHP", "MVC", "MySQL", "Custom Router"],
    category: "Web",
    year: "2025",
    cover: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
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
    year: "2025",
    cover: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=1200&auto=format&fit=crop",
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
    year: "2024",
    cover: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop",
    summary:
      "Decentralized Ethereum smart contract implementation in Solidity featuring minting, burning, balance mapping, and security requirements.",
    highlights: [
      "Mint and burn functions with balance verification conditionals",
      "Public state variables for token name, abbreviation, and total supply"
    ],
    links: { repo: "https://github.com/Ememman/METACRAFTERS_SOLIDITY_MENDOZA_JAMES_EMANUEL_E._BSIT2.1", live: "" }
  },
  {
    id: "sandrealee-landing",
    title: "SandreaLee Salon — Landing Page",
    stack: ["React", "CSS Animations"],
    category: "Web",
    year: "2025",
    cover: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1200&auto=format&fit=crop",
    summary:
      "The public-facing marketing site: glassmorphism, a purple-indigo palette, scroll reveals, an image carousel, and a mobile app download section.",
    highlights: [
      "Bidirectional scroll-reveal animations",
      "Animated hamburger menu + testimonials carousel",
      "Consistent design system across Services, Products, About, Contact"
    ],
    links: { repo: "https://github.com/Ememman", live: "" }
  }
];
