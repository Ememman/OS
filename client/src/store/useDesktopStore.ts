import { create } from "zustand";
import {
  type DesktopItem,
  type DesktopAppItem,
  type DesktopFolderItem,
  DEFAULT_DESKTOP_ITEMS,
  APP_REGISTRY,
} from "../types/desktop";
import { soundFx } from "../lib/soundFx";

const STORAGE_KEY = "portfolio_os_desktop_items_v2";

interface DesktopStoreState {
  items: DesktopItem[];
  activeFolderId: string | null;
  namingModal: { isOpen: boolean; folderId: string; initialName: string } | null;

  // Actions
  moveItem: (id: string, x: number, y: number) => void;
  combineItems: (draggedId: string, targetId: string) => void;
  renameFolder: (folderId: string, newName: string) => void;
  removeAppFromFolder: (folderId: string, appId: string) => void;
  ungroupFolder: (folderId: string) => void;
  addAppToFolder: (folderId: string, appKey: string) => void;
  openFolder: (folderId: string) => void;
  closeFolder: () => void;
  openNamingModal: (folderId: string, currentName: string) => void;
  closeNamingModal: () => void;
  cleanUpDesktop: () => void;
  resetDesktop: () => void;
}

const loadStoredItems = (): DesktopItem[] => {
  if (typeof window === "undefined") return DEFAULT_DESKTOP_ITEMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DESKTOP_ITEMS;
    const parsed = JSON.parse(raw) as DesktopItem[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Validate structure
      return parsed.map((item) => {
        if (item.type === "folder") {
          return {
            ...item,
            apps: (item.apps || []).map((a) => {
              const reg = APP_REGISTRY[a.app];
              return {
                ...a,
                label: reg?.label || a.label,
                color: reg?.color || a.color,
              };
            }),
          };
        }
        const reg = APP_REGISTRY[item.app];
        return {
          ...item,
          label: reg?.label || item.label,
          color: reg?.color || item.color,
        };
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

  moveItem: (id: string, x: number, y: number) => {
    const updated = get().items.map((it) => {
      if (it.id === id) {
        return { ...it, x, y };
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

  removeAppFromFolder: (folderId: string, appId: string) => {
    const current = get().items;
    const folderIdx = current.findIndex((it) => it.id === folderId && it.type === "folder");
    if (folderIdx === -1) return;

    const folder = current[folderIdx] as DesktopFolderItem;
    const appToExtract = folder.apps.find((a) => a.id === appId);
    if (!appToExtract) return;

    const remainingApps = folder.apps.filter((a) => a.id !== appId);

    let updated: DesktopItem[];
    if (remainingApps.length === 0) {
      // If folder is now empty, delete folder and put app on desktop
      updated = current
        .map((it) => (it.id === folderId ? appToExtract : it));
    } else {
      // Keep folder with remaining apps and add extracted app right after folder
      const updatedFolder: DesktopFolderItem = { ...folder, apps: remainingApps };
      updated = [...current];
      updated[folderIdx] = updatedFolder;
      updated.splice(folderIdx + 1, 0, appToExtract);
    }

    persistItems(updated);
    set({
      items: updated,
      activeFolderId: remainingApps.length === 0 ? null : get().activeFolderId,
    });
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

  openNamingModal: (folderId: string, currentName: string) => {
    set({
      namingModal: {
        isOpen: true,
        folderId,
        initialName: currentName,
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
