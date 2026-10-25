export const fallbackProjects = [
  {
    id: "sandrealee-customer",
    title: "SandreaLee Salon — Customer App",
    stack: ["React Native", "Expo", "Node.js", "Express", "MongoDB"],
    category: "Mobile",
    year: "2025–2026",
    cover: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
    summary:
      "Customer-facing booking app for a salon: multi-step signup with OTP, a guided booking flow, payment-proof upload with auto-approval scoring, and a chronologically sorted appointments screen backed by real API data.",
    highlights: [
      "Multi-step OTP signup + profile image sync via AsyncStorage",
      "Booking flow with payment status polling and receipt modal",
      "Fixed useFocusEffect dependency bug causing stale profile images",
      "Guest session handling for bookings without an account"
    ],
    links: { repo: "", live: "" }
  },
  {
    id: "sandrealee-staff",
    title: "SandreaLee Salon — Staff App",
    stack: ["React Native", "Expo", "TypeScript", "Socket.IO"],
    category: "Mobile",
    year: "2025–2026",
    cover: "https://images.unsplash.com/photo-1522336572468-97b06e8ef143?q=80&w=1200&auto=format&fit=crop",
    summary:
      "Staff-side app with GPS attendance, a gamified leaderboard, and training modules, rebuilt to match the customer app's navigation language.",
    highlights: [
      "Leaderboard + attendance wired to live backend data",
      "Debugged rating aggregation referencing wrong fields",
      "Training modules synced between admin dashboard and mobile reads",
      "Fixed logout-on-submit bug from a stale user object"
    ],
    links: { repo: "", live: "" }
  },
  {
    id: "sandrealee-admin",
    title: "SandreaLee Salon — Admin Dashboard",
    stack: ["React", "Node.js", "Express", "MongoDB", "Socket.IO"],
    category: "Web",
    year: "2025–2026",
    cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    summary:
      "Dark-themed admin dashboard with full CRUD across employees, appointments, payments, inventory, training, and analytics, with real-time updates over WebSockets.",
    highlights: [
      "Collapsible sidebar, dark theme, real-time Socket.IO updates",
      "Restructured auth into AuthContext / AuthProvider / useAuth",
      "Fixed StaffPopulateError from a mismatched schema field",
      "Notification service on Gmail SMTP"
    ],
    links: { repo: "", live: "" }
  },
  {
    id: "straive-ims",
    title: "Straive IMS — Inventory Management System",
    stack: ["PHP", "MVC", "MySQL", "Custom Router"],
    category: "Web",
    year: "2025",
    cover: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
    summary:
      "A PHP MVC inventory system deployed to live hosting, with environment-based credential switching and a dark, collapsible sidebar UI.",
    highlights: [
      "Deployed to InfinityFree with .htaccess routing fixes",
      "Diagnosed a router limited to two-segment controller/method paths",
      "Added flat-named controller methods for nested three-segment routes",
      "Dark sidebar UI with #FF5000 active accent"
    ],
    links: { repo: "", live: "https://straive-ims.infinityfreeapp.com" }
  },
  {
    id: "sandrealee-landing",
    title: "SandreaLee Salon — Landing Page",
    stack: ["React", "CSS Animations"],
    category: "Web",
    year: "2025",
    cover: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1200&auto=format&fit=crop",
    summary:
      "The public marketing site: glassmorphism, a purple-indigo palette, scroll reveals, and a mobile app download section.",
    highlights: [
      "Bidirectional scroll-reveal animations",
      "Animated hamburger menu + testimonials carousel",
      "Consistent design system across all sections"
    ],
    links: { repo: "", live: "" }
  }
];
