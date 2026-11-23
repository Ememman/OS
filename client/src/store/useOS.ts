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
import { DARK_NATURE_SCENES } from "../data/darkNatureScenes";

export type LiveShowParticleMode = "fireflies" | "stars" | "embers" | "off";

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
  liveShowEnabled: boolean;
  setLiveShowEnabled: (enabled: boolean) => void;
  liveShowTimeout: number;
  setLiveShowTimeout: (minutes: number) => void;
  liveShowParticleMode: LiveShowParticleMode;
  setLiveShowParticleMode: (mode: LiveShowParticleMode) => void;
  cycleLiveShowParticleMode: () => void;
  isLiveShowActive: boolean;
  setLiveShowActive: (active: boolean) => void;
  startLiveShow: () => void;
  stopLiveShow: () => void;
  liveWallpaperSceneIndex: number;
  setLiveWallpaperSceneIndex: (idx: number) => void;
  nextLiveWallpaperScene: () => void;
  prevLiveWallpaperScene: () => void;
  liveWallpaperAutoCycle: boolean;
  setLiveWallpaperAutoCycle: (enabled: boolean) => void;
  lockScreenLiveShow: boolean;
  setLockScreenLiveShow: (enabled: boolean) => void;
  particlesEnabled: boolean;
  toggleParticles: () => void;
  widgetsVisible: boolean;
  toggleWidgets: () => void;
  dynamicIslandEnabled: boolean;
  setDynamicIslandEnabled: (enabled: boolean) => void;
  toggleDynamicIsland: () => void;
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
  appUpdates: Record<string, number>;
  setAppBadge: (app: string, count: number) => void;
  incrementAppBadge: (app: string) => void;
  clearAppUpdate: (app: string) => void;
  getAppBadge: (app: string) => { count: number; type: "chat" | "update" } | null;
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
  persistDockOrder: boolean;
  reorderDockApps: (fromApp: string, toApp: string) => void;
  resetDockApps: () => void;
  setPersistDockOrder: (persist: boolean) => void;
  toggleMaximize: (id: string) => void;
  toggleShowDesktop: () => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, w: number, h: number) => void;
  updateWindowBounds: (id: string, bounds: { x?: number; y?: number; w?: number; h?: number }) => void;
}

export const DEFAULT_DOCK_APPS = [
  "browser",
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
  browser: { title: "Safari", w: 940, h: 640 },
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
  settings: { title: "Settings", w: 780, h: 560 },
  resume: { title: "Resume", w: 820, h: 740 },
  "pdf-viewer": { title: "MendozaJamesEmmanuelCV.pdf", w: 840, h: 760 },
};

const DEFAULT_ACCENT = "59 130 246"; // System Electric Blue calibrated for active, click, and hover

const ACCENTS: AccentColor[] = [
  { name: "Electric Blue", value: "59 130 246" },   // #3b82f6 - Default macOS/Windows Signature
  { name: "Cyber Emerald", value: "16 185 129" },   // #10b981 - Matrix Mint
  { name: "Cosmic Violet", value: "139 92 246" },   // #8b5cf6 - Radiant Purple
  { name: "Sunset Amber", value: "245 158 11" },    // #f59e0b - Warm Amber
  { name: "Crimson Rose", value: "244 63 94" },     // #f43f5e - Vivid Coral
  { name: "Electric Cyan", value: "6 182 212" },    // #06b6d4 - Aqua Neon
  { name: "Radiant Fuchsia", value: "236 72 153" }, // #ec4899 - Neon Pink
  { name: "Solar Orange", value: "249 115 22" },    // #f97316 - Dynamic Orange
  { name: "Titanium Steel", value: "148 163 184" }, // #94a3b8 - Clean Platinum
];

const WALLPAPERS = [
  // Live dynamic rotating show
  { id: "liveshow", name: "Dark Nature Live Show" },
  // Your custom images
  { id: "bg1", name: "Balloon Sunset" },
  { id: "bg2", name: "Cyborg Dark" },
  { id: "bg3", name: "Balloon Night" },
  // Nature and artistic aesthetics
  { id: "nature", name: "Dark Nature Aesthetic" },
  { id: "ocean", name: "Night Ocean & Balloon" },
  { id: "galaxy", name: "Deep Galaxy" },
  { id: "aurora", name: "Aurora Coast" },
];

const savedDockPosition = localStorage.getItem("os_dock_position");
const dockPosition: DockPosition =
  savedDockPosition === "left" || savedDockPosition === "right"
    ? savedDockPosition
    : "bottom";

const savedThemeMode: ThemeMode =
  typeof window !== "undefined"
    ? ((localStorage.getItem("os_theme_mode") as ThemeMode) || "dark")
    : "dark";

const savedAccent: string =
  typeof window !== "undefined"
    ? (localStorage.getItem("os_accent") || DEFAULT_ACCENT)
    : DEFAULT_ACCENT;

const initialPalette = harmonizeAccentColor(savedAccent, savedThemeMode);

if (typeof document !== "undefined") {
  applyHarmonizedPaletteToDoc(initialPalette, savedThemeMode);
}

let z = 10;

const INITIAL_APP_UPDATES: Record<string, number> = {};

const loadInitialAppUpdates = (): Record<string, number> => {
  if (typeof window === "undefined") return INITIAL_APP_UPDATES;
  try {
    // Purge legacy artificial update keys so offline apps never show fake badges
    localStorage.removeItem("os_viewed_app_updates");
    const raw = localStorage.getItem("os_app_updates");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const clean: Record<string, number> = {};
        for (const [k, v] of Object.entries(parsed)) {
          // Only permit genuine dynamic real-time apps to hold badges
          if (
            typeof v === "number" &&
            v > 0 &&
            !["calculator", "notes", "terminal", "activity", "games", "library", "resume", "codeplay", "music", "gallery", "files", "settings"].includes(k)
          ) {
            clean[k] = v;
          }
        }
        return clean;
      }
    }
    return INITIAL_APP_UPDATES;
  } catch {
    return INITIAL_APP_UPDATES;
  }
};

export const useOS = create<OSState>((set, get) => ({
  windows: [],
  themeMode: savedThemeMode,
  harmonizedPalette: initialPalette,
  accent: savedAccent,
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
    // Notifications automatically dismiss within at most 5 seconds (5000ms max)
    const effectiveDuration = Math.min(5000, Math.max(1500, durationMs));
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const item: SystemNotification = { id, title, message, variant, durationMs: effectiveDuration };

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
    }, effectiveDuration);
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

  // Dark Nature Live Show Wallpaper & Screensaver
  liveShowEnabled: typeof window !== "undefined" ? localStorage.getItem("os_liveshow_enabled") !== "off" : true,
  setLiveShowEnabled: (enabled: boolean) => {
    localStorage.setItem("os_liveshow_enabled", enabled ? "on" : "off");
    set({ liveShowEnabled: enabled });
  },
  liveShowTimeout: typeof window !== "undefined" ? (Number(localStorage.getItem("os_liveshow_timeout")) || 5) : 5,
  setLiveShowTimeout: (minutes: number) => {
    localStorage.setItem("os_liveshow_timeout", String(minutes));
    set({ liveShowTimeout: minutes });
  },
  liveShowParticleMode: typeof window !== "undefined"
    ? ((localStorage.getItem("os_liveshow_particle_mode") as LiveShowParticleMode) || "fireflies")
    : "fireflies",
  setLiveShowParticleMode: (mode: LiveShowParticleMode) => {
    localStorage.setItem("os_liveshow_particle_mode", mode);
    set({ liveShowParticleMode: mode });
  },
  cycleLiveShowParticleMode: () => {
    const modes: LiveShowParticleMode[] = ["fireflies", "stars", "embers", "off"];
    const current = get().liveShowParticleMode;
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    get().setLiveShowParticleMode(next);
  },
  isLiveShowActive: false,
  setLiveShowActive: (active: boolean) => set({ isLiveShowActive: active }),
  startLiveShow: () => set({ isLiveShowActive: true }),
  stopLiveShow: () => set({ isLiveShowActive: false }),

  // Dark Nature Live Desktop Wallpaper Scene Navigation
  liveWallpaperSceneIndex: typeof window !== "undefined" ? (Number(localStorage.getItem("os_live_wallpaper_scene")) || 0) : 0,
  setLiveWallpaperSceneIndex: (idx: number) => {
    const clean = ((idx % DARK_NATURE_SCENES.length) + DARK_NATURE_SCENES.length) % DARK_NATURE_SCENES.length;
    localStorage.setItem("os_live_wallpaper_scene", String(clean));
    set({ liveWallpaperSceneIndex: clean });
  },
  nextLiveWallpaperScene: () => {
    const current = get().liveWallpaperSceneIndex;
    const next = (current + 1) % DARK_NATURE_SCENES.length;
    get().setLiveWallpaperSceneIndex(next);
    const scene = DARK_NATURE_SCENES[next];
    if (get().systemSounds) soundFx.playPop();
    get().notify("Live Wallpaper Scene", scene.title, "update", 2200);
  },
  prevLiveWallpaperScene: () => {
    const current = get().liveWallpaperSceneIndex;
    const prev = ((current - 1) + DARK_NATURE_SCENES.length) % DARK_NATURE_SCENES.length;
    get().setLiveWallpaperSceneIndex(prev);
    const scene = DARK_NATURE_SCENES[prev];
    if (get().systemSounds) soundFx.playPop();
    get().notify("Live Wallpaper Scene", scene.title, "update", 2200);
  },
  liveWallpaperAutoCycle: typeof window !== "undefined" ? localStorage.getItem("os_live_wallpaper_autocycle") !== "off" : true,
  setLiveWallpaperAutoCycle: (enabled: boolean) => {
    localStorage.setItem("os_live_wallpaper_autocycle", enabled ? "on" : "off");
    set({ liveWallpaperAutoCycle: enabled });
  },

  // Lock Screen Live Show Wallpaper
  lockScreenLiveShow: typeof window !== "undefined" ? localStorage.getItem("os_lockscreen_liveshow") !== "off" : true,
  setLockScreenLiveShow: (enabled: boolean) => {
    localStorage.setItem("os_lockscreen_liveshow", enabled ? "on" : "off");
    set({ lockScreenLiveShow: enabled });
  },

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

  // Dynamic Island (iPhone Style for macOS & Windows)
  dynamicIslandEnabled: typeof window !== "undefined" ? localStorage.getItem("os_dynamic_island") !== "off" : true,
  setDynamicIslandEnabled: (enabled: boolean) => {
    localStorage.setItem("os_dynamic_island", enabled ? "on" : "off");
    set({ dynamicIslandEnabled: enabled });
  },
  toggleDynamicIsland: () => {
    const next = !get().dynamicIslandEnabled;
    get().setDynamicIslandEnabled(next);
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
    ["os_accent", "os_theme_mode", "os_wallpaper", "os_motion", "os_photo", "os_weather_loc", "os_chat_sound", "os_reminders_items", "os_reminders_done", "os_compact", "os_dock_position", "os_chat_bg", "os_glass_alpha", "os_widgets", "os_chat_text_scale", "os_night_shift", "os_window_indicators", "os_dock_apps_order", "os_persist_dock_order", "os_liveshow_enabled", "os_liveshow_timeout", "os_live_wallpaper_scene", "os_live_wallpaper_autocycle", "os_lockscreen_liveshow"].forEach((k) =>
      localStorage.removeItem(k)
    );
    try {
      sessionStorage.removeItem("os_dock_apps_order");
    } catch {}
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

  appUpdates: loadInitialAppUpdates(),
  setAppBadge: (app: string, count: number) => {
    // Only real apps that support notifications can set badges
    if (["calculator", "notes", "terminal", "activity", "games", "library", "resume", "codeplay", "music", "gallery", "files", "settings"].includes(app)) {
      return;
    }
    const cur = { ...get().appUpdates };
    if (count > 0) {
      cur[app] = count;
    } else {
      delete cur[app];
    }
    try {
      localStorage.setItem("os_app_updates", JSON.stringify(cur));
    } catch {}
    set({ appUpdates: cur });
  },
  incrementAppBadge: (app: string) => {
    if (["calculator", "notes", "terminal", "activity", "games", "library", "resume", "codeplay", "music", "gallery", "files", "settings"].includes(app)) {
      return;
    }
    const cur = { ...get().appUpdates };
    cur[app] = (cur[app] || 0) + 1;
    try {
      localStorage.setItem("os_app_updates", JSON.stringify(cur));
    } catch {}
    set({ appUpdates: cur });
  },
  clearAppUpdate: (app: string) => {
    const cur = { ...get().appUpdates };
    if (cur[app]) {
      delete cur[app];
      try {
        localStorage.setItem("os_app_updates", JSON.stringify(cur));
      } catch {}
      set({ appUpdates: cur });
    }
  },
  getAppBadge: (app: string) => {
    if (app === "chats" && get().unreadChatCount > 0) {
      return { count: get().unreadChatCount, type: "chat" };
    }
    const updateCount = get().appUpdates[app];
    if (typeof updateCount === "number" && updateCount > 0) {
      return { count: updateCount, type: "update" };
    }
    return null;
  },

  setThemeMode: (mode: ThemeMode) => {
    localStorage.setItem("os_theme_mode", mode);
    const curAccent = get().accent;
    const palette = harmonizeAccentColor(curAccent, mode);
    applyHarmonizedPaletteToDoc(palette, mode);
    set({ themeMode: mode, harmonizedPalette: palette });
  },

  setAccent: (value: string) => {
    localStorage.setItem("os_accent", value);
    const mode = get().themeMode;
    const palette = harmonizeAccentColor(value, mode);
    applyHarmonizedPaletteToDoc(palette, mode);
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
    get().clearAppUpdate(app);
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
    if (targetWin?.app) {
      get().clearAppUpdate(targetWin.app);
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
    if (targetWin?.app) {
      get().clearAppUpdate(targetWin.app);
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

  persistDockOrder: typeof window !== "undefined" && localStorage.getItem("os_persist_dock_order") === "true",

  dockApps: (() => {
    if (typeof window === "undefined") return DEFAULT_DOCK_APPS;
    const shouldPersist = localStorage.getItem("os_persist_dock_order") === "true";
    if (!shouldPersist) {
      // By default, do NOT persist dragged dock across browser sessions - always start in default positions!
      try {
        localStorage.removeItem("os_dock_apps_order");
      } catch {}
      try {
        const sessionSaved = sessionStorage.getItem("os_dock_apps_order");
        if (sessionSaved) {
          const parsed = JSON.parse(sessionSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return Array.from(new Set([...parsed, ...DEFAULT_DOCK_APPS])).filter((a) =>
              DEFAULT_DOCK_APPS.includes(a)
            );
          }
        }
      } catch {}
      return DEFAULT_DOCK_APPS;
    }

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

    // Save for the current browser session
    try {
      sessionStorage.setItem("os_dock_apps_order", JSON.stringify(current));
    } catch {}

    // Only persist across browser sessions if explicitly enabled in Settings
    if (get().persistDockOrder) {
      try {
        localStorage.setItem("os_dock_apps_order", JSON.stringify(current));
      } catch {}
    }

    set({ dockApps: current });
  },

  resetDockApps: () => {
    try {
      localStorage.removeItem("os_dock_apps_order");
      sessionStorage.removeItem("os_dock_apps_order");
    } catch {}
    set({ dockApps: DEFAULT_DOCK_APPS });
  },

  setPersistDockOrder: (persist: boolean) => {
    try {
      if (persist) {
        localStorage.setItem("os_persist_dock_order", "true");
        localStorage.setItem("os_dock_apps_order", JSON.stringify(get().dockApps));
      } else {
        localStorage.removeItem("os_persist_dock_order");
        localStorage.removeItem("os_dock_apps_order");
      }
    } catch {}
    set({ persistDockOrder: persist });
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

  updateWindowBounds: (id, bounds) =>
    set({
      windows: get().windows.map((win) =>
        win.id === id ? { ...win, ...bounds } : win,
      ),
    }),
}));
