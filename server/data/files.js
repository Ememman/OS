/**
 * Portfolio OS Virtual Cloud Drive Initial Files
 */
export const initialCloudFiles = [
  {
    id: "file-about",
    name: "About_Bron.txt",
    path: "/",
    type: "text",
    size: 264,
    mimeType: "text/plain",
    content: "Bron Mendoza\nFull-stack developer based in Manila, Philippines.\n\nWorks across the MERN stack, React Native/Expo, and PHP MVC — mobile apps, admin dashboards, and backend systems. Currently building out the SandreaLee Salon ecosystem and maintaining Straive IMS.",
    updatedAt: Date.now() - 86400000 * 3,
    readOnly: true
  },
  {
    id: "file-skills",
    name: "Skills.txt",
    path: "/",
    type: "text",
    size: 148,
    mimeType: "text/plain",
    content: "React · React Native / Expo · Node.js · Express · NestJS · MongoDB\nPHP (MVC) · MySQL · Socket.IO · Tailwind CSS · REST APIs · TypeScript",
    updatedAt: Date.now() - 86400000 * 3,
    readOnly: true
  },
  {
    id: "file-architecture",
    name: "System_Architecture.md",
    path: "/docs",
    type: "markdown",
    size: 512,
    mimeType: "text/markdown",
    content: "# Portfolio OS Architecture\n\n- **Client**: React 19 + TypeScript + Tailwind CSS v4 + Framer Motion\n- **Backend**: Express 5 + NestJS 12 Parity + Socket.IO v4\n- **Real-Time**: Full bidirectional event sync for Chat, Guestbook, Files, Leaderboard, and Diagnostics",
    updatedAt: Date.now() - 86400000 * 1,
    readOnly: false
  },
  {
    id: "file-manifest",
    name: "os-manifest.json",
    path: "/system",
    type: "json",
    size: 320,
    mimeType: "application/json",
    content: JSON.stringify({
      osName: "Portfolio OS",
      kernelVersion: "3.2.0-lts",
      theme: "midnight-frosted",
      capabilities: ["window-manager", "socket-sync", "arcade-engine", "audio-synthesizer", "cloud-fs"]
    }, null, 2),
    updatedAt: Date.now() - 86400000 * 2,
    readOnly: true
  }
];
