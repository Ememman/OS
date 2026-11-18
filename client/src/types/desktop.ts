import type { ComponentType } from "react";
import {
  GIconResume,
  GIconGames,
  GIconCode,
  GIconTerminal,
  GIconNotes,
  GIconCalculator,
  GIconActivity,
  GIconBookOpen,
  GIconLibrary,
  GIconMusic,
  GIconUpdates,
  GIconChats,
  GIconGallery,
  GIconFiles,
  GIconSettings,
  GIconFileText,
  GIconSafari,
} from "../components/icons/GravityIcons";

export interface DesktopAppItem {
  id: string; // e.g. "app-resume"
  type: "app";
  app: string; // registered app id e.g. "resume"
  label: string; // display name e.g. "Resume"
  color: string; // accent tint e.g. "#4B5A73"
  x?: number; // custom desktop X position in px
  y?: number; // custom desktop Y position in px
  lastSafeX?: number; // last position outside the widget area
  lastSafeY?: number; // last position outside the widget area
  widgetZoneX?: number; // position within widget area when widgets were hidden
  widgetZoneY?: number; // position within widget area when widgets were hidden
}

export interface DesktopFolderItem {
  id: string; // e.g. "folder-1794464109846"
  type: "folder";
  name: string; // e.g. "Featured"
  badge?: number; // optional badge count
  apps: DesktopAppItem[]; // nested apps
  x?: number; // custom desktop X position in px
  y?: number; // custom desktop Y position in px
  lastSafeX?: number; // last position outside the widget area
  lastSafeY?: number; // last position outside the widget area
  widgetZoneX?: number; // position within widget area when widgets were hidden
  widgetZoneY?: number; // position within widget area when widgets were hidden
}

export type DesktopItem = DesktopAppItem | DesktopFolderItem;

export interface AppDefinition {
  label: string;
  icon: ComponentType<{ size?: number; className?: string; color?: string }>;
  color: string;
  desc?: string;
}

export const APP_REGISTRY: Record<string, AppDefinition> = {
  resume: { label: "Resume", icon: GIconResume, color: "#4B5A73", desc: "Full work experience & profile" },
  games: { label: "Games", icon: GIconGames, color: "#D98A4E", desc: "Retro arcade & puzzle games" },
  codeplay: { label: "CodePlay", icon: GIconCode, color: "#38bdf8", desc: "Interactive developer sandbox" },
  terminal: { label: "Terminal", icon: GIconTerminal, color: "#22c55e", desc: "Interactive command shell" },
  notes: { label: "Notes", icon: GIconNotes, color: "#f59e0b", desc: "Markdown persistent editor" },
  calculator: { label: "Calculator", icon: GIconCalculator, color: "#06b6d4", desc: "Scientific calculator" },
  activity: { label: "Activity", icon: GIconActivity, color: "#10b981", desc: "System monitor & processes" },
  guestbook: { label: "Guestbook", icon: GIconBookOpen, color: "#8b5cf6", desc: "Real-time visitor ledger" },
  library: { label: "Library", icon: GIconLibrary, color: "#5BB8B0", desc: "Portfolio projects showcase" },
  music: { label: "Music", icon: GIconMusic, color: "#D9678C", desc: "Lo-Fi ambient audio player" },
  updates: { label: "Updates", icon: GIconUpdates, color: "#5FBF7C", desc: "Live GitHub releases & feed" },
  chats: { label: "Chats", icon: GIconChats, color: "#8E7BE0", desc: "Comic-styled guest chat room" },
  gallery: { label: "Gallery", icon: GIconGallery, color: "#B8C25A", desc: "Showcase photography & images" },
  files: { label: "Files", icon: GIconFiles, color: "#E0B84E", desc: "Virtual filesystem explorer" },
  settings: { label: "Settings", icon: GIconSettings, color: "#8892A6", desc: "System preferences & theme" },
  "pdf-viewer": { label: "PDF Viewer", icon: GIconFileText, color: "#f43f5e", desc: "PDF Document Reader" },
  browser: { label: "Safari", icon: GIconSafari, color: "#0091ff", desc: "Web Browser & Search" },
};

export const DEFAULT_DESKTOP_ITEMS: DesktopItem[] = [
  {
    id: "file-resume-cv",
    type: "app",
    app: "pdf-viewer",
    label: "MendozaJamesEmmanuelCV.pdf",
    color: "#f43f5e",
  },
  {
    id: "app-games",
    type: "app",
    app: "games",
    label: "Games",
    color: "#D98A4E",
  },
  {
    id: "app-chats",
    type: "app",
    app: "chats",
    label: "Chats",
    color: "#8E7BE0",
  },
  {
    id: "app-terminal",
    type: "app",
    app: "terminal",
    label: "Terminal",
    color: "#22c55e",
  },
];
