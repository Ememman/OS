// A lightweight virtual filesystem powering the Files app.
// Folders contain children; files either show inline text or deep-link to another app.

export type FileNode =
  | { name: string; type: "folder"; children: FileNode[]; isDefault?: boolean; readOnly?: boolean }
  | { name: string; type: "app-link"; app: string; isDefault?: boolean; readOnly?: boolean }
  | { name: string; type: "text"; content: string; isDefault?: boolean; readOnly?: boolean; size?: string };

export type FileItem = FileNode & {
  id?: string;
  isCustom?: boolean;
  size?: string;
  updatedAt?: number;
};
export type FolderNode = Extract<FileNode, { type: "folder" }>;

export const fileTree: FolderNode = {
  name: "Root",
  type: "folder",
  isDefault: true,
  readOnly: true,
  children: [
    {
      name: "Projects",
      type: "folder",
      isDefault: true,
      readOnly: true,
      children: [
        { name: "SandreaLee Salon — Mobile Application.link", type: "app-link", app: "library", isDefault: true, readOnly: true },
        { name: "SandreaLee Salon — Website.link", type: "app-link", app: "library", isDefault: true, readOnly: true },
        { name: "SandreaLee Salon — Admin Dashboard.link", type: "app-link", app: "library", isDefault: true, readOnly: true },
        { name: "Straive IMS.link", type: "app-link", app: "library", isDefault: true, readOnly: true }
      ]
    },
    {
      name: "Gallery",
      type: "folder",
      isDefault: true,
      readOnly: true,
      children: [
        { name: "Images", type: "app-link", app: "gallery", isDefault: true, readOnly: true },
        { name: "Videos", type: "app-link", app: "gallery", isDefault: true, readOnly: true }
      ]
    },
    {
      name: "Games",
      type: "folder",
      isDefault: true,
      readOnly: true,
      children: [
        { name: "Minesweeper Retro.exe", type: "app-link", app: "games", isDefault: true, readOnly: true },
        { name: "Blast It!.exe", type: "app-link", app: "games", isDefault: true, readOnly: true },
        { name: "2048 Puzzle.exe", type: "app-link", app: "games", isDefault: true, readOnly: true },
        { name: "Snake Retro.exe", type: "app-link", app: "games", isDefault: true, readOnly: true },
      ]
    },
    {
      name: "CodePlay.app",
      type: "app-link",
      app: "codeplay",
      isDefault: true,
      readOnly: true
    },
    {
      name: "Terminal.sh",
      type: "app-link",
      app: "terminal",
      isDefault: true,
      readOnly: true
    },
    {
      name: "Notes.app",
      type: "app-link",
      app: "notes",
      isDefault: true,
      readOnly: true
    },
    {
      name: "Calculator.app",
      type: "app-link",
      app: "calculator",
      isDefault: true,
      readOnly: true
    },
    {
      name: "Music",
      type: "folder",
      isDefault: true,
      readOnly: true,
      children: [{ name: "Now Playing.link", type: "app-link", app: "music", isDefault: true, readOnly: true }]
    },
    {
      name: "About_Emman.txt",
      type: "text",
      isDefault: true,
      readOnly: true,
      content:
        "Emman Mendoza\nFull-stack developer based in Manila, Philippines.\n\nWorks across the MERN stack, React Native/Expo, and PHP MVC — mobile apps, admin dashboards, and backend systems. Currently building out the SandreaLee Salon ecosystem and maintaining Straive IMS."
    },
    {
      name: "Skills.txt",
      type: "text",
      isDefault: true,
      readOnly: true,
      content:
        "React · React Native / Expo · Node.js · Express · NestJS · MongoDB\nPHP (MVC) · MySQL · Socket.IO · Tailwind CSS · REST APIs · TypeScript"
    },
    { name: "MendozaJamesEmmanuelCV.pdf", type: "app-link", app: "pdf-viewer", isDefault: true, readOnly: true },
    { name: "resume.pdf", type: "app-link", app: "pdf-viewer", isDefault: true, readOnly: true },
    {
      name: "README.md",
      type: "text",
      isDefault: true,
      readOnly: true,
      content:
        "This portfolio runs as a desktop-style OS — windows, a dock/taskbar, live widgets, code playground, and a real-time guest chat.\n\nSwitch between macOS and Windows 11 styles anytime from Settings."
    }
  ]
};
