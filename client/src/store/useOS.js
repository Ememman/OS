import { create } from "zustand";

export const APPS = {
  library: { title: "Library", w: 860, h: 580 },
  music: { title: "Music", w: 760, h: 520 },
  updates: { title: "Updates", w: 620, h: 640 },
  chats: { title: "Chats", w: 420, h: 620 },
  gallery: { title: "Gallery", w: 880, h: 600 },
  games: { title: "Games", w: 560, h: 700 },
  files: { title: "Files", w: 780, h: 540 },
  settings: { title: "Settings", w: 640, h: 500 },
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

  closeWindow: (id) =>
    set({ windows: get().windows.filter((w) => w.id !== id) }),

  focusWindow: (id) => {
    z += 1;
    const zz = z;
    set({
      windows: get().windows.map((w) => (w.id === id ? { ...w, z: zz } : w)),
    });
  },

  minimizeWindow: (id) =>
    set({
      windows: get().windows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w,
      ),
    }),

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
