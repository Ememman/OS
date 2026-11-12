import osImg from "../assets/os.png";
import flashCardsImg from "../assets/flash-cards.png";
import quizAppImg from "../assets/quiz-app.png";

export interface GalleryItem {
  id: string;
  type: "image" | "placeholder";
  tag: string;
  src?: string;
  caption: string;
  status?: string;
  statusBadge?: string;
  description?: string;
}

export const galleryItems: GalleryItem[] = [
  {
    id: "g-os",
    type: "image",
    tag: "Portfolio OS",
    src: osImg,
    caption: "Portfolio OS — Real-time Desktop Web Operating System",
    description: "Production web operating system with draggable multi-instance windows, responsive macOS/Windows docks, dynamic terminal shell, real-time live chat with Socket.IO, audio engine with visualizers, and interactive retro arcade games."
  },
  {
    id: "g-flash-cards",
    type: "image",
    tag: "Flash-Cards",
    src: flashCardsImg,
    caption: "Flash-Cards — Interactive Study Platform",
    description: "Modern, responsive flashcard platform built with React, Vite, and Tailwind CSS. Features deck organization, 3D card flips with smooth CSS transforms, and rapid review memorization cycles."
  },
  {
    id: "g-quiz-app",
    type: "image",
    tag: "Quiz-App",
    src: quizAppImg,
    caption: "Quiz-App — Timed Knowledge Challenge",
    description: "Timed browser-based challenge platform featuring instant question validation, 60-second countdown timer, live score tracking, custom Letter 'Q' brand theme, and lifetime performance statistics."
  },
  {
    id: "g-straive",
    type: "placeholder",
    tag: "Straive IMS",
    caption: "Straive IMS — Inventory Management System",
    status: "Currently on Enhancement",
    statusBadge: "Deployment Paused",
    description: "PHP MVC inventory system undergoing internal routing refactors and credential environment switching. Production deployment is temporarily paused during architectural enhancements."
  },
  {
    id: "g-sandrealee",
    type: "placeholder",
    tag: "SandreaLee Salon",
    caption: "SandreaLee Salon — Mobile, Website & Dashboard",
    status: "Currently on Development",
    statusBadge: "Full-Stack Ecosystem",
    description: "Award-winning full-stack ecosystem comprising React Native/Expo client & staff mobile apps, public booking website, and real-time administrative operations portal. Screenshot captures and walkthrough media currently on development."
  },
  {
    id: "g-other",
    type: "placeholder",
    tag: "Other Projects",
    caption: "CLI Assessments & Smart Contract Protocols",
    status: "Currently on Development",
    statusBadge: "Active Architecture",
    description: "Automated CLI terminal assessment suite in PHP and decentralized Ethereum smart contracts in Solidity. Interactive demo recordings and terminal captures currently on development."
  }
];
