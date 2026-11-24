import {
  GIconTerminal,
  GIconNotes,
  GIconCalculator,
  GIconUpdates,
  GIconChats,
  GIconGallery,
  GIconGames,
  GIconFiles,
  GIconSettings,
  GIconResume,
  GIconActivity,
  GIconBookOpen,
  GIconCode,
  GIconFileText,
  GIconLibrary,
  GIconMusic,
  GIconSafari,
} from "../components/icons/GravityIcons";
import type { ComponentType } from "react";

export interface AppItemInfo {
  app: string;
  label: string;
  icon: ComponentType<any>;
  color: string;
}

export const APP_ITEMS: AppItemInfo[] = [
  { app: "browser", label: "Safari", icon: GIconSafari, color: "#0091ff" },
  { app: "terminal", label: "Terminal", icon: GIconTerminal, color: "#22c55e" },
  { app: "codeplay", label: "CodePlay", icon: GIconCode, color: "#38bdf8" },
  { app: "notes", label: "Notes", icon: GIconNotes, color: "#f59e0b" },
  { app: "calculator", label: "Calculator", icon: GIconCalculator, color: "#06b6d4" },
  { app: "activity", label: "Activity Monitor", icon: GIconActivity, color: "#10b981" },
  { app: "guestbook", label: "Guestbook", icon: GIconBookOpen, color: "#8b5cf6" },
  { app: "library", label: "Library", icon: GIconLibrary, color: "#5BB8B0" },
  { app: "music", label: "Music", icon: GIconMusic, color: "#D9678C" },
  { app: "updates", label: "Updates", icon: GIconUpdates, color: "#5FBF7C" },
  { app: "chats", label: "Chats", icon: GIconChats, color: "#8E7BE0" },
  { app: "gallery", label: "Gallery", icon: GIconGallery, color: "#B8C25A" },
  { app: "games", label: "Games", icon: GIconGames, color: "#D98A4E" },
  { app: "files", label: "Files", icon: GIconFiles, color: "#E0B84E" },
  { app: "settings", label: "Settings", icon: GIconSettings, color: "#8892A6" },
  { app: "resume", label: "Resume", icon: GIconResume, color: "#4B5A73" },
  { app: "pdf-viewer", label: "PDF Viewer", icon: GIconFileText, color: "#f43f5e" },
];

export const APP_ITEMS_MAP: Record<string, AppItemInfo> = Object.fromEntries(
  APP_ITEMS.map((item) => [item.app, item])
);
