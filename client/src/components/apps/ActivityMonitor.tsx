import { useState, useEffect, useRef, useMemo } from "react";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import { API_URL } from "../../lib/config";
import { getSocket } from "../../lib/socket";
import { ActivityMonitorSkeleton } from "../common/Skeletons";
import {
  GIconActivity,
  GIconSignal,
  GIconRotateRight,
  GIconTrash,
  GIconSearch,
  GIconThunderbolt,
  GIconCircleInfo,
  GIconGlobe,
  GIconHardDrive,
  GIconCpu,
  GIconFileText,
  GIconCopy,
  GIconCheck,
  GIconClose,
  GIconLock,
  GIconLink,
  GIconPlay,
} from "../icons/GravityIcons";

export interface PackageInfo {
  name: string;
  pkgName: string;
  version: string;
  category: string;
  role: string;
  env: "Client" | "Server" | "Fullstack";
  type: "Production" | "DevTooling";
  color: string;
  url: string;
}

// Complete registry of all 32 active packages & dependencies used in this system
// Derived strictly from client/package.json and server/package.json
const RUNTIME_PACKAGES: PackageInfo[] = [
  // Client Ecosystem (client/package.json)
  {
    name: "React 19",
    pkgName: "react",
    version: "19.2.7",
    category: "UI Framework",
    role: "Concurrent UI rendering, server actions, transitions & state reconciliation",
    env: "Client",
    type: "Production",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    url: "https://www.npmjs.com/package/react",
  },
  {
    name: "React DOM",
    pkgName: "react-dom",
    version: "19.2.7",
    category: "DOM Renderer",
    role: "DOM renderer & portal hierarchy management for floating window compositors",
    env: "Client",
    type: "Production",
    color: "text-cyan-300 bg-cyan-500/10 border-cyan-500/25",
    url: "https://www.npmjs.com/package/react-dom",
  },
  {
    name: "Next.js 15",
    pkgName: "next",
    version: "15.1.0",
    category: "Hybrid Framework",
    role: "React full-stack architecture, route handlers & server-side rendering pipeline",
    env: "Client",
    type: "Production",
    color: "text-white bg-white/10 border-white/20",
    url: "https://www.npmjs.com/package/next",
  },
  {
    name: "Tailwind CSS v4",
    pkgName: "tailwindcss",
    version: "4.3.2",
    category: "Styling Engine",
    role: "High-performance CSS Oxide engine, mobile glassmorphism & responsive layouts",
    env: "Client",
    type: "Production",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/25",
    url: "https://www.npmjs.com/package/tailwindcss",
  },
  {
    name: "Tailwind PostCSS",
    pkgName: "@tailwindcss/postcss",
    version: "4.3.2",
    category: "Build Tooling",
    role: "PostCSS integration pipeline for Tailwind v4 CSS compilation",
    env: "Client",
    type: "DevTooling",
    color: "text-sky-300 bg-sky-500/10 border-sky-500/25",
    url: "https://www.npmjs.com/package/@tailwindcss/postcss",
  },
  {
    name: "Framer Motion",
    pkgName: "framer-motion",
    version: "14.10.1",
    category: "Motion Engine",
    role: "Physics spring animations, drag-to-combine folders & window snap physics",
    env: "Client",
    type: "Production",
    color: "text-pink-400 bg-pink-500/10 border-pink-500/25",
    url: "https://www.npmjs.com/package/framer-motion",
  },
  {
    name: "Zustand",
    pkgName: "zustand",
    version: "5.0.14",
    category: "State Management",
    role: "Atomic OS window compositor, dock positioning, sound settings & reactive state",
    env: "Client",
    type: "Production",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
    url: "https://www.npmjs.com/package/zustand",
  },
  {
    name: "Gravity UI Icons",
    pkgName: "@gravity-ui/icons",
    version: "2.23.0",
    category: "Iconography System",
    role: "Enterprise vector iconography across desktop taskbars, docks, and mobile apps",
    env: "Client",
    type: "Production",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    url: "https://www.npmjs.com/package/@gravity-ui/icons",
  },
  {
    name: "Socket.IO Client",
    pkgName: "socket.io-client",
    version: "4.8.3",
    category: "Real-Time Protocol",
    role: "Full-duplex WebSocket connection for live chats, online visitors & guestbook",
    env: "Client",
    type: "Production",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    url: "https://www.npmjs.com/package/socket.io-client",
  },
  {
    name: "DiceBear Core",
    pkgName: "@dicebear/core",
    version: "10.7.0",
    category: "Procedural Identity",
    role: "Algorithmic SVG avatar generator creating unique visual personas for visitors",
    env: "Fullstack",
    type: "Production",
    color: "text-teal-400 bg-teal-500/10 border-teal-500/25",
    url: "https://www.npmjs.com/package/@dicebear/core",
  },
  {
    name: "DiceBear Styles",
    pkgName: "@dicebear/styles",
    version: "10.6.0",
    category: "Procedural Identity",
    role: "Procedural avatar styling presets (bottts, lorelei, adventurer) for users",
    env: "Fullstack",
    type: "Production",
    color: "text-teal-300 bg-teal-500/10 border-teal-500/25",
    url: "https://www.npmjs.com/package/@dicebear/styles",
  },
  {
    name: "Vite 8",
    pkgName: "vite",
    version: "8.1.1",
    category: "Bundler & Tooling",
    role: "Sub-second Hot Module Replacement (HMR) and optimized Rollup code splitting",
    env: "Client",
    type: "DevTooling",
    color: "text-violet-400 bg-violet-500/10 border-violet-500/25",
    url: "https://www.npmjs.com/package/vite",
  },
  {
    name: "Vite React Plugin",
    pkgName: "@vitejs/plugin-react",
    version: "6.0.3",
    category: "Bundler & Tooling",
    role: "Fast React Refresh and JSX transform plugin for Vite development server",
    env: "Client",
    type: "DevTooling",
    color: "text-violet-300 bg-violet-500/10 border-violet-500/25",
    url: "https://www.npmjs.com/package/@vitejs/plugin-react",
  },
  {
    name: "TypeScript",
    pkgName: "typescript",
    version: "7.0.2",
    category: "Type System",
    role: "Strict static typing, interfaces, and compile-time contract safety across the OS",
    env: "Fullstack",
    type: "DevTooling",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    url: "https://www.npmjs.com/package/typescript",
  },
  {
    name: "Oxlint",
    pkgName: "oxlint",
    version: "1.71.0",
    category: "Linter & Static Analysis",
    role: "High-speed Rust-powered JavaScript/TypeScript linter enforcing code quality",
    env: "Client",
    type: "DevTooling",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/25",
    url: "https://www.npmjs.com/package/oxlint",
  },
  {
    name: "PostCSS",
    pkgName: "postcss",
    version: "8.5.16",
    category: "CSS Tooling",
    role: "Automated CSS transformation toolchain and plugin processor",
    env: "Client",
    type: "DevTooling",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    url: "https://www.npmjs.com/package/postcss",
  },
  {
    name: "Autoprefixer",
    pkgName: "autoprefixer",
    version: "10.5.2",
    category: "CSS Tooling",
    role: "Vendor prefix automation ensuring broad mobile & desktop browser compliance",
    env: "Client",
    type: "DevTooling",
    color: "text-amber-300 bg-amber-500/10 border-amber-500/25",
    url: "https://www.npmjs.com/package/autoprefixer",
  },

  // Server Ecosystem (server/package.json)
  {
    name: "Express.js 5",
    pkgName: "express",
    version: "5.2.1",
    category: "Backend REST Gateway",
    role: "Core HTTP application framework handling REST routing, middleware & uploads",
    env: "Server",
    type: "Production",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    url: "https://www.npmjs.com/package/express",
  },
  {
    name: "Socket.IO Server",
    pkgName: "socket.io",
    version: "4.8.3",
    category: "Real-Time Engine",
    role: "Bidirectional WebSocket hub powering live visitors, chatrooms & telemetry",
    env: "Server",
    type: "Production",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    url: "https://www.npmjs.com/package/socket.io",
  },
  {
    name: "NestJS Core",
    pkgName: "@nestjs/core",
    version: "12.2.0",
    category: "Modular Architecture",
    role: "Enterprise modular controller pipeline with dependency injection & services",
    env: "Server",
    type: "Production",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/25",
    url: "https://www.npmjs.com/package/@nestjs/core",
  },
  {
    name: "NestJS Common",
    pkgName: "@nestjs/common",
    version: "12.2.0",
    category: "Modular Architecture",
    role: "Common decorators, pipes, guards, and dependency injection utilities",
    env: "Server",
    type: "Production",
    color: "text-rose-300 bg-rose-500/10 border-rose-500/25",
    url: "https://www.npmjs.com/package/@nestjs/common",
  },
  {
    name: "NestJS Express Platform",
    pkgName: "@nestjs/platform-express",
    version: "12.2.0",
    category: "Backend REST Gateway",
    role: "Express HTTP engine adapter bridging NestJS controllers to HTTP runtime",
    env: "Server",
    type: "Production",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/25",
    url: "https://www.npmjs.com/package/@nestjs/platform-express",
  },
  {
    name: "NestJS WebSockets",
    pkgName: "@nestjs/websockets",
    version: "12.2.0",
    category: "Real-Time Gateway",
    role: "Dedicated WebSocket gateway handling multi-client broadcasting & event rooms",
    env: "Server",
    type: "Production",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    url: "https://www.npmjs.com/package/@nestjs/websockets",
  },
  {
    name: "NestJS Socket.IO Adapter",
    pkgName: "@nestjs/platform-socket.io",
    version: "12.2.0",
    category: "Real-Time Gateway",
    role: "Socket.IO transport adapter for NestJS WebSocket gateways and emitters",
    env: "Server",
    type: "Production",
    color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
    url: "https://www.npmjs.com/package/@nestjs/platform-socket.io",
  },
  {
    name: "Mongoose 9",
    pkgName: "mongoose",
    version: "9.12.1",
    category: "Database ODM",
    role: "MongoDB Atlas cluster Object Data Modeling for chat, guestbook & scores",
    env: "Server",
    type: "Production",
    color: "text-green-400 bg-green-500/10 border-green-500/25",
    url: "https://www.npmjs.com/package/mongoose",
  },
  {
    name: "CORS",
    pkgName: "cors",
    version: "2.8.6",
    category: "Security Middleware",
    role: "Cross-Origin Resource Sharing control for GitHub Pages to Render API access",
    env: "Server",
    type: "Production",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
    url: "https://www.npmjs.com/package/cors",
  },
  {
    name: "Dotenv",
    pkgName: "dotenv",
    version: "17.4.2",
    category: "Configuration",
    role: "Loads environment variables (MongoDB URI, Port, Auth secrets) into process.env",
    env: "Server",
    type: "Production",
    color: "text-lime-400 bg-lime-500/10 border-lime-500/25",
    url: "https://www.npmjs.com/package/dotenv",
  },
  {
    name: "Nanoid",
    pkgName: "nanoid",
    version: "4.0.2",
    category: "Unique ID Generator",
    role: "Cryptographically strong compact unique ID generation for notes & chat messages",
    env: "Server",
    type: "Production",
    color: "text-teal-400 bg-teal-500/10 border-teal-500/25",
    url: "https://www.npmjs.com/package/nanoid",
  },
  {
    name: "RxJS 7",
    pkgName: "rxjs",
    version: "7.8.2",
    category: "Reactive Streams",
    role: "Observable asynchronous streams handling event queues and transformation",
    env: "Server",
    type: "Production",
    color: "text-pink-400 bg-pink-500/10 border-pink-500/25",
    url: "https://www.npmjs.com/package/rxjs",
  },
  {
    name: "Reflect Metadata",
    pkgName: "reflect-metadata",
    version: "0.2.2",
    category: "Reflection Polyfill",
    role: "Metadata reflection API polyfill enabling TypeScript decorators for NestJS",
    env: "Server",
    type: "Production",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
    url: "https://www.npmjs.com/package/reflect-metadata",
  },
  {
    name: "TSX",
    pkgName: "tsx",
    version: "4.23.15",
    category: "Runtime Execution",
    role: "Zero-config TypeScript execution and hot-reload watcher for modern Node.js",
    env: "Server",
    type: "DevTooling",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    url: "https://www.npmjs.com/package/tsx",
  },
  {
    name: "TS-Node",
    pkgName: "ts-node",
    version: "10.9.2",
    category: "Runtime Execution",
    role: "TypeScript execution engine and REPL for Node.js backend services",
    env: "Server",
    type: "DevTooling",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    url: "https://www.npmjs.com/package/ts-node",
  },
];

export interface ApiEndpointInfo {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  category: "System" | "Portfolio" | "Social" | "Productivity" | "Storage" | "Sandbox" | "Realtime" | "Arcade" | "Utility" | "Media";
  description: string;
  security: "Public Safe (Live)" | "Sandbox Simulated" | "Protected System" | "Rate Limited";
  params?: string;
  samplePayload?: Record<string, any>;
  sampleResponse: Record<string, any>;
}

// Complete registry of REST hypermedia endpoints covering GET, POST, PUT, PATCH, and DELETE
const DEFAULT_ENDPOINTS: ApiEndpointInfo[] = [
  // 1. System & Kernel Endpoints
  {
    path: "/api/health",
    method: "GET",
    category: "System",
    description: "Check system health, host uptime, and connected WebSocket client tally",
    security: "Public Safe (Live)",
    sampleResponse: {
      status: "healthy",
      uptimeSeconds: 84210,
      connectedClients: 3,
      kernelVersion: "v2.4.0-release",
      memoryUsageMb: 42.8
    }
  },
  {
    path: "/api/system/info",
    method: "GET",
    category: "System",
    description: "Retrieve system information, CPU model, architecture, and memory specs",
    security: "Public Safe (Live)",
    sampleResponse: {
      platform: "linux",
      arch: "x64",
      cpus: 8,
      model: "AMD EPYC 7B12",
      totalMemoryGb: 16,
      freeMemoryGb: 9.4
    }
  },
  {
    path: "/api/system/metrics",
    method: "GET",
    category: "System",
    description: "Retrieve live CPU, RAM, and event-loop telemetry time-series history",
    security: "Public Safe (Live)",
    sampleResponse: {
      timestamp: Date.now(),
      cpuPercent: 18.4,
      memoryMb: 48.2,
      heapUsedPercent: 32.1
    }
  },
  {
    path: "/api/system/network",
    method: "GET",
    category: "System",
    description: "Retrieve virtual network interfaces, throughput, and ping telemetry",
    security: "Public Safe (Live)",
    sampleResponse: {
      activeInterface: "eth0",
      ip: "10.0.4.15",
      rxKbps: 14.8,
      txKbps: 9.2,
      status: "connected"
    }
  },
  {
    path: "/api/system/processes",
    method: "GET",
    category: "System",
    description: "Retrieve active background daemons with real-time thread telemetry",
    security: "Public Safe (Live)",
    sampleResponse: {
      totalProcesses: 6,
      running: 6,
      stopped: 0,
      daemons: [
        { pid: 101, name: "kernel.sys", status: "running", cpu: 1.5, memoryMb: 24.7 },
        { pid: 104, name: "window-server", status: "running", cpu: 3.2, memoryMb: 48.0 }
      ]
    }
  },
  {
    path: "/api/system/process/:pid/restart",
    method: "POST",
    category: "System",
    description: "Restart a system process (Simulated in sandbox: status transitions Running -> Restarting -> Running)",
    security: "Protected System",
    params: "pid: number (Process Identifier)",
    samplePayload: { pid: 101, reason: "Memory compaction routine" },
    sampleResponse: {
      ok: true,
      pid: 101,
      name: "kernel.sys",
      status: "running",
      restartedAt: new Date().toISOString(),
      message: "Sandbox Simulation: Process restarted successfully with clean heap memory."
    }
  },
  {
    path: "/api/system/process/:pid",
    method: "PATCH",
    category: "System",
    description: "Modify process scheduling priority (nice levels) and allocated CPU threads",
    security: "Sandbox Simulated",
    params: "pid: number",
    samplePayload: { nice: -5, maxThreads: 4 },
    sampleResponse: {
      ok: true,
      pid: 101,
      nice: -5,
      maxThreads: 4,
      status: "updated_in_sandbox"
    }
  },
  {
    path: "/api/system/config",
    method: "PUT",
    category: "System",
    description: "Update system compositor and audio preferences with complete configuration payload",
    security: "Sandbox Simulated",
    samplePayload: {
      soundEffects: true,
      wallpaperBlur: true,
      dockPosition: "bottom",
      osMode: "win"
    },
    sampleResponse: {
      ok: true,
      updatedAt: new Date().toISOString(),
      config: { soundEffects: true, wallpaperBlur: true, dockPosition: "bottom" },
      simulated: true
    }
  },
  {
    path: "/api/system/benchmark",
    method: "POST",
    category: "System",
    description: "Execute a system benchmark computing primes and measuring JSON serialization throughput",
    security: "Public Safe (Live)",
    samplePayload: { iterations: 25000, stressLevel: "normal" },
    sampleResponse: {
      durationMs: 38.4,
      primesCalculated: 2762,
      opsPerSec: 651041,
      rating: "A+ (Ultra Fast)",
      timestamp: new Date().toISOString()
    }
  },
  {
    path: "/api/system/logs",
    method: "GET",
    category: "System",
    description: "Retrieve kernel and service event logs with level & module filtering",
    security: "Public Safe (Live)",
    sampleResponse: {
      totalLogs: 124,
      recent: [
        { ts: Date.now(), level: "info", module: "compositor", message: "DOM surface composited at 60 FPS" },
        { ts: Date.now() - 4000, level: "info", module: "socket", message: "WebSocket client handshake accepted" }
      ]
    }
  },
  {
    path: "/api/system/storage",
    method: "GET",
    category: "System",
    description: "Retrieve virtual partition storage allocations and usage telemetry",
    security: "Public Safe (Live)",
    sampleResponse: {
      totalGb: 64,
      usedGb: 18.4,
      freeGb: 45.6,
      percentUsed: 28.75
    }
  },
  {
    path: "/api/system/ping",
    method: "GET",
    category: "System",
    description: "Low-overhead roundtrip ping test endpoint for measuring network latency",
    security: "Public Safe (Live)",
    sampleResponse: { pong: true, time: Date.now() }
  },

  // 2. Portfolio & Showcase Endpoints
  {
    path: "/api/projects",
    method: "GET",
    category: "Portfolio",
    description: "Retrieve portfolio projects with tech stacks, repository metadata, and live URLs",
    security: "Public Safe (Live)",
    sampleResponse: [
      { id: "os", title: "Portfolio OS", category: "Full-Stack System", stars: 124 },
      { id: "stariive", title: "Stariive IMS", category: "Full-Stack Ecosystem", stars: 68 }
    ]
  },
  {
    path: "/api/projects/:id/like",
    method: "POST",
    category: "Portfolio",
    description: "Star or upvote a portfolio project with real-time WebSocket broadcast",
    security: "Public Safe (Live)",
    params: "id: string (Project ID)",
    samplePayload: { projectId: "os", reaction: "star" },
    sampleResponse: { ok: true, projectId: "os", likes: 125, broadcasted: true }
  },
  {
    path: "/api/projects/:id/visibility",
    method: "PATCH",
    category: "Portfolio",
    description: "Update project featured visibility priority on portfolio showcase",
    security: "Sandbox Simulated",
    params: "id: string",
    samplePayload: { featured: true, showcasePriority: 1 },
    sampleResponse: { ok: true, id: "os", featured: true, showcasePriority: 1, simulated: true }
  },
  {
    path: "/api/updates",
    method: "GET",
    category: "Portfolio",
    description: "Retrieve live Pull Requests changelog from GitHub with priority & category tags",
    security: "Public Safe (Live)",
    sampleResponse: {
      total: 30,
      merged: 30,
      open: 0,
      latestPR: "#160: Enhance Activity Monitor with API Inspector & Dependency Explorer"
    }
  },
  {
    path: "/api/updates/:id/react",
    method: "POST",
    category: "Portfolio",
    description: "React to a changelog feature update with real-time emoji counters",
    security: "Public Safe (Live)",
    params: "id: string (Update/PR number)",
    samplePayload: { emoji: "🚀", prNumber: 160 },
    sampleResponse: { ok: true, prNumber: 160, emoji: "🚀", totalReactions: 14 }
  },

  // 3. Notes & Productivity Endpoints
  {
    path: "/api/notes",
    method: "GET",
    category: "Productivity",
    description: "Retrieve markdown notes repository with folder hierarchies and timestamps",
    security: "Public Safe (Live)",
    sampleResponse: [
      { id: "note_1", title: "Welcome to Portfolio OS", tags: ["guide"], pinned: true },
      { id: "note_2", title: "System Architecture", tags: ["tech"], pinned: false }
    ]
  },
  {
    path: "/api/notes",
    method: "POST",
    category: "Productivity",
    description: "Create a new markdown note in cloud repository (Simulated in sandbox)",
    security: "Sandbox Simulated",
    samplePayload: {
      title: "New Architectural Note",
      content: "# Notes\n- Testing CRUD sandbox execution\n- Reactive state update",
      folder: "General",
      tags: ["dev", "sandbox"]
    },
    sampleResponse: {
      ok: true,
      id: "note_demo_782",
      title: "New Architectural Note",
      createdAt: new Date().toISOString(),
      simulated: true,
      message: "Note successfully created in sandbox storage."
    }
  },
  {
    path: "/api/notes/:id",
    method: "PUT",
    category: "Productivity",
    description: "Full update of an existing markdown note's content, title, tags, and folder",
    security: "Sandbox Simulated",
    params: "id: string (Note ID)",
    samplePayload: {
      title: "Updated Architectural Decisions",
      content: "# ADR\n- Using zustand for OS compositor\n- Realtime Socket.IO gateway",
      tags: ["architecture", "updated"]
    },
    sampleResponse: {
      ok: true,
      id: "note_demo_782",
      updatedAt: new Date().toISOString(),
      simulated: true,
      message: "Sandbox Simulation: Note updated with new payload."
    }
  },
  {
    path: "/api/notes/:id/pin",
    method: "PATCH",
    category: "Productivity",
    description: "Toggle pinned status of a markdown note",
    security: "Sandbox Simulated",
    params: "id: string",
    samplePayload: { pinned: true },
    sampleResponse: { ok: true, id: "note_demo_782", pinned: true, simulated: true }
  },
  {
    path: "/api/notes/:id",
    method: "DELETE",
    category: "Productivity",
    description: "Delete a note from repository (Simulated in sandbox)",
    security: "Sandbox Simulated",
    params: "id: string",
    sampleResponse: {
      ok: true,
      deletedId: "note_demo_782",
      simulated: true,
      message: "Sandbox Simulation: Note deleted from demo cache."
    }
  },

  // 4. Guestbook & Social Endpoints
  {
    path: "/api/guestbook",
    method: "GET",
    category: "Social",
    description: "Retrieve visitor ledger signatures, avatars, messages, and live reactions",
    security: "Public Safe (Live)",
    sampleResponse: [
      { id: "gb_1", author: "James", message: "Welcome to my OS portfolio!", avatar: "bottts" }
    ]
  },
  {
    path: "/api/guestbook",
    method: "POST",
    category: "Social",
    description: "Submit a new signature, avatar, and message to the public visitor ledger",
    security: "Rate Limited",
    samplePayload: {
      name: "Visitor",
      message: "Impressive portfolio OS architecture!",
      avatarSeed: "explorer_42"
    },
    sampleResponse: {
      ok: true,
      id: "gb_994",
      createdAt: new Date().toISOString(),
      author: "Visitor"
    }
  },
  {
    path: "/api/guestbook/:id",
    method: "DELETE",
    category: "Social",
    description: "Delete a signature entry from the guestbook (Simulated in sandbox)",
    security: "Sandbox Simulated",
    params: "id: string",
    sampleResponse: {
      ok: true,
      deletedId: "gb_994",
      simulated: true,
      message: "Sandbox Simulation: Signature soft-deleted in demo environment."
    }
  },

  // 5. Files & Storage Endpoints
  {
    path: "/api/files",
    method: "GET",
    category: "Storage",
    description: "Retrieve virtual file system tree, directories, and file metadata",
    security: "Public Safe (Live)",
    sampleResponse: [
      { id: "f_1", name: "resume.pdf", size: 142800, type: "pdf" },
      { id: "f_2", name: "projects.json", size: 4820, type: "json" }
    ]
  },
  {
    path: "/api/files/:id",
    method: "PUT",
    category: "Storage",
    description: "Update file metadata, rename, or write new content payload (Simulated in sandbox)",
    security: "Sandbox Simulated",
    params: "id: string",
    samplePayload: { name: "config.json", content: "{\n  \"theme\": \"glass\"\n}" },
    sampleResponse: {
      ok: true,
      id: "f_config",
      name: "config.json",
      sizeBytes: 32,
      simulated: true
    }
  },
  {
    path: "/api/files/:id",
    method: "DELETE",
    category: "Storage",
    description: "Delete file from virtual cloud drive (Simulated in sandbox)",
    security: "Sandbox Simulated",
    params: "id: string",
    sampleResponse: {
      ok: true,
      deletedId: "f_config",
      simulated: true,
      message: "Sandbox Simulation: File removed from virtual disk cache."
    }
  },

  // 6. Realtime, Chat & Utilities
  {
    path: "/api/chat/users",
    method: "GET",
    category: "Realtime",
    description: "Retrieve current online visitors in the realtime chatroom",
    security: "Public Safe (Live)",
    sampleResponse: { onlineCount: 4, visitors: ["Guest-819", "Explorer-240", "Dev-912"] }
  },
  {
    path: "/api/snippets/run",
    method: "POST",
    category: "Sandbox",
    description: "AST parsing and execution validator for CodePlay sandbox playground",
    security: "Public Safe (Live)",
    samplePayload: { code: "console.log(2 + 2);", language: "javascript" },
    sampleResponse: { ok: true, output: "4\n", executionTimeMs: 4.2 }
  },
  {
    path: "/api/calc/constants",
    method: "GET",
    category: "Utility",
    description: "Retrieve mathematical, physical, and scientific constants dictionary",
    security: "Public Safe (Live)",
    sampleResponse: { pi: 3.1415926535, e: 2.7182818284, speedOfLightMs: 299792458 }
  }
];

export interface OsProcess {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  memoryMb: number;
  threads: number;
  status: "running" | "idle" | "restarting" | "stopped" | string;
  description?: string;
}

const DEFAULT_DAEMONS: OsProcess[] = [
  { pid: 101, name: "kernel.sys", user: "system", cpu: 1.5, memoryMb: 24.7, threads: 4, status: "running", description: "Portfolio OS Kernel & Task Scheduler" },
  { pid: 104, name: "window-server", user: "system", cpu: 3.2, memoryMb: 48.0, threads: 6, status: "running", description: "Glass Compositor & Display Manager" },
  { pid: 210, name: "socket-daemon", user: "system", cpu: 0.8, memoryMb: 16.2, threads: 2, status: "running", description: "Realtime WebSocket Hub & Event Broadcaster" },
  { pid: 312, name: "audio-synth", user: "system", cpu: 0.4, memoryMb: 12.8, threads: 2, status: "running", description: "WebAudio Procedural Synthesizer Engine" },
  { pid: 405, name: "vfs-manager", user: "system", cpu: 0.2, memoryMb: 14.5, threads: 2, status: "running", description: "Virtual File System & Cloud Cache" },
  { pid: 512, name: "telemetry-poller", user: "system", cpu: 0.6, memoryMb: 18.1, threads: 2, status: "running", description: "System Activity & Hardware Telemetry Poller" },
];

export interface SystemLogItem {
  id: string;
  ts: number;
  level: "info" | "warn" | "error" | "debug" | string;
  module: string;
  message: string;
}

export interface StorageBreakdown {
  totalGb: number;
  usedGb: number;
  freeGb: number;
  percentUsed: number;
  partitions: {
    name: string;
    sizeGb: number;
    color: string;
    desc: string;
  }[];
}

export interface NetworkTelemetry {
  interfaces: {
    name: string;
    address: string;
    family: string;
    mac: string;
    internal: boolean;
  }[];
  primaryInterface: {
    name: string;
    address: string;
    family: string;
    mac: string;
  } | null;
  traffic: {
    rxKbps: number;
    txKbps: number;
    totalRxMb: number;
    totalTxMb: number;
    activeConnections: number;
    httpPort: number;
    protocol: string;
    latencyMs: number;
  };
}

interface SystemInfoData {
  os?: {
    platform: string;
    arch: string;
    release: string;
    hostname: string;
    uptime: number;
  };
  node?: {
    version: string;
    pid: number;
    uptimeSeconds: number;
  };
  cpu?: {
    model: string;
    cores: number;
    speedMHz: number;
    loadAvg: number[];
  };
  memory?: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    systemTotalMb: number;
    systemFreeMb: number;
    systemUsedMb: number;
    usagePercent: number;
  };
  realtime?: {
    connectedClients: number;
  };
}

interface MetricPoint {
  time: number;
  cpuPercent: number;
  memoryMb: number;
  systemPercent: number;
}

export default function ActivityMonitor() {
  const { windows, closeWindow, focusWindow, restoreWindow, minimizeWindow, osMode, systemSounds, notify } = useOS();
  const isWin = osMode === "win";

  const [activeTab, setActiveTab] = useState<
    "processes" | "apis" | "performance" | "network" | "logs" | "storage" | "specs" | "benchmark"
  >("processes");

  const [sysInfo, setSysInfo] = useState<SystemInfoData | null>(null);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [osProcesses, setOsProcesses] = useState<OsProcess[]>(DEFAULT_DAEMONS);
  const [systemLogs, setSystemLogs] = useState<SystemLogItem[]>([]);
  const [storageData, setStorageData] = useState<StorageBreakdown | null>(null);
  const [networkData, setNetworkData] = useState<NetworkTelemetry | null>(null);
  const [loading, setLoading] = useState(true);

  // Processes filtering & callout state
  const [procSearchQuery, setProcSearchQuery] = useState("");
  const [procCategory, setProcCategory] = useState<"all" | "windows" | "daemons">("all");
  const [showCompositorBanner, setShowCompositorBanner] = useState(true);

  // APIs & Packages state & filters
  const [apiSearchQuery, setApiSearchQuery] = useState("");
  const [apiCategory, setApiCategory] = useState<"all" | "api" | "packages">("all");
  const [apiMethodFilter, setApiMethodFilter] = useState<"ALL" | "GET" | "POST" | "PUT" | "PATCH" | "DELETE">("ALL");
  const [packageEnvFilter, setPackageEnvFilter] = useState<"ALL" | "Client" | "Server" | "Production" | "DevTooling">("ALL");
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpointInfo[]>(DEFAULT_ENDPOINTS);
  const [testedEndpoints, setTestedEndpoints] = useState<Record<string, {
    status: string;
    statusCode?: number;
    latency: number;
    testing?: boolean;
    ok: boolean;
    data?: any;
    simulated?: boolean;
  }>>({});

  // Inspector & Sandbox Playground state
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpointInfo | null>(null);
  const [inspectPayloadText, setInspectPayloadText] = useState<string>("{}");
  const [inspectResponse, setInspectResponse] = useState<{
    status: string;
    statusCode?: number;
    latency: number;
    ok: boolean;
    data: any;
    simulated: boolean;
    timestamp: string;
  } | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [showSecurityNotice, setShowSecurityNotice] = useState(true);

  // Diagnostics & Ping tool state
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [testingPing, setTestingPing] = useState(false);
  const [restartingPid, setRestartingPid] = useState<number | null>(null);
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const [clearingLogs, setClearingLogs] = useState(false);

  // Benchmark state
  const [benchmarkResult, setBenchmarkResult] = useState<any | null>(null);
  const [runningBenchmark, setRunningBenchmark] = useState(false);

  // Log filter states
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch telemetry, processes, logs, storage, network, APIs
  const fetchDiagnostics = async () => {
    try {
      const [infoRes, metricsRes, procRes, storageRes, logsRes, netRes, apiRes] = await Promise.all([
        fetch(`${API_URL}/api/system/info`),
        fetch(`${API_URL}/api/system/metrics`),
        fetch(`${API_URL}/api/system/processes`).catch(() => null),
        fetch(`${API_URL}/api/system/storage`).catch(() => null),
        fetch(`${API_URL}/api/system/logs`).catch(() => null),
        fetch(`${API_URL}/api/system/network`).catch(() => null),
        fetch(`${API_URL}/api`).catch(() => null)
      ]);

      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setSysInfo(infoData);
      }
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        if (metricsData.history) setMetrics(metricsData.history);
      }
      if (procRes && procRes.ok) {
        const procs = await procRes.json();
        if (Array.isArray(procs) && procs.length > 0) {
          setOsProcesses(procs);
        }
      }
      if (storageRes && storageRes.ok) {
        const storage = await storageRes.json();
        setStorageData(storage);
      }
      if (logsRes && logsRes.ok) {
        const logs = await logsRes.json();
        setSystemLogs(logs);
      }
      if (netRes && netRes.ok) {
        const net = await netRes.json();
        setNetworkData(net);
      }
      if (apiRes && apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.endpoints && Array.isArray(apiData.endpoints) && apiData.endpoints.length > 0) {
          setApiEndpoints((prev) => {
            const list = prev.length > 0 ? [...prev] : [...DEFAULT_ENDPOINTS];
            for (const sEp of apiData.endpoints) {
              const method = (sEp.method || "GET").toUpperCase();
              const existingIdx = list.findIndex((m) => m.path === sEp.path && m.method === method);
              if (existingIdx !== -1) {
                list[existingIdx] = {
                  ...list[existingIdx],
                  description: sEp.description || list[existingIdx].description,
                  security: list[existingIdx].security || (method === "GET" ? "Public Safe (Live)" : "Sandbox Simulated"),
                };
              } else {
                list.push({
                  path: sEp.path,
                  method: method as any,
                  category: sEp.path.includes("/system") || sEp.path.includes("/health") ? "System"
                    : sEp.path.includes("/chat") ? "Realtime"
                    : sEp.path.includes("/project") || sEp.path.includes("/update") ? "Portfolio"
                    : sEp.path.includes("/guestbook") ? "Social"
                    : sEp.path.includes("/note") ? "Productivity"
                    : sEp.path.includes("/file") ? "Storage"
                    : sEp.path.includes("/music") ? "Media"
                    : sEp.path.includes("/game") ? "Arcade"
                    : "Utility",
                  description: sEp.description || "System REST API Endpoint",
                  security: method === "GET" ? "Public Safe (Live)" : "Sandbox Simulated",
                  sampleResponse: { status: "ok", path: sEp.path, verified: true },
                });
              }
            }
            return list;
          });
        }
      }
    } catch {
      // Fallback simulated metrics if server is offline or cold starting
      setMetrics((prev) => {
        const now = Date.now();
        const nextVal = Math.min(100, Math.max(8, Math.round(18 + Math.random() * 15)));
        const point = {
          time: now,
          cpuPercent: nextVal,
          memoryMb: 42 + Math.round(Math.random() * 8),
          systemPercent: 35
        };
        return [...prev.slice(-14), point];
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 3000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket events for system log streaming, process updates, and log clearing
  useEffect(() => {
    const socket = getSocket();

    const onLog = (entry: SystemLogItem) => {
      setSystemLogs((prev) => [entry, ...prev.slice(0, 99)]);
    };

    const onLogsCleared = () => {
      setSystemLogs([]);
      notify("Logs Cleared", "System logs buffer was cleared.", "delete");
    };

    const onProcUpdate = (updatedProc: OsProcess) => {
      setOsProcesses((prev) =>
        prev.map((p) => (p.pid === updatedProc.pid ? updatedProc : p))
      );
    };

    socket.on("system:log", onLog);
    socket.on("system:logs_cleared", onLogsCleared);
    socket.on("system:process_updated", onProcUpdate);

    return () => {
      socket.off("system:log", onLog);
      socket.off("system:logs_cleared", onLogsCleared);
      socket.off("system:process_updated", onProcUpdate);
    };
  }, [notify]);

  const runPingTest = async () => {
    if (systemSounds) soundFx.playClick();
    setTestingPing(true);
    const start = performance.now();
    try {
      const res = await fetch(`${API_URL}/api/system/ping?t=${Date.now()}`);
      if (res.ok) {
        const roundtrip = Math.round(performance.now() - start);
        setPingLatency(roundtrip);
      } else {
        setPingLatency(-1);
      }
    } catch {
      setPingLatency(-1);
    } finally {
      setTestingPing(false);
    }
  };

  // Close open user application window
  const handleEndTask = (winId: string, title: string) => {
    if (systemSounds) soundFx.playClose();
    closeWindow(winId);
    notify("Process Terminated", `Closed "${title}" successfully.`, "delete");
  };

  // Restart an OS background process
  const restartProcess = async (pid: number, name: string) => {
    if (systemSounds) soundFx.playClick();
    setRestartingPid(pid);
    try {
      const res = await fetch(`${API_URL}/api/system/process/${pid}/restart`, {
        method: "POST"
      });
      if (res.ok) {
        setOsProcesses((prev) =>
          prev.map((p) => (p.pid === pid ? { ...p, status: "restarting" } : p))
        );
        notify("Process Recovered", `Restarted ${name} (PID: ${pid})`, "update");
      }
    } catch {
      notify("Action Failed", `Could not restart process ${name}.`, "warning");
    } finally {
      setTimeout(() => setRestartingPid(null), 1000);
    }
  };

  // Terminate an OS background process
  const killProcess = async (pid: number, name: string) => {
    if (systemSounds) soundFx.playClose();
    setKillingPid(pid);
    try {
      const res = await fetch(`${API_URL}/api/system/process/${pid}/kill`, {
        method: "POST"
      });
      if (res.ok) {
        setOsProcesses((prev) =>
          prev.map((p) => (p.pid === pid ? { ...p, status: "stopped", cpu: 0 } : p))
        );
        notify("Process Terminated", `Stopped ${name} (PID: ${pid})`, "delete");
      }
    } catch {
      notify("Action Failed", `Could not stop process ${name}.`, "warning");
    } finally {
      setTimeout(() => setKillingPid(null), 500);
    }
  };

  // Clear system logs buffer
  const handleClearLogs = async () => {
    if (systemSounds) soundFx.playClick();
    setClearingLogs(true);
    try {
      await fetch(`${API_URL}/api/system/logs/clear`, { method: "POST" });
    } catch {
      setSystemLogs([]);
      notify("Logs Cleared", "System logs buffer cleared locally.", "delete");
    } finally {
      setClearingLogs(false);
    }
  };

  // Run benchmark stress test
  const runBenchmark = async () => {
    if (systemSounds) soundFx.playClick();
    setRunningBenchmark(true);
    try {
      const res = await fetch(`${API_URL}/api/system/benchmark`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBenchmarkResult(data);
        notify("Benchmark Finished", `Rating: ${data.metrics?.rating || "A+"}`, "update");
      } else {
        throw new Error();
      }
    } catch {
      // Client-side fallback benchmark computation
      const start = performance.now();
      let count = 0;
      for (let i = 2; i <= 25000; i++) {
        let isP = true;
        for (let j = 2; j * j <= i; j++) {
          if (i % j === 0) { isP = false; break; }
        }
        if (isP) count++;
      }
      const dur = Math.round((performance.now() - start) * 10) / 10;
      const ops = Math.round(25000 / (dur / 1000));
      setBenchmarkResult({
        durationMs: dur,
        metrics: {
          primesCalculated: count,
          opsPerSec: ops,
          jsonThroughputMbSec: 142.5,
          memoryDeltaKb: 218,
          rating: dur < 80 ? "A+ (Ultra Fast)" : "A (Fast)"
        },
        system: {
          platform: navigator.userAgent.includes("Windows") ? "Windows 11" : "macOS Sonoma",
          arch: "x86_64 WebAssembly",
          cpus: navigator.hardwareConcurrency || 8,
          model: "Browser JS JIT Engine",
          nodeVersion: "Node.js v20.18"
        }
      });
      notify("Benchmark Finished", "Local browser engine stress test completed.", "update");
    } finally {
      setRunningBenchmark(false);
    }
  };

  // Live & Sandbox hypermedia endpoint testing
  const testEndpoint = async (ep: ApiEndpointInfo, customPayload?: any) => {
    if (systemSounds) soundFx.playClick();
    const key = `${ep.method}-${ep.path}`;
    setTestedEndpoints((prev) => ({
      ...prev,
      [key]: { status: "Testing...", latency: 0, testing: true, ok: false },
    }));

    const isGet = ep.method === "GET";
    const start = performance.now();

    if (isGet) {
      try {
        const cleanPath = ep.path.replace(/:[a-zA-Z0-9_-]+/g, "1");
        const targetUrl = `${API_URL}${cleanPath}`;
        const res = await fetch(targetUrl, {
          method: "GET",
          headers: { Accept: "application/json" }
        });
        const elapsed = Math.round(performance.now() - start);
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = ep.sampleResponse || { ok: true, status: "live" };
        }

        const resultObj = {
          status: `${res.status} ${res.statusText || "OK"}`,
          statusCode: res.status,
          latency: elapsed,
          testing: false,
          ok: res.ok,
          data: data || ep.sampleResponse || { ok: true, status: "live" },
          simulated: false,
        };

        setTestedEndpoints((prev) => ({ ...prev, [key]: resultObj }));
        if (selectedEndpoint && selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method) {
          setInspectResponse({
            ...resultObj,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } catch {
        // Fallback for static GitHub Pages or server standby
        const elapsed = Math.round(18 + Math.random() * 25);
        const resultObj = {
          status: "200 OK (Standby Live)",
          statusCode: 200,
          latency: elapsed,
          testing: false,
          ok: true,
          data: ep.sampleResponse || { ok: true, status: "standby" },
          simulated: true,
        };
        setTestedEndpoints((prev) => ({ ...prev, [key]: resultObj }));
        if (selectedEndpoint && selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method) {
          setInspectResponse({
            ...resultObj,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      }
    } else {
      // POST, PUT, PATCH, DELETE: Interactive Sandbox Simulation
      // Simulate realistic network latency (100ms - 250ms)
      await new Promise((r) => setTimeout(r, Math.round(110 + Math.random() * 150)));
      const elapsed = Math.round(performance.now() - start);

      let responseData: any = ep.sampleResponse ? { ...ep.sampleResponse } : { ok: true, status: "simulated" };
      let statusCode = 200;
      let statusText = "200 OK (Sandbox Simulated)";

      if (ep.method === "POST") {
        statusCode = 201;
        statusText = "201 Created (Sandbox)";
      } else if (ep.method === "DELETE") {
        statusCode = 200;
        statusText = "200 OK (Deleted in Sandbox)";
      }

      // If restarting process in sandbox:
      if (ep.path.includes("process") && ep.path.includes("restart")) {
        const targetPid = 101;
        setOsProcesses((prev) =>
          prev.map((p) => (p.pid === targetPid ? { ...p, status: "restarting" } : p))
        );
        notify("Sandbox Simulation", "Process #101 transitioning: Running -> Restarting", "update");

        setTimeout(() => {
          setOsProcesses((prev) =>
            prev.map((p) => (p.pid === targetPid ? { ...p, status: "running" } : p))
          );
          notify("Sandbox Simulation Complete", "Process #101 restored to Running state.", "update");
        }, 1400);
      }

      if (customPayload) {
        responseData = {
          ...responseData,
          receivedPayload: customPayload,
          simulatedAt: new Date().toISOString(),
        };
      }

      const resultObj = {
        status: statusText,
        statusCode,
        latency: elapsed,
        testing: false,
        ok: true,
        data: responseData,
        simulated: true,
      };

      setTestedEndpoints((prev) => ({ ...prev, [key]: resultObj }));
      if (selectedEndpoint && selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method) {
        setInspectResponse({
          ...resultObj,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      if (!ep.path.includes("restart")) {
        notify(
          `${ep.method} ${ep.path}`,
          `Simulated in sandbox: ${statusCode} response in ${elapsed}ms.`,
          "info"
        );
      }
    }
  };

  const openInspector = (ep: ApiEndpointInfo) => {
    if (systemSounds) soundFx.playClick();
    setSelectedEndpoint(ep);
    const key = `${ep.method}-${ep.path}`;
    const existing = testedEndpoints[key];
    if (existing && existing.data) {
      setInspectResponse({
        status: existing.status,
        statusCode: existing.statusCode,
        latency: existing.latency,
        ok: existing.ok,
        data: existing.data,
        simulated: existing.simulated ?? false,
        timestamp: new Date().toLocaleTimeString(),
      });
    } else {
      setInspectResponse(null);
    }

    if (ep.samplePayload) {
      setInspectPayloadText(JSON.stringify(ep.samplePayload, null, 2));
    } else {
      setInspectPayloadText("");
    }
  };

  const runInspectorTest = async () => {
    if (!selectedEndpoint) return;
    setInspecting(true);
    let parsed: any = null;
    if (inspectPayloadText.trim()) {
      try {
        parsed = JSON.parse(inspectPayloadText);
      } catch {
        notify("Invalid JSON", "Request payload must be valid JSON.", "warning");
        setInspecting(false);
        return;
      }
    }
    await testEndpoint(selectedEndpoint, parsed);
    setInspecting(false);
  };

  // Filtered window compositor tasks
  const filteredWindows = useMemo(() => {
    if (!procSearchQuery.trim()) return windows;
    const q = procSearchQuery.toLowerCase();
    return windows.filter(
      (w) => w.title.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)
    );
  }, [windows, procSearchQuery]);

  // Filtered background daemons
  const filteredDaemons = useMemo(() => {
    if (!procSearchQuery.trim()) return osProcesses;
    const q = procSearchQuery.toLowerCase();
    return osProcesses.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.pid.toString().includes(q)
    );
  }, [osProcesses, procSearchQuery]);

  // Filtered hypermedia endpoints
  const filteredEndpoints = useMemo(() => {
    let list = apiEndpoints;
    if (apiMethodFilter !== "ALL") {
      list = list.filter((ep) => ep.method.toUpperCase().includes(apiMethodFilter));
    }
    if (apiSearchQuery.trim()) {
      const q = apiSearchQuery.toLowerCase();
      list = list.filter(
        (ep) =>
          ep.path.toLowerCase().includes(q) ||
          ep.method.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q) ||
          (ep.category && ep.category.toLowerCase().includes(q))
      );
    }
    return list;
  }, [apiEndpoints, apiMethodFilter, apiSearchQuery]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    let list = RUNTIME_PACKAGES;
    if (packageEnvFilter === "Client") {
      list = list.filter((p) => p.env === "Client" || p.env === "Fullstack");
    } else if (packageEnvFilter === "Server") {
      list = list.filter((p) => p.env === "Server" || p.env === "Fullstack");
    } else if (packageEnvFilter === "Production") {
      list = list.filter((p) => p.type === "Production");
    } else if (packageEnvFilter === "DevTooling") {
      list = list.filter((p) => p.type === "DevTooling");
    }

    if (apiSearchQuery.trim()) {
      const q = apiSearchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.pkgName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.version.toLowerCase().includes(q)
      );
    }
    return list;
  }, [packageEnvFilter, apiSearchQuery]);

  const currentCpu = metrics.length > 0 ? metrics[metrics.length - 1].cpuPercent : 16;
  const currentMem =
    sysInfo?.memory?.heapUsedMb ||
    (metrics.length > 0 ? metrics[metrics.length - 1].memoryMb : 48);

  // Filtered system logs
  const filteredLogs = useMemo(() => {
    let result = [...systemLogs];
    if (logLevelFilter !== "all") {
      result = result.filter((l) => l.level.toLowerCase() === logLevelFilter.toLowerCase());
    }
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      result = result.filter(
        (l) => l.message.toLowerCase().includes(q) || l.module.toLowerCase().includes(q)
      );
    }
    return result;
  }, [systemLogs, logLevelFilter, logSearchQuery]);

  return (
    <div className="flex flex-col h-full select-none bg-black/40 text-white text-xs">
      {/* Tab Navigation (Sticky Header with Touch Momentum Scrolling) */}
      <div className="flex items-center justify-between border-b border-white/10 px-2 sm:px-3 py-1.5 bg-[#0d1017]/95 backdrop-blur-md gap-2 shrink-0 sticky top-0 z-20 shadow-sm min-w-0">
        <div className="flex-1 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar touch-pan-x py-0.5 min-w-0">
          <button
            onClick={() => setActiveTab("processes")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-xs ${
              activeTab === "processes"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <GIconActivity size={12} className="shrink-0" />
            <span>Processes ({windows.length + osProcesses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("apis")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-xs ${
              activeTab === "apis"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <GIconGlobe size={12} className="shrink-0 text-emerald-400" />
            <span>APIs & Packages ({apiEndpoints.length + RUNTIME_PACKAGES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("performance")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-xs ${
              activeTab === "performance"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <GIconSignal size={12} className="shrink-0" />
            <span>Performance</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-xs ${
              activeTab === "logs"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <GIconFileText size={12} className="shrink-0" />
            <span>Live Logs</span>
          </button>

          <button
            onClick={() => setActiveTab("storage")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-xs ${
              activeTab === "storage"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <GIconHardDrive size={12} className="shrink-0" />
            <span>Storage</span>
          </button>

          <button
            onClick={() => setActiveTab("network")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-xs ${
              activeTab === "network"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <GIconSignal size={12} className="shrink-0" />
            <span>Diagnostics & Ping</span>
          </button>

          <button
            onClick={() => setActiveTab("specs")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-xs ${
              activeTab === "specs"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <GIconCpu size={12} className="shrink-0" />
            <span>Specs</span>
          </button>

          <button
            onClick={() => setActiveTab("benchmark")}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-xs ${
              activeTab === "benchmark"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <GIconThunderbolt size={12} className="text-amber-400 shrink-0" />
            <span>Benchmark</span>
          </button>
        </div>

        <button
          onClick={fetchDiagnostics}
          title="Refresh metrics & processes"
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition shrink-0 cursor-pointer"
        >
          <GIconRotateRight size={14} className={loading ? "animate-spin text-accent" : ""} />
        </button>
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-auto thin-scroll p-3 sm:p-4">
        {loading && !sysInfo && metrics.length === 0 ? (
          <ActivityMonitorSkeleton />
        ) : (
          <>
            {/* Processes Tab */}
            {activeTab === "processes" && (
          <div className="space-y-4">
            {/* Telemetry KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Compositor Tasks</div>
                <div className="text-base sm:text-lg font-bold text-white mt-0.5">{windows.length}</div>
                <div className="text-[10px] text-accent mt-0.5 truncate">
                  {windows.filter((w) => !w.minimized).length} active · {windows.filter((w) => w.minimized).length} min
                </div>
              </div>
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">System Daemons</div>
                <div className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
                  {osProcesses.filter((p) => p.status === "running").length} / {osProcesses.length}
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">Background Workers</div>
              </div>
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Compositor Engine</div>
                <div className="text-base sm:text-lg font-bold text-cyan-400 mt-0.5">60 FPS</div>
                <div className="text-[10px] text-white/40 mt-0.5">GPU Accelerated</div>
              </div>
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Active Routes</div>
                <div className="text-base sm:text-lg font-bold text-amber-400 mt-0.5">{apiEndpoints.length} APIs</div>
                <div className="text-[10px] text-white/40 mt-0.5">REST + WebSocket</div>
              </div>
            </div>

            {/* Dismissible Explanatory Callout Banner */}
            {showCompositorBanner && (
              <div className="p-3 rounded-xl border border-accent/25 bg-accent/[0.06] flex items-start justify-between gap-3 relative">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <GIconCircleInfo size={14} />
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="font-semibold text-white flex items-center gap-1.5 flex-wrap">
                      <span>What is the Window Compositor?</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent/20 text-accent font-mono">
                        Portfolio OS Core
                      </span>
                    </div>
                    <p className="text-white/70 leading-relaxed text-[10px] sm:text-[11px]">
                      The <strong>Window Compositor</strong> manages browser DOM rendering, z-index layering, window focus, minimization, and memory allocation for all open applications. You can inspect active window threads below, bring windows into focus, minimize them, or force-terminate frozen tasks.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompositorBanner(false)}
                  className="text-white/40 hover:text-white p-1 rounded transition text-xs shrink-0 cursor-pointer"
                  title="Dismiss banner"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 w-fit">
                <button
                  onClick={() => setProcCategory("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    procCategory === "all" ? "bg-accent text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  All ({windows.length + osProcesses.length})
                </button>
                <button
                  onClick={() => setProcCategory("windows")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    procCategory === "windows" ? "bg-accent text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  Windows ({windows.length})
                </button>
                <button
                  onClick={() => setProcCategory("daemons")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    procCategory === "daemons" ? "bg-accent text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  Daemons ({osProcesses.length})
                </button>
              </div>

              <div className="relative w-full sm:w-60">
                <GIconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search processes, apps, PID..."
                  value={procSearchQuery}
                  onChange={(e) => setProcSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-white/40 outline-none focus-stroke focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 focus:shadow-[0_0_14px_rgba(0,145,255,0.28)] transition-all"
                />
              </div>
            </div>

            {/* Active Application Windows */}
            {(procCategory === "all" || procCategory === "windows") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-white/90">
                      Active Application Windows (Compositor Tasks)
                    </h3>
                    <p className="text-[11px] text-white/40">
                      {windows.length} window{windows.length === 1 ? "" : "s"} rendered and composited in the DOM.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                    Live Reactive
                  </span>
                </div>

                {filteredWindows.length === 0 ? (
                  <div className="text-center py-6 rounded-xl border border-dashed border-white/10 bg-white/5">
                    <GIconActivity size={24} className="mx-auto text-white/20 mb-1.5" />
                    <p className="text-white/50 font-medium">No open windows matching criteria</p>
                    <p className="text-[10px] text-white/30">
                      Launch apps from the dock or mobile menu to monitor window threads.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop View: Full Tabular Layout */}
                    <div className="hidden sm:block rounded-xl border border-white/10 overflow-x-auto thin-scroll bg-black/20">
                      <table className="w-full min-w-[680px] text-left text-[11px]">
                        <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase font-mono text-[9px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 min-w-[140px] whitespace-nowrap">Process / Application</th>
                            <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap">Thread ID</th>
                            <th className="py-2.5 px-3 min-w-[130px] whitespace-nowrap">Compositor State</th>
                            <th className="py-2.5 px-3 min-w-[90px] whitespace-nowrap">Z-Index Layer</th>
                            <th className="py-2.5 px-3 min-w-[80px] whitespace-nowrap">Est. Memory</th>
                            <th className="py-2.5 px-3 min-w-[180px] text-right whitespace-nowrap">Window Controls</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredWindows.map((win) => {
                            const memMb = (Math.abs(win.id.charCodeAt(0) * 3) % 24) + 14;
                            return (
                              <tr key={win.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-2.5 px-3 font-medium flex items-center gap-2 whitespace-nowrap">
                                  <span className="text-white font-medium truncate max-w-[160px]">{win.title}</span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-white/40 whitespace-nowrap">
                                  #win-{win.id}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0 ${
                                      win.minimized
                                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                    }`}
                                  >
                                    {win.minimized ? "Minimized" : "Active / Visible"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-white/60 whitespace-nowrap">
                                  Layer {win.z || 10}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-white/70 whitespace-nowrap">
                                  ~{memMb} MB
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        focusWindow(win.id);
                                        if (systemSounds) soundFx.playClick();
                                        notify("Window Focused", `Focused "${win.title}".`, "info");
                                      }}
                                      className="h-7 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white transition text-[11px] font-medium cursor-pointer"
                                      title="Bring window to front"
                                    >
                                      Focus
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (win.minimized) {
                                          restoreWindow(win.id);
                                        } else {
                                          minimizeWindow(win.id);
                                        }
                                      }}
                                      className="h-7 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white transition text-[11px] font-medium cursor-pointer"
                                      title={win.minimized ? "Restore window" : "Minimize window"}
                                    >
                                      {win.minimized ? "Restore" : "Minimize"}
                                    </button>
                                    <button
                                      onClick={() => handleEndTask(win.id, win.title)}
                                      className="h-7 px-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition text-[11px] font-semibold cursor-pointer shadow-xs"
                                      title="Terminate window process"
                                    >
                                      End Task
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View: Responsive Card Grid (No horizontal clipping!) */}
                    <div className="sm:hidden space-y-2">
                      {filteredWindows.map((win) => {
                        const memMb = (Math.abs(win.id.charCodeAt(0) * 3) % 24) + 14;
                        return (
                          <div key={win.id} className="p-3 rounded-xl border border-white/10 bg-white/[0.03] space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold text-white truncate text-xs">{win.title}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${
                                win.minimized
                                  ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              }`}>
                                {win.minimized ? "Minimized" : "Active"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/60">#win-{win.id}</span>
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/60">Layer {win.z || 10}</span>
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/60">~{memMb} MB</span>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-white/5">
                              <button
                                onClick={() => {
                                  focusWindow(win.id);
                                  if (systemSounds) soundFx.playClick();
                                  notify("Window Focused", `Focused "${win.title}".`, "info");
                                }}
                                className="py-1.5 px-2 rounded-lg bg-white/10 active:bg-white/20 text-white/90 text-[10px] font-medium transition text-center cursor-pointer"
                              >
                                Focus
                              </button>
                              <button
                                onClick={() => {
                                  if (win.minimized) {
                                    restoreWindow(win.id);
                                  } else {
                                    minimizeWindow(win.id);
                                  }
                                }}
                                className="py-1.5 px-2 rounded-lg bg-white/10 active:bg-white/20 text-white/90 text-[10px] font-medium transition text-center cursor-pointer"
                              >
                                {win.minimized ? "Restore" : "Minimize"}
                              </button>
                              <button
                                onClick={() => handleEndTask(win.id, win.title)}
                                className="py-1.5 px-2 rounded-lg bg-rose-500/20 active:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] font-semibold transition text-center cursor-pointer"
                              >
                                End Task
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Background System Daemons */}
            {(procCategory === "all" || procCategory === "daemons") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-white/90">
                      Core Daemons & Background Workers
                    </h3>
                    <p className="text-[11px] text-white/40">
                      Services handling WebSockets, audio synthesis, file system & telemetry.
                    </p>
                  </div>
                </div>

                {/* Desktop View: Full Tabular Layout */}
                <div className="hidden sm:block rounded-xl border border-white/10 overflow-x-auto thin-scroll bg-black/20">
                  <table className="w-full min-w-[500px] text-left text-[11px]">
                    <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase font-mono text-[9px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">PID</th>
                        <th className="py-2.5 px-3">Service Name</th>
                        <th className="py-2.5 px-3">CPU Usage</th>
                        <th className="py-2.5 px-3">Memory</th>
                        <th className="py-2.5 px-3">State</th>
                        <th className="py-2.5 px-3 text-right">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredDaemons.map((p) => {
                        const isRestarting = restartingPid === p.pid || p.status === "restarting";
                        return (
                          <tr key={p.pid} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-white/40">{p.pid}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-white/90">{p.name}</div>
                              {p.description && (
                                <div className="text-[9px] text-white/40">{p.description}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-white/70 w-8">{p.cpu}%</span>
                                <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                                  <div
                                    className="h-full bg-accent rounded-full transition-all"
                                    style={{ width: `${Math.min(100, p.cpu * 10)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-white/70">{p.memoryMb} MB</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                  isRestarting
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"
                                    : p.status === "running"
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : p.status === "stopped"
                                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                    : "bg-white/10 text-white/50 border-white/10"
                                }`}
                              >
                                {isRestarting ? "Restarting..." : p.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => restartProcess(p.pid, p.name)}
                                  disabled={isRestarting}
                                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition text-[10px] disabled:opacity-50 cursor-pointer"
                                  title="Restart daemon process"
                                >
                                  Restart
                                </button>
                                {p.status !== "stopped" && (
                                  <button
                                    onClick={() => killProcess(p.pid, p.name)}
                                    disabled={killingPid === p.pid}
                                    className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition text-[10px] disabled:opacity-50 cursor-pointer"
                                    title="Terminate daemon"
                                  >
                                    {killingPid === p.pid ? "Ending..." : "End"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Responsive Card Grid (No horizontal clipping!) */}
                <div className="sm:hidden space-y-2">
                  {filteredDaemons.map((p) => {
                    const isRestarting = restartingPid === p.pid || p.status === "restarting";
                    return (
                      <div key={p.pid} className="p-3 rounded-xl border border-white/10 bg-white/[0.03] space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-semibold text-xs">{p.name}</span>
                              <span className="text-[10px] text-white/40 font-mono">PID {p.pid}</span>
                            </div>
                            {p.description && (
                              <p className="text-[10px] text-white/50 mt-0.5">{p.description}</p>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${
                            isRestarting
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"
                              : p.status === "running"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : p.status === "stopped"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : "bg-white/10 text-white/50 border-white/10"
                          }`}>
                            {isRestarting ? "Restarting..." : p.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-white/60 bg-black/30 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span>CPU: <strong className="text-white">{p.cpu}%</strong></span>
                            <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full bg-accent" style={{ width: `${Math.min(100, p.cpu * 10)}%` }} />
                            </div>
                          </div>
                          <span>RAM: <strong className="text-white">{p.memoryMb} MB</strong></span>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            onClick={() => restartProcess(p.pid, p.name)}
                            disabled={isRestarting}
                            className="px-2.5 py-1 rounded-lg bg-white/10 active:bg-white/20 text-white/80 text-[10px] font-medium transition cursor-pointer"
                          >
                            Restart
                          </button>
                          {p.status !== "stopped" && (
                            <button
                              onClick={() => killProcess(p.pid, p.name)}
                              disabled={killingPid === p.pid}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/15 active:bg-rose-500/25 text-rose-300 text-[10px] font-medium transition cursor-pointer"
                            >
                              {killingPid === p.pid ? "Ending..." : "End"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* APIs & Packages Tab */}
        {activeTab === "apis" && (
          <div className="space-y-4">
            {/* Header & Overview Stats */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <GIconGlobe size={16} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-white">System APIs, Endpoints & Packages</h3>
                    <p className="text-[10px] sm:text-[11px] text-white/50">
                      Live Hypermedia routes (GET, POST, PUT, PATCH, DELETE) and verified dependencies from project manifests.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono">
                    Gateway Online
                  </span>
                  <button
                    onClick={() => setShowSecurityNotice((v) => !v)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition text-[10px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <GIconLock size={11} className="text-amber-400" />
                    <span>{showSecurityNotice ? "Hide Security Policy" : "View Security Policy"}</span>
                  </button>
                </div>
              </div>

              {/* Security Architecture & Precautions Callout (Collapsible) */}
              {showSecurityNotice && (
                <div className="p-3 sm:p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                      <GIconLock size={13} />
                      <span>Security Architecture & Public Disclosure Policy</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-mono text-amber-400/70 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      Demonstration Safe
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] sm:text-[11px] text-white/70">
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5 space-y-1">
                      <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        1. Safe Public Routes (GET)
                      </div>
                      <p className="text-white/60 text-[10px] leading-relaxed">
                        Publicly displays HTTP routes, descriptions, and telemetry metrics. Read-only queries measure live roundtrip latency safely.
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-black/30 border border-white/5 space-y-1">
                      <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                        2. Sandbox Mutations (POST/PUT/DELETE)
                      </div>
                      <p className="text-white/60 text-[10px] leading-relaxed">
                        Modifying operations execute in an isolated simulation sandbox. Process restarts and note updates simulate transitions without altering production databases.
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-black/30 border border-white/5 space-y-1">
                      <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                        3. Zero Secrets Disclosure
                      </div>
                      <p className="text-white/60 text-[10px] leading-relaxed">
                        Database credentials, server private IPs, JWT keys, and .env secrets are strictly isolated on the server and never exposed in client bundles.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                  <div className="text-[9px] uppercase font-mono text-white/40">Total Endpoints</div>
                  <div className="text-sm sm:text-base font-bold text-white mt-0.5">{apiEndpoints.length} Routes</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                  <div className="text-[9px] uppercase font-mono text-white/40">HTTP Methods</div>
                  <div className="text-sm sm:text-base font-bold text-cyan-400 mt-0.5">GET · POST · PUT · PATCH · DEL</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                  <div className="text-[9px] uppercase font-mono text-white/40">Backend Gateway</div>
                  <div className="text-sm sm:text-base font-bold text-amber-400 mt-0.5">Express 5 + NestJS 12</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                  <div className="text-[9px] uppercase font-mono text-white/40">Installed Packages</div>
                  <div className="text-sm sm:text-base font-bold text-purple-400 mt-0.5">{RUNTIME_PACKAGES.length} Libraries</div>
                </div>
              </div>
            </div>

            {/* Filter Navigation Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 w-fit flex-wrap">
                <button
                  onClick={() => setApiCategory("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    apiCategory === "all" ? "bg-accent text-white shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  All Resources
                </button>
                <button
                  onClick={() => setApiCategory("api")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    apiCategory === "api" ? "bg-accent text-white shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  APIs & Endpoints ({apiEndpoints.length})
                </button>
                <button
                  onClick={() => setApiCategory("packages")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    apiCategory === "packages" ? "bg-accent text-white shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  Packages & Libraries ({RUNTIME_PACKAGES.length})
                </button>
              </div>

              {/* Search Bar with Active Stroke */}
              <div className="focus-stroke relative w-full sm:w-72 flex items-center bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 focus-within:border-[#0091ff] focus-within:ring-2 focus-within:ring-[#0091ff]/40 focus-within:shadow-[0_0_14px_rgba(0,145,255,0.28)] transition-all">
                <GIconSearch size={13} className="text-white/40 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Filter by method, route, package..."
                  value={apiSearchQuery}
                  onChange={(e) => setApiSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-[11px] text-white placeholder-white/40 outline-none"
                />
                {apiSearchQuery && (
                  <button
                    onClick={() => setApiSearchQuery("")}
                    className="text-white/40 hover:text-white text-xs cursor-pointer ml-1"
                  >
                    <GIconClose size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Section 1: Endpoints */}
            {(apiCategory === "all" || apiCategory === "api") && (
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-semibold text-white/90">
                      Hypermedia Endpoints ({filteredEndpoints.length})
                    </h3>
                    <span className="text-[10px] text-white/40 hidden sm:inline">· Click "Inspect / Try" to test live or in sandbox</span>
                  </div>

                  {/* HTTP Method Filters: ALL, GET, POST, PUT, PATCH, DELETE */}
                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] overflow-x-auto no-scrollbar">
                    {(["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((method) => {
                      const isSelected = apiMethodFilter === method;
                      let badgeStyle = "text-white/50 hover:text-white";
                      if (isSelected) {
                        if (method === "GET") badgeStyle = "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40";
                        else if (method === "POST") badgeStyle = "bg-sky-500/30 text-sky-300 border border-sky-500/40";
                        else if (method === "PUT") badgeStyle = "bg-amber-500/30 text-amber-300 border border-amber-500/40";
                        else if (method === "PATCH") badgeStyle = "bg-purple-500/30 text-purple-300 border border-purple-500/40";
                        else if (method === "DELETE") badgeStyle = "bg-rose-500/30 text-rose-300 border border-rose-500/40";
                        else badgeStyle = "bg-accent text-white";
                      }

                      return (
                        <button
                          key={method}
                          onClick={() => setApiMethodFilter(method)}
                          className={`px-2 py-0.5 rounded font-mono font-bold transition whitespace-nowrap cursor-pointer ${badgeStyle}`}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop View: Full Tabular Endpoints View */}
                <div className="hidden sm:block rounded-xl border border-white/10 overflow-x-auto thin-scroll bg-black/20">
                  <table className="w-full min-w-[720px] text-left text-[11px]">
                    <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase font-mono text-[9px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 min-w-[70px]">Method</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Endpoint Route</th>
                        <th className="py-2.5 px-3 min-w-[120px]">Security Tier</th>
                        <th className="py-2.5 px-3 min-w-[90px]">Category</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Description</th>
                        <th className="py-2.5 px-3 min-w-[130px]">Status / Latency</th>
                        <th className="py-2.5 px-3 min-w-[120px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {filteredEndpoints.map((ep) => {
                        const key = `${ep.method}-${ep.path}`;
                        const test = testedEndpoints[key];
                        let methodColor = "bg-purple-500/15 text-purple-300 border-purple-500/30";
                        if (ep.method === "GET") methodColor = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
                        else if (ep.method === "POST") methodColor = "bg-sky-500/15 text-sky-300 border-sky-500/30";
                        else if (ep.method === "PUT") methodColor = "bg-amber-500/15 text-amber-300 border-amber-500/30";
                        else if (ep.method === "PATCH") methodColor = "bg-purple-500/15 text-purple-300 border-purple-500/30";
                        else if (ep.method === "DELETE") methodColor = "bg-rose-500/15 text-rose-300 border-rose-500/30";

                        const isSandbox = (ep.security || "").includes("Sandbox") || (ep.security || "").includes("Protected") || ep.method !== "GET";

                        return (
                          <tr key={key} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${methodColor}`}>
                                {ep.method}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-white/90 whitespace-nowrap">
                              {ep.path}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium border ${
                                  isSandbox
                                    ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
                                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                }`}
                              >
                                <GIconLock size={9} />
                                <span>{ep.security || (ep.method === "GET" ? "Public Safe (Live)" : "Sandbox Simulated")}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-white/50 text-[10px] whitespace-nowrap">
                              {ep.category}
                            </td>
                            <td
                              className="py-2.5 px-3 font-sans text-white/70 text-[10px] max-w-[220px] truncate"
                              title={ep.description}
                            >
                              {ep.description}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {test ? (
                                test.testing ? (
                                  <span className="text-amber-400 text-[10px] animate-pulse">Executing...</span>
                                ) : test.ok ? (
                                  <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                                    {test.status} ({test.latency}ms)
                                  </span>
                                ) : (
                                  <span className="text-rose-400 text-[10px]">
                                    {test.status} ({test.latency}ms)
                                  </span>
                                )
                              ) : (
                                <span className="text-white/30 text-[10px]">Ready</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openInspector(ep)}
                                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white transition text-[10px] font-sans font-medium cursor-pointer"
                                  title="Open Request / Response Inspector & Testing Console"
                                >
                                  Inspect & Test
                                </button>
                                <button
                                  onClick={() => testEndpoint(ep)}
                                  disabled={test?.testing}
                                  className="px-2 py-1 rounded bg-accent/20 hover:bg-accent/30 active:scale-95 text-accent hover:text-white border border-accent/30 transition text-[10px] font-sans font-medium disabled:opacity-50 cursor-pointer"
                                  title={ep.method === "GET" ? "Send real GET request" : "Execute in sandbox"}
                                >
                                  {test?.testing ? "..." : ep.method === "GET" ? "Ping" : "Simulate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Responsive Card Grid (No horizontal overflow!) */}
                <div className="sm:hidden space-y-2.5">
                  {filteredEndpoints.map((ep) => {
                    const key = `${ep.method}-${ep.path}`;
                    const test = testedEndpoints[key];
                    let methodColor = "bg-purple-500/15 text-purple-300 border-purple-500/30";
                    if (ep.method === "GET") methodColor = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
                    else if (ep.method === "POST") methodColor = "bg-sky-500/15 text-sky-300 border-sky-500/30";
                    else if (ep.method === "PUT") methodColor = "bg-amber-500/15 text-amber-300 border-amber-500/30";
                    else if (ep.method === "PATCH") methodColor = "bg-purple-500/15 text-purple-300 border-purple-500/30";
                    else if (ep.method === "DELETE") methodColor = "bg-rose-500/15 text-rose-300 border-rose-500/30";

                    const isSandbox = (ep.security || "").includes("Sandbox") || (ep.security || "").includes("Protected") || ep.method !== "GET";

                    return (
                      <div key={key} className="p-3 rounded-xl border border-white/10 bg-black/25 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${methodColor}`}>
                              {ep.method}
                            </span>
                            <span className="font-mono text-xs text-white/90 font-semibold truncate">{ep.path}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/40 text-[9px] shrink-0 font-sans">
                            {ep.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[9px]">
                          <span className={`px-1.5 py-0.5 rounded font-medium border flex items-center gap-1 ${
                            isSandbox ? "bg-sky-500/10 text-sky-300 border-sky-500/20" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          }`}>
                            <GIconLock size={8} /> {ep.security || (ep.method === "GET" ? "Public Safe (Live)" : "Sandbox Simulated")}
                          </span>
                        </div>

                        <p className="text-[10px] text-white/65 leading-relaxed font-sans">{ep.description}</p>

                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <div className="text-[10px] font-mono">
                            {test ? (
                              test.testing ? (
                                <span className="text-amber-400 animate-pulse">Executing...</span>
                              ) : test.ok ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  {test.status} ({test.latency}ms)
                                </span>
                              ) : (
                                <span className="text-rose-400">{test.status} ({test.latency}ms)</span>
                              )
                            ) : (
                              <span className="text-white/30">Ready</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openInspector(ep)}
                              className="px-2 py-1 rounded-lg bg-white/10 active:bg-white/20 text-white text-[10px] font-medium transition cursor-pointer"
                            >
                              Inspect & Test
                            </button>
                            <button
                              onClick={() => testEndpoint(ep)}
                              disabled={test?.testing}
                              className="px-2 py-1 rounded-lg bg-accent/20 active:bg-accent/40 text-accent text-[10px] font-medium border border-accent/30 transition cursor-pointer"
                            >
                              {test?.testing ? "..." : ep.method === "GET" ? "Ping" : "Simulate"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Packages */}
            {(apiCategory === "all" || apiCategory === "packages") && (
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-white/90">
                      Installed Packages & Dependencies ({filteredPackages.length})
                    </h3>
                    <p className="text-[10px] text-white/40">Verified active dependencies strictly derived from client/package.json & server/package.json</p>
                  </div>

                  {/* Environment Filters */}
                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] overflow-x-auto no-scrollbar">
                    {(["ALL", "Client", "Server", "Production", "DevTooling"] as const).map((env) => (
                      <button
                        key={env}
                        onClick={() => setPackageEnvFilter(env)}
                        className={`px-2 py-0.5 rounded font-medium whitespace-nowrap transition cursor-pointer ${
                          packageEnvFilter === env
                            ? "bg-accent text-white shadow-sm"
                            : "text-white/50 hover:text-white"
                        }`}
                      >
                        {env === "DevTooling" ? "Dev / Tooling" : env}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredPackages.map((pkg) => (
                    <div
                      key={pkg.pkgName + pkg.env}
                      className="p-3 rounded-xl border border-white/10 bg-black/20 hover:bg-white/[0.04] transition flex flex-col justify-between space-y-2 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display font-semibold text-white text-xs">{pkg.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${pkg.color}`}>
                              v{pkg.version}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[9px] font-mono shrink-0">
                            {pkg.env}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-accent/80 font-medium">{pkg.category}</span>
                          <span className="text-white/20">·</span>
                          <span className="text-[9px] text-white/40 font-mono">{pkg.type}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-white/65 leading-relaxed font-sans">
                        {pkg.role}
                      </p>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-white/40 text-[9px] truncate max-w-[150px]">{pkg.pkgName}</span>
                        <a
                          href={pkg.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-accent hover:text-white transition group-hover:underline text-[10px]"
                        >
                          <span>npm</span>
                          <GIconLink size={10} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Logs Tab */}
        {activeTab === "logs" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-semibold text-white/90">
                  Real-time Kernel & Server Logs
                </h3>
                <p className="text-[11px] text-white/40">
                  Live streaming audit log of system events, guestbook actions, and realtime sockets.
                </p>
              </div>

              {/* Log Level Filters & Clear */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-0.5 text-[10px]">
                  {["all", "info", "warn", "error", "debug"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLogLevelFilter(lvl)}
                      className={`px-2 py-0.5 rounded uppercase font-mono transition ${
                        logLevelFilter === lvl
                          ? "bg-accent text-white font-semibold"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleClearLogs}
                  disabled={clearingLogs || systemLogs.length === 0}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 text-white/50 transition text-[10px] flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  title="Clear system event buffer"
                >
                  <GIconTrash size={11} />
                  <span>{clearingLogs ? "Clearing..." : "Clear"}</span>
                </button>
              </div>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <GIconSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Filter logs by message or module..."
                className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs bg-black/30 border border-white/10 text-white placeholder-white/30 outline-none focus-stroke focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 focus:shadow-[0_0_14px_rgba(0,145,255,0.28)] transition-all"
              />
            </div>

            {/* Rolling Log Output Viewer */}
            <div
              ref={logsContainerRef}
              className="rounded-xl border border-white/10 bg-slate-950/80 p-3 h-80 overflow-y-auto thin-scroll font-mono text-[11px] space-y-1.5 select-text"
            >
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-white/30 text-xs">
                  No log entries matching filter.
                </div>
              ) : (
                filteredLogs.map((l) => {
                  const badgeColor =
                    l.level === "error"
                      ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                      : l.level === "warn"
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                      : l.level === "debug"
                      ? "text-purple-400 bg-purple-500/10 border-purple-500/30"
                      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

                  return (
                    <div key={l.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-white/30 shrink-0 text-[10px]">
                        {new Date(l.ts).toLocaleTimeString()}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded border text-[9px] uppercase font-bold shrink-0 ${badgeColor}`}
                      >
                        {l.level}
                      </span>
                      <span className="text-accent shrink-0 font-semibold">[{l.module}]</span>
                      <span className="text-white/80 break-all">{l.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Storage Breakdown Tab */}
        {activeTab === "storage" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-sm font-semibold text-white/90">
                Virtual Disk Storage & Allocation
              </h3>
              <p className="text-[11px] text-white/40">
                Telemetry for virtual SSD storage, persistent cache, and user notes.
              </p>
            </div>

            {/* Storage Progress Meter */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Virtual SSD (256 GB)</span>
                <span className="text-white/60">
                  {storageData?.usedGb || 68.4} GB used of {storageData?.totalGb || 256} GB (
                  {storageData?.freeGb || 187.6} GB free)
                </span>
              </div>

              {/* Multi-segment capacity bar */}
              <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden flex p-0.5 border border-white/10">
                {(storageData?.partitions || []).map((part, idx) => (
                  <div
                    key={idx}
                    title={`${part.name}: ${part.sizeGb} GB`}
                    style={{
                      width: `${(part.sizeGb / (storageData?.totalGb || 256)) * 100}%`,
                      backgroundColor: part.color
                    }}
                    className="h-full rounded-sm first:rounded-l-full last:rounded-r-full transition-all duration-500"
                  />
                ))}
              </div>

              {/* Legend & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(storageData?.partitions || []).map((part, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-black/25 border border-white/5 flex items-start gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                      style={{ backgroundColor: part.color }}
                    />
                    <div>
                      <div className="font-semibold text-white text-xs">{part.name}</div>
                      <div className="text-[10px] text-white/40">{part.desc}</div>
                      <div className="font-mono text-xs text-white/80 mt-1">{part.sizeGb} GB</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white/70">CPU Utilization</span>
                  <span className="font-mono text-accent text-sm font-bold">{currentCpu}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${currentCpu}%` }}
                  />
                </div>
                <div className="text-[10px] text-white/40">
                  {sysInfo?.cpu?.model || "Multi-core Virtual Processor"} · {sysInfo?.cpu?.cores || 8} cores
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white/70">Memory (Heap)</span>
                  <span className="font-mono text-emerald-400 text-sm font-bold">{currentMem} MB</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (currentMem / 256) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-white/40">
                  Total Allocated: {sysInfo?.memory?.heapTotalMb || 64} MB
                </div>
              </div>
            </div>

            {/* Sparkline History Chart */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
              <span className="font-medium text-white/80">CPU Activity History (30s)</span>
              <div className="h-28 w-full flex items-end gap-1.5 pt-3">
                {metrics.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full bg-accent/80 hover:bg-accent rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(6, m.cpuPercent)}%` }}
                      title={`${m.cpuPercent}% at ${new Date(m.time).toLocaleTimeString()}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Network & Ping Tab */}
        {activeTab === "network" && (
          <div className="space-y-4">
            {/* Live Traffic Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <div className="text-[10px] text-white/50 uppercase font-mono">Inbound Speed</div>
                <div className="font-mono text-base font-bold text-sky-400">
                  {networkData?.traffic?.rxKbps ?? 14.8} <span className="text-[11px] font-normal text-white/60">KB/s</span>
                </div>
                <div className="text-[10px] text-white/40">
                  Total: {networkData?.traffic?.totalRxMb ?? 1.85} MB
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <div className="text-[10px] text-white/50 uppercase font-mono">Outbound Speed</div>
                <div className="font-mono text-base font-bold text-emerald-400">
                  {networkData?.traffic?.txKbps ?? 9.2} <span className="text-[11px] font-normal text-white/60">KB/s</span>
                </div>
                <div className="text-[10px] text-white/40">
                  Total: {networkData?.traffic?.totalTxMb ?? 1.12} MB
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <div className="text-[10px] text-white/50 uppercase font-mono">Active Sockets</div>
                <div className="font-mono text-base font-bold text-amber-400">
                  {networkData?.traffic?.activeConnections ?? 1} <span className="text-[11px] font-normal text-white/60">clients</span>
                </div>
                <div className="text-[10px] text-white/40">Real-time presence</div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <div className="text-[10px] text-white/50 uppercase font-mono">Server Port</div>
                <div className="font-mono text-base font-bold text-purple-400">
                  :{networkData?.traffic?.httpPort ?? 4000}
                </div>
                <div className="text-[10px] text-white/40 truncate" title={networkData?.traffic?.protocol}>
                  {networkData?.traffic?.protocol ? "HTTP + WS v4" : "HTTP/1.1"}
                </div>
              </div>
            </div>

            {/* Network Adapter Information */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-semibold text-white/90">
                  Host Network Interface &amp; Routing
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-mono">
                  Online
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] text-white/40">Active Interface</div>
                  <div className="font-mono text-white/90 font-medium">
                    {networkData?.primaryInterface?.name || "Ethernet / WLAN"}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] text-white/40">Host IP Address</div>
                  <div className="font-mono text-emerald-400 font-medium">
                    {networkData?.primaryInterface?.address || "127.0.0.1 (Localhost)"}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] text-white/40">MAC Address</div>
                  <div className="font-mono text-white/70 font-medium truncate">
                    {networkData?.primaryInterface?.mac || "00:00:00:00:00:00"}
                  </div>
                </div>
              </div>
            </div>

            {/* Ping & Round-Trip Latency Tool */}
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white">Live Ping Test</h4>
                  <p className="text-[11px] text-white/50">
                    Measure real-time HTTP roundtrip latency between your browser and the Portfolio OS server.
                  </p>
                </div>
                <button
                  onClick={runPingTest}
                  disabled={testingPing}
                  className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-white font-medium transition shadow-lg shadow-accent/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <GIconSignal size={13} />
                  {testingPing ? "Pinging..." : "Test Latency"}
                </button>
              </div>

              {pingLatency !== null && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/20 text-accent font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="font-display font-semibold text-sm">
                      {pingLatency === -1 ? (
                        <span className="text-rose-400">Request timed out</span>
                      ) : (
                        <span className="text-emerald-400">
                          {pingLatency} ms <span className="text-white/40 font-normal text-xs">· Roundtrip</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-white/50">
                      {pingLatency < 50
                        ? "Optimal connection speed — instant reactivity."
                        : pingLatency < 150
                        ? "Good connection latency."
                        : "High latency — standard web performance."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Specs Tab */}
        {activeTab === "specs" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <h4 className="font-display text-sm font-semibold text-white/90">Portfolio OS Environment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white/70">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">OS Mode:</span>
                  <span className="font-medium text-white">{isWin ? "Windows 11 Fluent" : "macOS Sonoma Glass"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Viewport Resolution:</span>
                  <span className="font-mono text-white">
                    {typeof window !== "undefined" ? `${window.innerWidth} × ${window.innerHeight}` : "1920 × 1080"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Host Platform:</span>
                  <span className="text-white">{sysInfo?.os?.platform || "Windows"} ({sysInfo?.os?.arch || "x64"})</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Runtime Engine:</span>
                  <span className="text-white">Node {sysInfo?.node?.version || "v20"} + Express 5 + NestJS</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Frontend Framework:</span>
                  <span className="text-white">React 19 + Vite 8.1 + Tailwind v4</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Audio Synthesizer:</span>
                  <span className="text-white">Web Audio API (Procedural Oscillator)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benchmark Tab */}
        {activeTab === "benchmark" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-accent/40 bg-accent/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white flex items-center gap-2">
                    <GIconThunderbolt size={14} className="text-amber-400" />
                    <span>Kernel Compute & Throughput Stress Benchmark</span>
                  </h4>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Evaluates prime computation speed, JSON serialization throughput, memory delta, and event loop latency.
                  </p>
                </div>
                <button
                  onClick={runBenchmark}
                  disabled={runningBenchmark}
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 text-white text-xs font-semibold shadow-lg shadow-accent/20 transition flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <GIconRotateRight size={14} className={runningBenchmark ? "animate-spin" : ""} />
                  <span>{runningBenchmark ? "Running Stress Test..." : "Run Benchmark"}</span>
                </button>
              </div>

              {benchmarkResult && (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-white/40">Performance Rating</div>
                      <div className="text-lg font-bold font-display text-emerald-400">
                        {benchmarkResult.metrics?.rating || "A+ (Ultra Fast)"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-white/40">Execution Time</div>
                      <div className="font-mono text-base font-bold text-accent">
                        {benchmarkResult.durationMs} ms
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-white/40 mb-1">Computation Rate</div>
                      <div className="font-mono text-sm font-bold text-white">
                        {(benchmarkResult.metrics?.opsPerSec || 0).toLocaleString()}
                      </div>
                      <div className="text-[9px] text-white/30">Ops / second</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-white/40 mb-1">Primes Calculated</div>
                      <div className="font-mono text-sm font-bold text-white">
                        {(benchmarkResult.metrics?.primesCalculated || 0).toLocaleString()}
                      </div>
                      <div className="text-[9px] text-white/30">Range 2 - 25,000</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-white/40 mb-1">JSON Throughput</div>
                      <div className="font-mono text-sm font-bold text-white">
                        {benchmarkResult.metrics?.jsonThroughputMbSec || 0} MB/s
                      </div>
                      <div className="text-[9px] text-white/30">5,000 payload items</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-white/40 mb-1">Memory Delta</div>
                      <div className="font-mono text-sm font-bold text-white">
                        {benchmarkResult.metrics?.memoryDeltaKb || 0} KB
                      </div>
                      <div className="text-[9px] text-white/30">Heap footprint</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-[11px] text-white/60 space-y-1">
                    <div className="text-[10px] font-semibold uppercase text-white/40">Target Server Environment</div>
                    <div>Host Architecture: <span className="text-white font-medium">{benchmarkResult.system?.platform} {benchmarkResult.system?.arch} ({benchmarkResult.system?.cpus} Cores)</span></div>
                    <div>Processor: <span className="text-white font-medium">{benchmarkResult.system?.model}</span></div>
                    <div>Node.js Version: <span className="text-white font-medium">{benchmarkResult.system?.nodeVersion}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
          </>
        )}
      </div>

      
      {/* Endpoint Inspector & Testing Playground Modal */}
      {selectedEndpoint && (
        <div
          className="fixed inset-0 z-[1300] bg-black/70 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (systemSounds) soundFx.playClick();
              setSelectedEndpoint(null);
            }
          }}
        >
          <div className="relative w-full max-w-xl max-h-[88vh] bg-[#0c101d]/98 border border-white/20 rounded-2xl p-4 sm:p-5 shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col space-y-3.5 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      selectedEndpoint.method === "GET"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : selectedEndpoint.method === "POST"
                        ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                        : selectedEndpoint.method === "PUT"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : selectedEndpoint.method === "PATCH"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-white">
                    {selectedEndpoint.path}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/50">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                    {selectedEndpoint.category}
                  </span>
                  <span className="flex items-center gap-1 text-sky-400 font-medium">
                    <GIconLock size={10} />
                    {selectedEndpoint.security || (selectedEndpoint.method === "GET" ? "Public Safe (Live)" : "Sandbox Simulated")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (systemSounds) soundFx.playClick();
                  setSelectedEndpoint(null);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                title="Close Inspector"
              >
                <GIconClose size={14} />
              </button>
            </div>

            {/* Description & Execution Mode */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 text-[11px]">
              <div className="text-white/80 leading-relaxed font-sans">{selectedEndpoint.description}</div>
              <div className="text-[10px] text-white/50 flex items-center gap-1.5">
                <span className="font-semibold text-white/70">Execution Mode:</span>
                {selectedEndpoint.method === "GET" ? (
                  <span className="text-emerald-400">Live Backend Fetch & Latency Measurement</span>
                ) : (
                  <span className="text-sky-400">Isolated Sandbox State Transition (Protected Demo Mode)</span>
                )}
              </div>
            </div>

            {/* Request URL & Editable Payload for mutating methods */}
            <div className="space-y-2 overflow-y-auto thin-scroll pr-1">
              <div>
                <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1">
                  Target Endpoint URL
                </label>
                <div className="p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-white/90 break-all select-all">
                  {API_URL}{selectedEndpoint.path}
                </div>
              </div>

              {selectedEndpoint.method !== "GET" && selectedEndpoint.samplePayload && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                      Request Body (JSON Payload)
                    </label>
                    <button
                      onClick={() => {
                        if (selectedEndpoint.samplePayload) {
                          setInspectPayloadText(JSON.stringify(selectedEndpoint.samplePayload, null, 2));
                        }
                      }}
                      className="text-[10px] text-accent hover:underline cursor-pointer"
                    >
                      Reset to Sample
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={inspectPayloadText}
                    onChange={(e) => setInspectPayloadText(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 font-mono text-[11px] text-white outline-none focus-stroke focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 transition-all resize-y"
                  />
                </div>
              )}

              {/* Execution Action Button */}
              <div className="pt-1 flex items-center justify-between gap-3">
                <button
                  onClick={runInspectorTest}
                  disabled={inspecting}
                  className="flex-1 py-2 px-4 rounded-xl bg-accent hover:bg-accent/90 active:scale-98 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-accent/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <GIconPlay size={13} className={inspecting ? "animate-spin" : ""} />
                  <span>
                    {inspecting
                      ? "Executing Request..."
                      : selectedEndpoint.method === "GET"
                      ? "Send Live Request"
                      : "Run Sandbox Execution"}
                  </span>
                </button>
              </div>

              {/* Response Panel */}
              {inspectResponse && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                        Response Body
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          inspectResponse.ok
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {inspectResponse.status}
                      </span>
                      <span className="text-[10px] font-mono text-white/50">
                        {inspectResponse.latency} ms
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(inspectResponse.data, null, 2));
                        setCopiedResponse(true);
                        setTimeout(() => setCopiedResponse(false), 2000);
                      }}
                      className="text-[10px] text-white/60 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 transition cursor-pointer"
                    >
                      {copiedResponse ? (
                        <>
                          <GIconCheck size={11} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <GIconCopy size={11} />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[10px] text-emerald-300/90 overflow-x-auto thin-scroll max-h-48 whitespace-pre leading-relaxed select-text">
                    {JSON.stringify(inspectResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer bar */}
      <div className="border-t border-white/10 px-3 sm:px-4 py-2 bg-white/5 flex items-center justify-between text-[11px] text-white/40">
        <span>Portfolio OS Kernel v2.4</span>
        <span className="font-mono text-emerald-400/80 flex items-center gap-1.5">
          <span>Status: Healthy</span>
        </span>
      </div>
    </div>
  );
}
