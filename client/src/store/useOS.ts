import { create } from "zustand";
import { soundFx } from "../lib/soundFx";
import type {
  AccentColor,
  AppMetadata,
  DockPosition,
  OSMode,
  SnapLayout,
  SystemNotification,
  ThemeMode,
  ToastVariant,
  WallpaperOption,
  WeatherLocation,
  WindowState,
} from "../types/os";
import {
  harmonizeAccentColor,
  applyHarmonizedPaletteToDoc,
  type HarmonizedPalette,
} from "../lib/colorHarmonizer";

interface OSState {
  windows: WindowState[];
  accent: string;
  wallpaper: string;
  reduceMotion: boolean;
  photoUrl: string;
  setPhotoUrl: (url: string) => void;
  weatherLoc: WeatherLocation;
  setWeatherLoc: (loc: WeatherLocation) => void;
  chatSound: boolean;
  toggleChatSound: () => void;
  systemSounds: boolean;
  toggleSystemSounds: () => void;
    notification: SystemNotification | null;
  notifications: SystemNotification[];
  notify: (title: string, message: string, variant?: ToastVariant, durationMs?: number) => void;
  dismissNotification: (id?: number | string) => void;
  chatBg: string;
  setChatBg: (id: string) => void;
  glassAlpha: number;
  setGlassAlpha: (value: number) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  harmonizedPalette: HarmonizedPalette;
  accents: AccentColor[];
  wallpapers: WallpaperOption[];
  booted: boolean;
  osChosen: boolean;
  osMode: OSMode;
  finishBoot: () => void;
  chooseOs: (mode: OSMode) => void;
  setOsMode: (mode: OSMode) => void;
  reopenPicker: () => void;
  isPoweredOff: boolean;
  powerOff: () => void;
  powerOn: () => void;
  restart: () => void;
  isSleeping: boolean;
  setSleeping: (sleep: boolean) => void;
  particlesEnabled: boolean;
  toggleParticles: () => void;
  widgetsVisible: boolean;
  toggleWidgets: () => void;
  nightShift: boolean;
  toggleNightShift: () => void;
  controlCenterOpen: boolean;
  toggleControlCenter: () => void;
  closeControlCenter: () => void;
  missionControlOpen: boolean;
  toggleMissionControl: () => void;
  closeMissionControl: () => void;
  snapWindow: (id: string, layout: SnapLayout) => void;
  closeAllWindows: () => void;
  minimizeAllWindows: () => void;
  spotlightOpen: boolean;
  openSpotlight: () => void;
  closeSpotlight: () => void;
  toggleSpotlight: () => void;
  powerDialogOpen: boolean;
  openPowerDialog: () => void;
  closePowerDialog: () => void;
  togglePowerDialog: () => void;
  resetDefaults: () => void;
  compact: boolean;
  toggleCompact: () => void;
  dockPosition: DockPosition;
  setDockPosition: (pos: DockPosition) => void;
  windowIndicators: boolean;
  toggleWindowIndicators: () => void;
  unreadChatCount: number;
  incrementUnreadChat: () => void;
  setUnreadChatCount: (count: number) => void;
  clearUnreadChat: () => void;
  setAccent: (value: string) => void;
  setWallpaper: (id: string) => void;
  toggleMotion: () => void;
  openApp: (app: string) => void;
  toggleApp: (app: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  requestMinimize: (id: string) => void;
  minimizingWindowId: string | null;
  dockApps: string[];
  reorderDockApps: (fromApp: string, toApp: string) => void;
  resetDockApps: () => void;
  toggleMaximize: (id: string) => void;
  toggleShowDesktop: () => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, w: number, h: number) => void;
}

export const DEFAULT_DOCK_APPS = [
  "terminal",
  "codeplay",
  "notes",
  "calculator",
  "activity",
  "guestbook",
  "library",
  "music",
  "updates",
  "chats",
  "gallery",
  "games",
  "files",
  "settings",
  "resume",
];

export const APPS: Record<string, AppMetadata> = {
  library: { title: "Library", w: 860, h: 580 },
  music: { title: "Music", w: 760, h: 520 },
  terminal: { title: "Terminal", w: 740, h: 480 },
  calculator: { title: "Calculator", w: 395, h: 635 },
  notes: { title: "Notes", w: 780, h: 540 },
  activity: { title: "Activity Monitor", w: 780, h: 540 },
  guestbook: { title: "Guestbook", w: 820, h: 560 },
  codeplay: { title: "CodePlay Sandbox", w: 840, h: 560 },
  updates: { title: "Updates", w: 680, h: 640 },
  chats: { title: "Chats", w: 460, h: 640 },
  gallery: { title: "Gallery", w: 880, h: 600 },
  games: { title: "Games", w: 880, h: 700 },
  files: { title: "Files", w: 780, h: 540 },
  settings: { title: "Settings", w: 640, h: 520 },
  resume: { title: "Resume", w: 820, h: 740 },
};

const DEFAULT_ACCENT = "59 130 246"; // System Electric Blue calibrated for active, click, and hover

const ACCENTS = [
  { name: "System Blue", value: "59 130 246" },
];

const WALLPAPERS = [
  // Your custom images
  { id: "bg1", name: "Balloon Sunset" },
  { id: "bg2", name: "Cyborg Dark" },
  { id: "bg3", name: "Balloon Night" },
  // Existing wallpapers
  { id: "ocean", name: "Night Ocean & Balloon" },
  { id: "galaxy", name: "Deep Galaxy" },
  { id: "aurora", name: "Aurora Coast" },
];

const savedDockPosition = localStorage.getItem("os_dock_position");
const dockPosition: DockPosition =
  savedDockPosition === "left" || savedDockPosition === "right"
    ? savedDockPosition
    : "bottom";

if (typeof window !== "undefined") {
  localStorage.removeItem("os_theme_mode");
  localStorage.removeItem("os_accent");
}

const savedThemeMode: ThemeMode = "night";
const initialAccentValue = DEFAULT_ACCENT;
const initialPalette = harmonizeAccentColor(initialAccentValue, true);

if (typeof document !== "undefined") {
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.classList.remove("light-theme");
  document.documentElement.classList.add("dark-theme");
  applyHarmonizedPaletteToDoc(initialPalette, true);
}

let z = 10;

export const useOS = create<OSState>((set, get) => ({
  windows: [],
  themeMode: savedThemeMode,
  harmonizedPalette: initialPalette,
  accent: DEFAULT_ACCENT,
  wallpaper: localStorage.getItem("os_wallpaper") || "bg1",
  reduceMotion: localStorage.getItem("os_motion") === "off",
  photoUrl: localStorage.getItem("os_photo") || "",
  setPhotoUrl: (url) => {
    localStorage.setItem("os_photo", url);
    set({ photoUrl: url });
  },
  weatherLoc: JSON.parse(localStorage.getItem("os_weather_loc") || "null") || {
    name: "Manila",
    lat: 14.5995,
    lon: 120.9842,
  },
  setWeatherLoc: (loc) => {
    localStorage.setItem("os_weather_loc", JSON.stringify(loc));
    set({ weatherLoc: loc });
  },
  chatSound: localStorage.getItem("os_chat_sound") !== "off",
  toggleChatSound: () => {
    const next = !get().chatSound;
    localStorage.setItem("os_chat_sound", next ? "on" : "off");
    set({ chatSound: next });
  },

  systemSounds: localStorage.getItem("os_system_sounds") !== "off",
  toggleSystemSounds: () => {
    const next = !get().systemSounds;
    localStorage.setItem("os_system_sounds", next ? "on" : "off");
    set({ systemSounds: next });
  },

    notification: null,
  notifications: [],
  notify: (title, message, variant = "info", durationMs = 3800) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const item: SystemNotification = { id, title, message, variant, durationMs };

    if (get().systemSounds) {
      if (variant === "delete") soundFx.playClose();
      else if (variant === "add") soundFx.playPop();
      else soundFx.playNotification();
    }

    set((state) => ({
      notification: item,
      notifications: [item, ...state.notifications].slice(0, 5),
    }));

    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        notification: state.notification?.id === id ? state.notifications.find((n) => n.id !== id) || null : state.notification,
      }));
    }, durationMs);
  },
  dismissNotification: (id) => {
    if (id !== undefined) {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        notification: state.notification?.id === id ? state.notifications.find((n) => n.id !== id) || null : state.notification,
      }));
    } else {
      set({ notifications: [], notification: null });
    }
  },

  chatBg: localStorage.getItem("os_chat_bg") || "halftone",
  setChatBg: (id) => {
    localStorage.setItem("os_chat_bg", id);
    set({ chatBg: id });
  },

  glassAlpha: Number(localStorage.getItem("os_glass_alpha") || 0.55),
  setGlassAlpha: (value) => {
    localStorage.setItem("os_glass_alpha", String(value));
    document.documentElement.style.setProperty("--glass-alpha", String(value));
    set({ glassAlpha: value });
  },
  accents: ACCENTS,
  wallpapers: WALLPAPERS,

  // boot / OS style flow
  booted: false,
  osChosen: false,
  osMode: localStorage.getItem("os_mode") === "win" ? "win" : "mac",
  finishBoot: () => set({ booted: true }),
  chooseOs: (mode) => {
    localStorage.setItem("os_mode", mode);
    set({ osMode: mode, osChosen: true });
  },
  setOsMode: (mode) => {
    localStorage.setItem("os_mode", mode);
    set({ osMode: mode });
  },
  reopenPicker: () => {
    if (get().systemSounds) soundFx.playClick();
    set({
      osChosen: false,
      isPoweredOff: false,
      isSleeping: false,
      controlCenterOpen: false,
      missionControlOpen: false,
      spotlightOpen: false,
      powerDialogOpen: false,
    });
  },
  isPoweredOff: false,
  isSleeping: false,
  powerOff: () => {
    if (get().systemSounds) soundFx.playClose();
    set({
      isPoweredOff: true,
      isSleeping: false,
      controlCenterOpen: false,
      missionControlOpen: false,
      spotlightOpen: false,
      powerDialogOpen: false,
    });
    try {
      window.open("", "_self");
      window.close();
    } catch {}
    setTimeout(() => {
      try {
        window.close();
      } catch {}
      try {
        window.location.replace("about:blank");
      } catch {}
    }, 200);
  },
  powerOn: () => {
    if (get().systemSounds) soundFx.playOpen();
    set({ isPoweredOff: false, isSleeping: false, powerDialogOpen: false });
  },
  restart: () => {
    if (get().systemSounds) soundFx.playPop();
    set({
      booted: false,
      isPoweredOff: false,
      isSleeping: false,
      controlCenterOpen: false,
      missionControlOpen: false,
      spotlightOpen: false,
      powerDialogOpen: false,
      windows: [],
    });
  },
  setSleeping: (sleep: boolean) => set({ isSleeping: sleep }),

  // Desktop celestial starfield & particles animation
  particlesEnabled: localStorage.getItem("os_particles") !== "off",
  toggleParticles: () => {
    const next = !get().particlesEnabled;
    localStorage.setItem("os_particles", next ? "on" : "off");
    set({ particlesEnabled: next });
  },
  widgetsVisible: localStorage.getItem("os_widgets") !== "off",
  toggleWidgets: () => {
    const next = !get().widgetsVisible;
    localStorage.setItem("os_widgets", next ? "on" : "off");
    set({ widgetsVisible: next });
  },

  // Night Shift Mode (disabled/removed)
  nightShift: false,
  toggleNightShift: () => {},

  // Control Center
  controlCenterOpen: false,
  toggleControlCenter: () => set((s) => ({ controlCenterOpen: !s.controlCenterOpen })),
  closeControlCenter: () => set({ controlCenterOpen: false }),

  // Mission Control / Exposé Overview
  missionControlOpen: false,
  toggleMissionControl: () => {
    if (get().systemSounds) soundFx.playPop();
    set((s) => ({ missionControlOpen: !s.missionControlOpen }));
  },
  closeMissionControl: () => set({ missionControlOpen: false }),

  // Window snap layout engine
  snapWindow: (id, layout) => {
    if (get().systemSounds) soundFx.playClick();
    const innerW = window.innerWidth;
    const innerH = window.innerHeight;
    const isWin = get().osMode === "win";
    const topBar = isWin ? 6 : 32;
    const bottomBar = isWin ? 54 : (get().dockPosition === "bottom" ? 76 : 12);
    const leftBar = (!isWin && get().dockPosition === "left") ? 78 : 10;
    const rightBar = (!isWin && get().dockPosition === "right") ? 78 : 10;
    const usableW = Math.max(400, innerW - leftBar - rightBar);
    const usableH = Math.max(300, innerH - topBar - bottomBar);

    if (layout === "fullscreen") {
      set({
        windows: get().windows.map((w) => (w.id === id ? { ...w, maximized: true } : w)),
      });
      return;
    }

    let bounds = { x: 80, y: 60, w: 760, h: 520 };
    if (layout === "left") {
      bounds = { x: leftBar, y: topBar, w: Math.floor(usableW / 2) - 5, h: usableH };
    } else if (layout === "right") {
      bounds = { x: leftBar + Math.floor(usableW / 2) + 5, y: topBar, w: Math.floor(usableW / 2) - 5, h: usableH };
    } else if (layout === "top") {
      bounds = { x: leftBar, y: topBar, w: usableW, h: Math.floor(usableH / 2) - 5 };
    } else if (layout === "center") {
      const cw = Math.min(880, Math.floor(usableW * 0.82));
      const ch = Math.min(640, Math.floor(usableH * 0.86));
      bounds = {
        x: leftBar + Math.floor((usableW - cw) / 2),
        y: topBar + Math.floor((usableH - ch) / 2),
        w: cw,
        h: ch,
      };
    }

    set({
      windows: get().windows.map((w) =>
        w.id === id ? { ...w, maximized: false, ...bounds } : w
      ),
    });
  },

  closeAllWindows: () => {
    if (get().systemSounds) soundFx.playClose();
    set({ windows: [] });
  },

  minimizeAllWindows: () => {
    if (get().systemSounds) soundFx.playMinimize();
    set({
      windows: get().windows.map((w) => ({ ...w, minimized: true })),
    });
  },

  // System-wide Spotlight / Search
  spotlightOpen: false,
  openSpotlight: () => set({ spotlightOpen: true }),
  closeSpotlight: () => set({ spotlightOpen: false }),
  toggleSpotlight: () => set((s) => ({ spotlightOpen: !s.spotlightOpen })),

  // Power & Session Dialog
  powerDialogOpen: false,
  openPowerDialog: () => set({ powerDialogOpen: true }),
  closePowerDialog: () => set({ powerDialogOpen: false }),
  togglePowerDialog: () => set((s) => ({ powerDialogOpen: !s.powerDialogOpen })),

  resetDefaults: () => {
    ["os_accent", "os_theme_mode", "os_wallpaper", "os_motion", "os_photo", "os_weather_loc", "os_chat_sound", "os_reminders_items", "os_reminders_done", "os_compact", "os_dock_position", "os_chat_bg", "os_glass_alpha", "os_widgets", "os_chat_text_scale", "os_night_shift", "os_window_indicators"].forEach((k) =>
      localStorage.removeItem(k)
    );
    window.location.reload();
  },

  compact: localStorage.getItem("os_compact") === "on",
  toggleCompact: () => {
    const next = !get().compact;
    localStorage.setItem("os_compact", next ? "on" : "off");
    set({ compact: next });
  },

  dockPosition,
  setDockPosition: (pos) => {
    localStorage.setItem("os_dock_position", pos);
    set({ dockPosition: pos });
  },

  windowIndicators: localStorage.getItem("os_window_indicators") === "on",
  toggleWindowIndicators: () => {
    const next = !get().windowIndicators;
    localStorage.setItem("os_window_indicators", next ? "on" : "off");
    set({ windowIndicators: next });
  },

  unreadChatCount: 0,
  incrementUnreadChat: () => set((s) => ({ unreadChatCount: s.unreadChatCount + 1 })),
  setUnreadChatCount: (count: number) => set({ unreadChatCount: Math.max(0, count) }),
  clearUnreadChat: () => set({ unreadChatCount: 0 }),

  setThemeMode: () => {
    const palette = harmonizeAccentColor(DEFAULT_ACCENT, true);
    applyHarmonizedPaletteToDoc(palette, true);
    set({ themeMode: "night", harmonizedPalette: palette });
  },

  setAccent: (value) => {
    localStorage.setItem("os_accent", value);
    const isNight = get().themeMode === "night";
    const palette = harmonizeAccentColor(value, isNight);
    applyHarmonizedPaletteToDoc(palette, isNight);
    set({ accent: value, harmonizedPalette: palette });
  },
  setWallpaper: (id) => {
    localStorage.setItem("os_wallpaper", id);
    set({ wallpaper: id });
  },
  toggleMotion: () => {
    const next = !get().reduceMotion;
    localStorage.setItem("os_motion", next ? "off" : "on");
    set({ reduceMotion: next });
  },

  openApp: (app) => {
    if (get().systemSounds) soundFx.playOpen();
    if (app === "chats") {
      get().clearUnreadChat();
    }
    const existing = get().windows.find((w) => w.app === app);
    if (existing) {
      z += 1;
      const zz = z;
      set({
        windows: get().windows.map((w) =>
          w.id === existing.id ? { ...w, minimized: false, z: zz } : w,
        ),
      });
      return;
    }
    const meta = APPS[app];
    if (!meta) return;
    const count = get().windows.length;
    const id = `${app}-${Date.now()}`;
    z += 1;
    const title = app === "activity" ? (get().osMode === "win" ? "Task Manager" : "Activity Monitor") : meta.title;
    const win = {
      id,
      app,
      title,
      x: 80 + count * 26,
      y: 60 + count * 22,
      w: meta.w,
      h: meta.h,
      minimized: false,
      maximized: false,
      z,
    };
    set({ windows: [...get().windows, win] });
  },

  closeWindow: (id) => {
    if (get().systemSounds) soundFx.playClose();
    set({ windows: get().windows.filter((w) => w.id !== id) });
  },

  focusWindow: (id) => {
    z += 1;
    const zz = z;
    const targetWin = get().windows.find((w) => w.id === id);
    if (targetWin?.app === "chats") {
      get().clearUnreadChat();
    }
    set({
      windows: get().windows.map((w) => (w.id === id ? { ...w, z: zz, minimized: false } : w)),
    });
  },

  restoreWindow: (id) => {
    if (get().systemSounds) soundFx.playOpen();
    z += 1;
    const zz = z;
    const targetWin = get().windows.find((w) => w.id === id);
    if (targetWin?.app === "chats") {
      get().clearUnreadChat();
    }
    set({
      windows: get().windows.map((w) => (w.id === id ? { ...w, z: zz, minimized: false } : w)),
    });
  },

  minimizingWindowId: null,
  requestMinimize: (id) => {
    const win = get().windows.find((w) => w.id === id);
    if (!win || win.minimized) return;
    if (get().systemSounds) soundFx.playMinimize();
    set({ minimizingWindowId: id });
    setTimeout(() => {
      set((state) => ({
        minimizingWindowId: state.minimizingWindowId === id ? null : state.minimizingWindowId,
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, minimized: true } : w
        ),
      }));
    }, 220);
  },

  dockApps: (() => {
    const saved = localStorage.getItem("os_dock_apps_order");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combined = Array.from(new Set([...parsed, ...DEFAULT_DOCK_APPS])).filter((a) =>
            DEFAULT_DOCK_APPS.includes(a)
          );
          return combined;
        }
      } catch {}
    }
    return DEFAULT_DOCK_APPS;
  })(),

  reorderDockApps: (fromApp, toApp) => {
    if (fromApp === toApp) return;
    const current = [...get().dockApps];
    const fromIdx = current.indexOf(fromApp);
    const toIdx = current.indexOf(toApp);
    if (fromIdx === -1 || toIdx === -1) return;
    current.splice(fromIdx, 1);
    current.splice(toIdx, 0, fromApp);
    localStorage.setItem("os_dock_apps_order", JSON.stringify(current));
    set({ dockApps: current });
  },

  resetDockApps: () => {
    localStorage.removeItem("os_dock_apps_order");
    set({ dockApps: DEFAULT_DOCK_APPS });
  },

  minimizeWindow: (id) => {
    if (get().systemSounds) soundFx.playMinimize();
    set({
      windows: get().windows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w,
      ),
    });
  },

  toggleApp: (app) => {
    const existing = get().windows.find((w) => w.app === app);
    if (!existing) {
      get().openApp(app);
      return;
    }
    if (existing.minimized) {
      get().restoreWindow(existing.id);
      return;
    }
    const openWindows = get().windows.filter((w) => !w.minimized);
    const maxZ = openWindows.length > 0 ? Math.max(...openWindows.map((w) => w.z)) : 0;
    const isTopActive = existing.z >= maxZ;

    if (isTopActive) {
      get().requestMinimize(existing.id);
    } else {
      get().focusWindow(existing.id);
    }
  },

  toggleShowDesktop: () => {
    const hasUnminimized = get().windows.some((w) => !w.minimized);
    if (hasUnminimized) {
      if (get().systemSounds) soundFx.playMinimize();
      set({
        windows: get().windows.map((w) => ({ ...w, minimized: true })),
      });
    } else {
      if (get().systemSounds) soundFx.playOpen();
      set({
        windows: get().windows.map((w) => ({ ...w, minimized: false })),
      });
    }
  },

  toggleMaximize: (id) =>
    set({
      windows: get().windows.map((w) =>
        w.id === id ? { ...w, maximized: !w.maximized } : w,
      ),
    }),

  moveWindow: (id, x, y) =>
    set({
      windows: get().windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    }),

  resizeWindow: (id, w, h) =>
    set({
      windows: get().windows.map((win) =>
        win.id === id ? { ...win, w, h } : win,
      ),
    }),
}));
