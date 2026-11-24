import { create } from "zustand";
import {
  type DesktopItem,
  type DesktopAppItem,
  type DesktopFolderItem,
  DEFAULT_DESKTOP_ITEMS,
  APP_REGISTRY,
} from "../types/desktop";
import { soundFx } from "../lib/soundFx";

export const STORAGE_KEY = "portfolio_os_desktop_items_v3";

interface DesktopStoreState {
  items: DesktopItem[];
  activeFolderId: string | null;
  namingModal: { isOpen: boolean; folderId: string; initialName: string; isFolder?: boolean } | null;

  // Actions
  addOrPositionApp: (appKey: string, x?: number, y?: number) => void;
  removeDesktopItem: (id: string) => void;
  renameDesktopItem: (id: string, newLabel: string) => void;
  duplicateDesktopItem: (id: string) => void;
  moveItem: (
    id: string,
    x: number,
    y: number,
    extra?: {
      lastSafeX?: number;
      lastSafeY?: number;
      widgetZoneX?: number | null;
      widgetZoneY?: number | null;
    }
  ) => void;
  combineItems: (draggedId: string, targetId: string) => void;
  renameFolder: (folderId: string, newName: string) => void;
  removeAppFromFolder: (folderId: string, appId: string) => void;
  extractAppFromFolder: (
    folderId: string,
    appId: string,
    targetPos?: { x: number; y: number }
  ) => void;
  ungroupFolder: (folderId: string) => void;
  addAppToFolder: (folderId: string, appKey: string) => void;
  openFolder: (folderId: string) => void;
  closeFolder: () => void;
  openNamingModal: (folderId: string, currentName: string, isFolder?: boolean) => void;
  closeNamingModal: () => void;
  cleanUpDesktop: () => void;
  resetDesktop: () => void;
}

const loadStoredItems = (): DesktopItem[] => {
  if (typeof window === "undefined") return DEFAULT_DESKTOP_ITEMS;
  try {
    // If upgrading from v2, clear older layout so the clean 4 default items take effect
    if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem("portfolio_os_desktop_items_v2")) {
      try {
        localStorage.removeItem("portfolio_os_desktop_items_v2");
      } catch {}
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DESKTOP_ITEMS;
    const parsed = JSON.parse(raw) as DesktopItem[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Validate structure
      const validated = parsed.map((item) => {
        if (item.type === "folder") {
          return {
            ...item,
            apps: (item.apps || []).map((a) => {
              const reg = APP_REGISTRY[a.app];
              return {
                ...a,
                label: a.label || reg?.label || a.app,
                color: a.color || reg?.color || "#38bdf8",
              };
            }),
          };
        }
        const isPdfItem =
          item.label?.toLowerCase().endsWith(".pdf") ||
          (item as any).name?.toLowerCase().endsWith(".pdf") ||
          item.id === "file-resume-cv" ||
          item.id === "resume-pdf";
        const appKey = isPdfItem ? "pdf-viewer" : item.app;
        const reg = APP_REGISTRY[appKey] || APP_REGISTRY[item.app];
        return {
          ...item,
          app: appKey,
          label: item.label || reg?.label || item.app,
          color: isPdfItem ? "#f43f5e" : item.color || reg?.color || "#38bdf8",
        };
      });

      // Auto-heal overlapping items if stored coordinates collide
      const occupied: { x: number; y: number }[] = [];
      return validated.map((item) => {
        if (typeof item.x !== "number" || typeof item.y !== "number") {
          return item;
        }
        let curX = item.x;
        let curY = item.y;
        while (occupied.some((p) => Math.abs(p.x - curX) < 64 && Math.abs(p.y - curY) < 70)) {
          curX += 92;
          if (typeof window !== "undefined" && curX > window.innerWidth - 100) {
            curX = 28;
            curY += 96;
          }
        }
        occupied.push({ x: curX, y: curY });
        return { ...item, x: curX, y: curY };
      });
    }
  } catch (err) {
    console.warn("Failed to load stored desktop items, using defaults:", err);
  }
  return DEFAULT_DESKTOP_ITEMS;
};

const persistItems = (items: DesktopItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to persist desktop items:", err);
  }
};

export const useDesktopStore = create<DesktopStoreState>((set, get) => ({
  items: loadStoredItems(),
  activeFolderId: null,
  namingModal: null,

  addOrPositionApp: (appKey: string, x?: number, y?: number) => {
    const reg = APP_REGISTRY[appKey];
    if (!reg) return;

    const current = get().items;

    // Calculate clamped coordinates on the desktop canvas
    let targetX = typeof x === "number" ? Math.round(x - 36) : 48;
    let targetY = typeof y === "number" ? Math.round(y - 40) : 56;

    if (typeof window !== "undefined") {
      targetX = Math.max(16, Math.min(window.innerWidth - 92, targetX));
      targetY = Math.max(36, Math.min(window.innerHeight - 96, targetY));
    }

    // 1. Check if the app is already on the root desktop -> move it to the new position
    const existingIdx = current.findIndex(
      (it) => it.type === "app" && it.app === appKey
    );
    if (existingIdx !== -1) {
      const updated = current.map((it, idx) =>
        idx === existingIdx
          ? {
              ...it,
              x: targetX,
              y: targetY,
              lastSafeX: targetX,
              lastSafeY: targetY,
            }
          : it
      );
      persistItems(updated);
      set({ items: updated });
      soundFx.playPop();
      return;
    }

    // 2. Check if the app is inside a folder -> extract it to desktop at target position
    for (const item of current) {
      if (item.type === "folder") {
        const folder = item as DesktopFolderItem;
        const appInFolder = folder.apps.find((a) => a.app === appKey);
        if (appInFolder) {
          get().extractAppFromFolder(folder.id, appInFolder.id, {
            x: targetX,
            y: targetY,
          });
          soundFx.playPop();
          return;
        }
      }
    }

    // 3. App is not on desktop yet -> add new desktop icon at target position
    const newItem: DesktopAppItem = {
      id: `app-${appKey}-${Date.now()}`,
      type: "app",
      app: appKey,
      label: reg.label,
      color: reg.color,
      x: targetX,
      y: targetY,
      lastSafeX: targetX,
      lastSafeY: targetY,
    };

    const updated = [...current, newItem];
    persistItems(updated);
    set({ items: updated });
    soundFx.playPop();
  },

  moveItem: (
    id: string,
    x: number,
    y: number,
    extra?: {
      lastSafeX?: number;
      lastSafeY?: number;
      widgetZoneX?: number | null;
      widgetZoneY?: number | null;
    }
  ) => {
    const updated = get().items.map((it) => {
      if (it.id === id) {
        const itemCopy: DesktopItem = { ...it, x, y };
        if (extra?.lastSafeX !== undefined) itemCopy.lastSafeX = extra.lastSafeX;
        if (extra?.lastSafeY !== undefined) itemCopy.lastSafeY = extra.lastSafeY;
        if (extra?.widgetZoneX !== undefined) {
          if (extra.widgetZoneX === null) delete itemCopy.widgetZoneX;
          else itemCopy.widgetZoneX = extra.widgetZoneX;
        }
        if (extra?.widgetZoneY !== undefined) {
          if (extra.widgetZoneY === null) delete itemCopy.widgetZoneY;
          else itemCopy.widgetZoneY = extra.widgetZoneY;
        }
        return itemCopy;
      }
      return it;
    });
    persistItems(updated);
    set({ items: updated });
  },

  combineItems: (draggedId: string, targetId: string) => {
    if (!draggedId || !targetId || draggedId === targetId) return;

    const currentItems = [...get().items];
    const draggedIdx = currentItems.findIndex((it) => it.id === draggedId);
    const targetIdx = currentItems.findIndex((it) => it.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const dragged = currentItems[draggedIdx];
    const target = currentItems[targetIdx];

    soundFx.playClick();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }

    let updatedItems: DesktopItem[] = [];
    let createdFolderId: string | null = null;

    // Case 1: Both are individual apps -> Combine into a new Folder!
    if (dragged.type === "app" && target.type === "app") {
      const folderId = `folder-${Date.now()}`;
      createdFolderId = folderId;

      const newFolder: DesktopFolderItem = {
        id: folderId,
        type: "folder",
        name: "Featured", // Matches user reference screenshot!
        apps: [target, dragged],
        x: target.x,
        y: target.y,
      };

      // Replace target with new folder, and remove dragged item
      updatedItems = currentItems
        .map((it) => (it.id === targetId ? newFolder : it))
        .filter((it) => it.id !== draggedId);
    }
    // Case 2: Target is already a folder, dragged is an app -> Add app to folder!
    else if (target.type === "folder" && dragged.type === "app") {
      const folder = target as DesktopFolderItem;
      const alreadyHas = folder.apps.some((a) => a.id === dragged.id || a.app === dragged.app);
      const newApps = alreadyHas ? folder.apps : [...folder.apps, dragged];

      const updatedFolder: DesktopFolderItem = {
        ...folder,
        apps: newApps,
      };

      updatedItems = currentItems
        .map((it) => (it.id === targetId ? updatedFolder : it))
        .filter((it) => it.id !== draggedId);
    }
    // Case 3: Dragged is a folder, target is an app -> Put target app inside folder!
    else if (dragged.type === "folder" && target.type === "app") {
      const folder = dragged as DesktopFolderItem;
      const alreadyHas = folder.apps.some((a) => a.id === target.id || a.app === target.app);
      const newApps = alreadyHas ? folder.apps : [...folder.apps, target];

      const updatedFolder: DesktopFolderItem = {
        ...folder,
        apps: newApps,
      };

      updatedItems = currentItems
        .map((it) => (it.id === draggedId ? updatedFolder : it))
        .filter((it) => it.id !== targetId);
    }
    // Case 4: Both are folders -> Merge them!
    else if (dragged.type === "folder" && target.type === "folder") {
      const targetFolder = target as DesktopFolderItem;
      const draggedFolder = dragged as DesktopFolderItem;

      const mergedApps = [...targetFolder.apps];
      draggedFolder.apps.forEach((a) => {
        if (!mergedApps.some((ma) => ma.app === a.app)) {
          mergedApps.push(a);
        }
      });

      const updatedFolder: DesktopFolderItem = {
        ...targetFolder,
        apps: mergedApps,
      };

      updatedItems = currentItems
        .map((it) => (it.id === targetId ? updatedFolder : it))
        .filter((it) => it.id !== draggedId);
    }

    if (updatedItems.length > 0) {
      persistItems(updatedItems);
      set({
        items: updatedItems,
        // If a new folder was just formed, pop up the component naming modal!
        namingModal: createdFolderId
          ? { isOpen: true, folderId: createdFolderId, initialName: "Featured" }
          : null,
      });
    }
  },

  renameFolder: (folderId: string, newName: string) => {
    const trimmed = newName.trim() || "Featured";
    const updated = get().items.map((it) => {
      if (it.id === folderId && it.type === "folder") {
        return { ...it, name: trimmed };
      }
      return it;
    });
    persistItems(updated);
    set({ items: updated, namingModal: null });
  },

  extractAppFromFolder: (
    folderId: string,
    appId: string,
    targetPos?: { x: number; y: number }
  ) => {
    const current = get().items;
    const folderIdx = current.findIndex(
      (it) => it.id === folderId && it.type === "folder"
    );
    if (folderIdx === -1) return;

    const folder = current[folderIdx] as DesktopFolderItem;
    const appToExtract = folder.apps.find((a) => a.id === appId);
    if (!appToExtract) return;

    const remainingApps = folder.apps.filter((a) => a.id !== appId);

    // Determine target coordinates for the standalone app
    let finalX: number;
    let finalY: number;

    if (
      typeof targetPos?.x === "number" &&
      typeof targetPos?.y === "number"
    ) {
      finalX = targetPos.x;
      finalY = targetPos.y;
    } else {
      // Offset safely from folder position
      const folderX = typeof folder.x === "number" ? folder.x : 28;
      const folderY = typeof folder.y === "number" ? folder.y : 54;
      finalX = folderX + 92;
      finalY = folderY;
    }

    // Resolve any collision with other desktop items so it never overlaps
    const otherPositions = current
      .filter((it) => it.id !== folderId)
      .map((it) => ({
        x: typeof it.x === "number" ? it.x : 28,
        y: typeof it.y === "number" ? it.y : 54,
      }));
    if (
      remainingApps.length > 0 &&
      typeof folder.x === "number" &&
      typeof folder.y === "number"
    ) {
      otherPositions.push({ x: folder.x, y: folder.y });
    }

    while (
      otherPositions.some(
        (p) =>
          Math.abs(p.x - finalX) < 68 && Math.abs(p.y - finalY) < 76
      )
    ) {
      finalX += 92;
      if (
        typeof window !== "undefined" &&
        finalX > window.innerWidth - 100
      ) {
        finalX = 28;
        finalY += 96;
      }
    }

    const standaloneApp: DesktopAppItem = {
      ...appToExtract,
      x: finalX,
      y: finalY,
      lastSafeX: finalX,
      lastSafeY: finalY,
    };

    let updated: DesktopItem[];
    if (remainingApps.length === 0) {
      // If folder is now empty, delete folder and put app in its place
      updated = current.map((it) =>
        it.id === folderId ? standaloneApp : it
      );
    } else {
      // Keep folder with remaining apps and add standalone app to desktop
      const updatedFolder: DesktopFolderItem = {
        ...folder,
        apps: remainingApps,
      };
      updated = [...current];
      updated[folderIdx] = updatedFolder;
      updated.push(standaloneApp);
    }

    persistItems(updated);
    set({
      items: updated,
      activeFolderId:
        remainingApps.length === 0 ? null : get().activeFolderId,
    });
    soundFx.playClick();
  },

  removeAppFromFolder: (folderId: string, appId: string) => {
    get().extractAppFromFolder(folderId, appId);
  },

  ungroupFolder: (folderId: string) => {
    const current = get().items;
    const folderIdx = current.findIndex((it) => it.id === folderId && it.type === "folder");
    if (folderIdx === -1) return;

    const folder = current[folderIdx] as DesktopFolderItem;
    const extractedApps: DesktopAppItem[] = [...folder.apps];

    const updated = [...current];
    updated.splice(folderIdx, 1, ...extractedApps);

    persistItems(updated);
    set({
      items: updated,
      activeFolderId: null,
    });
  },

  addAppToFolder: (folderId: string, appKey: string) => {
    const reg = APP_REGISTRY[appKey];
    if (!reg) return;

    const current = get().items;
    const folder = current.find((it) => it.id === folderId && it.type === "folder") as DesktopFolderItem | undefined;
    if (!folder) return;

    // Check if already in folder
    if (folder.apps.some((a) => a.app === appKey)) return;

    const newApp: DesktopAppItem = {
      id: `app-${appKey}-${Date.now()}`,
      type: "app",
      app: appKey,
      label: reg.label,
      color: reg.color,
    };

    // If app existed on root desktop, remove it
    const filteredRoot = current.filter((it) => it.type !== "app" || it.app !== appKey);

    const updated = filteredRoot.map((it) => {
      if (it.id === folderId && it.type === "folder") {
        return {
          ...it,
          apps: [...(it as DesktopFolderItem).apps, newApp],
        };
      }
      return it;
    });

    persistItems(updated);
    set({ items: updated });
  },

  openFolder: (folderId: string) => {
    soundFx.playClick();
    set({ activeFolderId: folderId });
  },

  closeFolder: () => {
    set({ activeFolderId: null });
  },

  removeDesktopItem: (id: string) => {
    soundFx.playClose();
    const current = get().items;
    const updated = current.filter((it) => it.id !== id);
    persistItems(updated);
    set({ items: updated });
  },

  renameDesktopItem: (id: string, newLabel: string) => {
    soundFx.playClick();
    const current = get().items;
    const updated = current.map((it) => {
      if (it.id === id) {
        return { ...it, label: newLabel };
      }
      return it;
    });
    persistItems(updated);
    set({ items: updated, namingModal: null });
  },

  duplicateDesktopItem: (id: string) => {
    soundFx.playPop();
    const current = get().items;
    const item = current.find((it) => it.id === id);
    if (!item) return;

    const copyX = (item.x ?? 40) + 24;
    const copyY = (item.y ?? 50) + 24;

    if (item.type === "app") {
      const copyApp: DesktopAppItem = {
        ...item,
        id: `app-${item.app}-copy-${Date.now()}`,
        label: `${item.label} (Copy)`,
        x: copyX,
        y: copyY,
      };
      const updated = [...current, copyApp];
      persistItems(updated);
      set({ items: updated });
    }
  },

  openNamingModal: (folderId: string, currentName: string, isFolder: boolean = true) => {
    set({
      namingModal: {
        isOpen: true,
        folderId,
        initialName: currentName,
        isFolder,
      },
    });
  },

  closeNamingModal: () => {
    set({ namingModal: null });
  },

  cleanUpDesktop: () => {
    soundFx.playClick();
    const cleared = get().items.map((it) => {
      const copy = { ...it };
      delete copy.x;
      delete copy.y;
      delete copy.lastSafeX;
      delete copy.lastSafeY;
      delete copy.widgetZoneX;
      delete copy.widgetZoneY;
      return copy;
    });
    persistItems(cleared);
    set({ items: cleared });
  },

  resetDesktop: () => {
    persistItems(DEFAULT_DESKTOP_ITEMS);
    set({
      items: DEFAULT_DESKTOP_ITEMS,
      activeFolderId: null,
      namingModal: null,
    });
  },
}));
