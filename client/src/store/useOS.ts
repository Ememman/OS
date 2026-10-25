import { create } from "zustand";
import { soundFx } from "../lib/soundFx";

export const APPS = {
  library: { title: "Library", w: 860, h: 580 },
  music: { title: "Music", w: 760, h: 520 },
  terminal: { title: "Terminal", w: 740, h: 480 },
  calculator: { title: "Calculator", w: 320, h: 480 },
  notes: { title: "Notes", w: 740, h: 520 },
  updates: { title: "Updates", w: 620, h: 640 },
  chats: { title: "Chats", w: 420, h: 620 },
  gallery: { title: "Gallery", w: 880, h: 600 },
  games: { title: "Games", w: 560, h: 700 },
  files: { title: "Files", w: 780, h: 540 },
  settings: { title: "Settings", w: 640, h: 520 },
  resume: { title: "Resume", w: 720, h: 640 },
};

const ACCENTS = [
  { name: "Balloon Coral", value: "232 84 63" },
  { name: "Cyan Tide", value: "87 217 199" },
  { name: "Violet Dusk", value: "148 120 255" },
  { name: "Amber Glow", value: "245 166 66" },
  { name: "Rose", value: "236 96 150" },
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

let z = 10;

export const useOS = create((set, get) => ({
  windows: [], // { id, app, x, y, w, h, minimized, maximized, z }
  accent: localStorage.getItem("os_accent") || ACCENTS[0].value,
  wallpaper: localStorage.getItem("os_wallpaper") || "bg1", // Changed default to bg1
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
  notify: (title, message) => {
    const id = Date.now();
    set({ notification: { id, title, message } });
    if (get().systemSounds) soundFx.playNotification();
    setTimeout(() => {
      if (get().notification?.id === id) {
        set({ notification: null });
      }
    }, 4200);
  },
  dismissNotification: () => set({ notification: null }),

  chatBg: localStorage.getItem("os_chat_bg") || "halftone", // "halftone" | "notebook" | "ink" | "plain"
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
  osMode: localStorage.getItem("os_mode") || "mac", // "mac" | "win"
  finishBoot: () => set({ booted: true }),
  chooseOs: (mode) => {
    localStorage.setItem("os_mode", mode);
    set({ osMode: mode, osChosen: true });
  },
  setOsMode: (mode) => {
    localStorage.setItem("os_mode", mode);
    set({ osMode: mode });
  },
  reopenPicker: () => set({ osChosen: false }),

  // Desktop celestial starfield & particles animation
  particlesEnabled: localStorage.getItem("os_particles") !== "off",
  toggleParticles: () => {
    const next = !get().particlesEnabled;
    localStorage.setItem("os_particles", next ? "on" : "off");
    set({ particlesEnabled: next });
  },

  // Window snap layout engine
  snapWindow: (id, layout) => {
    if (get().systemSounds) soundFx.playPop();
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

  resetDefaults: () => {
    ["os_accent", "os_wallpaper", "os_motion", "os_photo", "os_weather_loc", "os_chat_sound", "os_reminders_items", "os_reminders_done", "os_compact", "os_dock_position", "os_chat_bg", "os_glass_alpha"].forEach((k) =>
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

  dockPosition: localStorage.getItem("os_dock_position") || "bottom", // "bottom" | "left" | "right" (macOS only)
  setDockPosition: (pos) => {
    localStorage.setItem("os_dock_position", pos);
    set({ dockPosition: pos });
  },

  setAccent: (value) => {
    localStorage.setItem("os_accent", value);
    document.documentElement.style.setProperty("--accent", value);
    set({ accent: value });
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
    const existing = get().windows.find((w) => w.app === app);
    if (existing) {
      get().focusWindow(existing.id);
      set({
        windows: get().windows.map((w) =>
          w.id === existing.id ? { ...w, minimized: false } : w,
        ),
      });
      return;
    }
    const meta = APPS[app];
    if (!meta) return;
    const count = get().windows.length;
    const id = `${app}-${Date.now()}`;
    z += 1;
    const win = {
      id,
      app,
      title: meta.title,
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
    set({
      windows: get().windows.map((w) => (w.id === id ? { ...w, z: zz } : w)),
    });
  },

  minimizeWindow: (id) => {
    if (get().systemSounds) soundFx.playMinimize();
    set({
      windows: get().windows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w,
      ),
    });
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
