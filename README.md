# Portfolio OS — Interactive Web Desktop Experience

A modern, highly interactive web operating system and developer portfolio engineered with **React, TypeScript, Vite, Tailwind CSS, and Framer Motion** on the frontend, powered by an **Express and Socket.IO** backend.

Portfolio OS delivers a desktop-grade user experience with draggable/resizable windows, dual desktop interface styles (macOS & Windows 11), a rich ecosystem of built-in applications, interactive games, live widgets, and real-time multiplayer features.

---

## 🌟 Key Features & Highlights

### 🖥️ Dual Desktop Interfaces & Experience Switcher
* **Interactive Boot & OS Picker**: Choose your desktop paradigm on boot:
  * **macOS Style**: Top menu bar with functional dropdowns, floating bottom dock with magnification effect, and classic traffic-light window controls (`red/yellow/green`).
  * **Windows 11 Style**: Centered taskbar with pinned apps, system tray with expandable flyouts, start menu, and native squared window controls.
* **On-the-Fly Switching**: Instantly switch between macOS and Windows 11 paradigms at any time via the Menu Bar, Taskbar, Control Center, or Settings without reloading the page.
* **Full Power Management**:
  * **Shut Down**: Halts system processes and transitions to a power-off state with a one-click reboot button.
  * **Restart / Clean Reboot**: Flushes session states and performs a clean reboot sequence.
  * **Sleep / Lock Screen**: Dims screen until next click or keypress.

### 🪟 Advanced Window Management System
* **Draggable & Resizable**: Natural physics, fluid dragging, corner/edge resizing, and edge constraints powered by `framer-motion`.
* **Window Snapping & Layouts**: Hover over the maximize button to access snap layout flyouts (Left Half, Right Half, Top Half, Center Stage, and Fullscreen).
* **Double-Click Titlebar**: Instantly maximize or restore window bounds.
* **Genie Minimize Animation**: Windows smoothly minimize into their respective dock or taskbar slot with running status pips.
* **Z-Index Layering**: Automatic window focusing, elevation, and click-to-front management.
* **Mobile-Adaptive Windowing**: Automatically expands windows edge-to-edge on smartphones and tablets, disabling dragging/resizing collisions for optimal touch usability.

### 🎨 Design System, Motion & Audio
* **Glassmorphism 2.0**: Frosted glass surfaces with customizable transparency (`--glass-alpha`), subtle specular borders, and high-performance backdrop filters.
* **Calibrated Default System Accent**: Modern Electric Blue accent (`#3b82f6` / `#2563eb`) with dedicated styling for **Active**, **Hovering**, and **Clicking** (`:active`) micro-interactions.
* **Framer Motion Micro-Interactions**: Smooth spring animations across modals, tooltips, dock magnification, window state transitions, and icon presses.
* **Synthesized Web Audio System (`soundFx.ts`)**: Built-in sound effects (clicks, pops, snaps, minimize, power-down) generated dynamically via Web Audio API—zero external audio file dependencies.
* **Interactive Particle Background**: Subtle canvas particle constellation field with proximity connections that can be toggled in Control Center.

---

## 📱 Built-In Applications

| Application | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Library (Projects)** | Interactive software portfolio & case studies | Search, category filtering (Web, Mobile, Full-Stack, Tools), tech stack badges, live demo links, architecture highlights, and screenshot modals. |
| **CodePlay** | Sandboxed in-browser code playground | Multi-language code editor with pre-loaded templates (React, TypeScript, HTML/CSS/JS, Python, Tailwind), live runner, and console log output. |
| **Chats** | Real-time live guest chatroom | Anonymous Socket.IO messaging with live presence count, 5 distinct themes (*Midnight Dark*, *Evening Slate*, *Soft Paper*, *Notebook*, *Warm Neutral*), message quotes, replies, emoji reactions, pin message, chat transcript export, font-size scaler (A-/A+), and offline **Portfolio Bot** fallback. |
| **Terminal** | Interactive UNIX-style shell | Features command auto-complete, command history navigation (Up/Down arrows), `neofetch` / `specs`, `weather`, `matrix`, `cowsay`, `open <app>`, `clear`, and `help`. |
| **Notes** | Persistent Markdown note-taking app | Create, edit, pin, search, delete, and export markdown notes with local storage persistence. |
| **Calculator** | Standard desktop calculator | Full arithmetic, keyboard numeric entry support, and calculation history audit roll. |
| **Activity Monitor** | Task manager & system telemetry | Real-time CPU usage chart, memory pressure, active process list with process kill capability, and server health diagnostics. |
| **Guestbook** | Digital visitor ledger | Leave signed messages, feedback, and greetings backed by the backend API and local storage. |
| **Games** | Retro arcade suite | Includes **Block Blast** (8x8 block puzzle with combo clears, audio synthesis, and board shake), **2048** (tile slider with high-score tracking), and **Snake Retro** (classic arcade snake). |
| **Music Player** | Streaming audio player & visualizer | Dual-mode search: iTunes 30-second previews and full-length YouTube streaming. Features real-time Web Audio API frequency visualizer, and persistent background playback with a floating **MiniPlayer**. |
| **Resume** | Interactive curriculum vitae | Professional summary, work experience timeline, technical skills, education, and direct PDF resume download button. |
| **Settings** | Central OS configuration center | Configure desktop mode, dock position (bottom/left/right), wallpapers, glass opacity, sound effects, particle field, motion reduction, and weather location. |

---

## 🛠️ System Utilities & Navigation

* **Spotlight Global Search (`⌘K` / `Ctrl+K`)**: Rapidly search and launch applications, trigger system commands, open settings, or switch operating modes from anywhere.
* **Mission Control (`F3` / `⌘M`)**: Exposé-style birds-eye view displaying all active open windows with instant focus switching.
* **macOS Desktop Widgets**: Floating modular widgets including Photo Frame, Live Weather Forecast, Dual Clock (Analog + Digital), Agenda / Interactive Calendar, Sticky Notes, and Quick-Launch Shortcut Tiles.
* **Control Center & Quick Settings**: Fast-access slide-out panel for Wi-Fi status, API gateway health, glass intensity slider, audio mute, particles toggle, and media player controls.
* **Desktop Context Menu**: Right-click anywhere on the desktop to open Spotlight, launch apps, toggle widgets, change wallpapers, or switch OS style.

---

## 📂 Project Architecture

```
PROJ/OS/
├── client/                     # Frontend Application (React + Vite + Tailwind v4)
│   ├── public/                 # Static assets (audio, wallpapers, resume.pdf)
│   ├── src/
│   │   ├── components/         # Core UI components
│   │   │   ├── apps/           # Application windows (Library, Chats, CodePlay, etc.)
│   │   │   │   └── games/      # Arcade games (BlockBlast, Game2048, SnakeRetro)
│   │   │   ├── icons/          # Icon library wrappers (Gravity UI & Lucide)
│   │   │   ├── widgets/        # Desktop widgets (Weather, Clock, Agenda, Notes)
│   │   │   ├── win/            # Windows 11 components (WinTaskbar, StartMenu, Tray)
│   │   │   ├── Dock.tsx        # macOS magnification dock
│   │   │   ├── MenuBar.tsx     # macOS top menu bar
│   │   │   ├── Window.tsx      # Window frame, drag, resize, snap layouts
│   │   │   ├── ControlCenter.tsx
│   │   │   ├── SpotlightSearch.tsx
│   │   │   ├── MissionControl.tsx
│   │   │   └── OsPicker.tsx    # OS selection screen on boot
│   │   ├── data/               # Static data (music, projects, resume, code templates)
│   │   ├── lib/                # Utility helpers (socket, soundFx, colorHarmonizer, runner)
│   │   ├── store/              # Global state management (Zustand: useOS, usePlayer)
│   │   ├── types/              # TypeScript interfaces and types
│   │   ├── App.tsx             # Root desktop orchestrator
│   │   └── index.css           # Tailwind v4 styles, themes, and glassmorphic variables
│   ├── package.json
│   └── vite.config.ts
│
└── server/                     # Backend API & WebSocket Service (Node.js + Express)
    ├── index.js                # Express REST endpoints, YouTube API proxy, Socket.IO
    ├── package.json
    └── .env.example
```

---

## 🚀 Installation & Local Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher (or pnpm / yarn)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/portfolio-os.git
cd portfolio-os
```

### 2. Configure & Run Backend Server
```bash
cd server

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start development server (runs on http://localhost:4000)
npm run dev
```

### 3. Configure & Run Frontend Client
In a separate terminal:
```bash
cd client

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## ⚙️ Configuration & Environment Variables

### Server Configuration (`server/.env`)
Create a `.env` file in the `server/` directory:

```env
# Port for the Express & Socket.IO server
PORT=4000

# Allowed Frontend Origins for CORS & Socket.IO
CLIENT_URL=http://localhost:5173

# Optional: YouTube Data API v3 Key (for full-length music search in the Music app)
# Get a free key at: https://console.cloud.google.com/apis/library/youtube.googleapis.com
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Client Configuration (`client/.env`)
Create a `.env` file in the `client/` directory:

```env
# Backend API URL (Socket.IO and REST endpoints)
VITE_API_URL=http://localhost:4000
```

---

## 🛠️ Personalization & Customization Guide

### 1. Replacing the Resume PDF
* Place your resume PDF in `client/public/resume.pdf`.
* Customize your employment history, bio, and technical proficiencies in [`client/src/data/resume.ts`](file:///c:/Users/Admin/PROJ/OS/client/src/data/resume.ts).

### 2. Updating Showcase Projects
* Edit [`client/src/data/projects.ts`](file:///c:/Users/Admin/PROJ/OS/client/src/data/projects.ts) to add or modify your projects, descriptions, screenshots, GitHub repositories, and live URLs.

### 3. Adding Custom Wallpapers
* Drop wallpaper images into `client/public/wallpapers/`.
* Register wallpaper options in [`client/src/store/useOS.ts`](file:///c:/Users/Admin/PROJ/OS/client/src/store/useOS.ts) under the `WALLPAPERS` array and in [`client/src/components/Wallpaper.tsx`](file:///c:/Users/Admin/PROJ/OS/client/src/components/Wallpaper.tsx).

### 4. Customizing Music Playlists
* Replace audio files in `client/public/audio/`.
* Update default ambient track lists and metadata in [`client/src/data/music.ts`](file:///c:/Users/Admin/PROJ/OS/client/src/data/music.ts).

### 5. Configuring Full-Song YouTube Search
1. Visit [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **YouTube Data API v3**.
3. Generate an API Key under **Credentials**.
4. Paste the key into `server/.env` as `YOUTUBE_API_KEY=your_key`.
5. Restart the backend server. Full songs can now be searched and played inline directly inside the Music app!

---

## 🧪 Production Build & Deployment

### Build the Frontend
```bash
cd client
npm run build
```
This generates an optimized static bundle in `client/dist/`.

### Deployment Options
* **Frontend**: Deploy `client/dist` to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).
  * Remember to set `VITE_API_URL` to your production backend URL.
* **Backend**: Deploy `server/` to a Node.js-compatible host supporting WebSockets (Railway, Render, Fly.io, DigitalOcean, Heroku).
  * Set `CLIENT_URL` to your production frontend domain to ensure CORS and Socket.IO handshakes succeed.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
