export const projects = [
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
      "Staff-side app with GPS attendance, a gamified leaderboard, and training modules. Rebuilt the home screen to match the customer app's navigation language while pulling real-time data from backend endpoints.",
    highlights: [
      "Leaderboard + attendance display wired to live backend data",
      "Debugged rating aggregation (wrong field references, route ordering)",
      "Training modules synced between admin-dashboard saves (Mongo) and mobile reads",
      "Fixed logout-on-submit bug caused by a stale user object in API responses"
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
      "Dark-themed admin dashboard with full CRUD across employees, appointments, payments, inventory, training, and analytics — with real-time updates over WebSockets.",
    highlights: [
      "Collapsible sidebar, dark theme (#0A0E17), real-time Socket.IO updates",
      "Restructured auth into AuthContext / AuthProvider / useAuth",
      "Fixed StaffPopulateError from a mismatched schema field name",
      "Notification service on Gmail SMTP, replacing an earlier Twilio SMS setup"
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
      "A PHP MVC inventory system deployed to live hosting, with environment-based credential switching and a dark, collapsible sidebar UI. Most of the recent work went into tracking down a routing bug on the Deployed Devices module.",
    highlights: [
      "Deployed to InfinityFree with .htaccess routing fixes",
      "Diagnosed a router that only parsed two-segment controller/method paths",
      "Added flat-named controller methods to support nested three-segment routes",
      "Dark sidebar UI: icon-only when collapsed, expands on hover, #FF5000 accent"
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
      "The public-facing marketing site: glassmorphism, a purple-indigo palette, scroll reveals, an image carousel, and a mobile app download section.",
    highlights: [
      "Bidirectional scroll-reveal animations",
      "Animated hamburger menu + testimonials carousel",
      "Consistent design system across Services, Products, About, Contact"
    ],
    links: { repo: "", live: "" }
  }
];
