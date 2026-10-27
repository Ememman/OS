// A lightweight virtual filesystem powering the Files app.
// Folders contain children; files either show inline text or deep-link to another app.

export type FileNode =
  | { name: string; type: "folder"; children: FileNode[] }
  | { name: string; type: "app-link"; app: string }
  | { name: string; type: "text"; content: string };

export type FolderNode = Extract<FileNode, { type: "folder" }>;

export const fileTree: FolderNode = {
  name: "Root",
  type: "folder",
  children: [
    {
      name: "Projects",
      type: "folder",
      children: [
        { name: "SandreaLee Salon — Customer App.link", type: "app-link", app: "library" },
        { name: "SandreaLee Salon — Staff App.link", type: "app-link", app: "library" },
        { name: "SandreaLee Salon — Admin Dashboard.link", type: "app-link", app: "library" },
        { name: "Straive IMS.link", type: "app-link", app: "library" }
      ]
    },
    {
      name: "Gallery",
      type: "folder",
      children: [
        { name: "Images", type: "app-link", app: "gallery" },
        { name: "Videos", type: "app-link", app: "gallery" }
      ]
    },
    {
      name: "Games",
      type: "folder",
      children: [{ name: "Blast It!.exe", type: "app-link", app: "games" }]
    },
    {
      name: "Terminal.sh",
      type: "app-link",
      app: "terminal"
    },
    {
      name: "Notes.app",
      type: "app-link",
      app: "notes"
    },
    {
      name: "Calculator.app",
      type: "app-link",
      app: "calculator"
    },
    {
      name: "Music",
      type: "folder",
      children: [{ name: "Now Playing.link", type: "app-link", app: "music" }]
    },
    {
      name: "About_Bron.txt",
      type: "text",
      content:
        "Bron Mendoza\nFull-stack developer based in Manila, Philippines.\n\nWorks across the MERN stack, React Native/Expo, and PHP MVC — mobile apps, admin dashboards, and backend systems. Currently building out the SandreaLee Salon ecosystem and maintaining Straive IMS."
    },
    {
      name: "Skills.txt",
      type: "text",
      content:
        "React · React Native / Expo · Node.js · Express · MongoDB\nPHP (MVC) · MySQL · Socket.IO · Tailwind CSS · REST APIs"
    },
    { name: "resume.pdf", type: "app-link", app: "resume" },
    {
      name: "README.md",
      type: "text",
      content:
        "This portfolio runs as a desktop-style OS — windows, a dock/taskbar, live widgets, and a real-time guest chat.\n\nSwitch between macOS and Windows 11 styles anytime from Settings."
    }
  ]
};
