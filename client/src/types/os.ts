export type OSMode = "mac" | "win";

export type ThemeMode = "night" | "light";

export type DockPosition = "bottom" | "left" | "right";

export type SnapLayout = "left" | "right" | "top" | "center" | "fullscreen";

export interface WindowState {
  id: string;
  app: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
  snapState?: "left" | "right" | "top" | "bottom" | null;
  z: number;
}

export interface AppMetadata {
  title: string;
  w: number;
  h: number;
}

export interface AccentColor {
  name: string;
  value: string;
}

export interface WallpaperOption {
  id: string;
  name: string;
}

export interface WeatherLocation {
  name: string;
  lat: number;
  lon: number;
}

export type ToastVariant = "add" | "delete" | "update" | "success" | "info" | "warning";

export interface SystemNotification {
  id: number | string;
  title: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ProjectItem {
  id: string;
  title: string;
  stack: string[];
  category: string;
  year: string;
  cover: string;
  summary: string;
  highlights: string[];
  links: {
    repo: string;
    live: string;
  };
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  color?: string;
  pending?: boolean;
  failed?: boolean;
}
