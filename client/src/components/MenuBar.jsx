import { useEffect, useRef, useState } from "react";
import {
  Wifi,
  Search,
  BatteryMedium,
  Check,
  X,
  Menu as MenuIcon,
} from "lucide-react";
import { useOS, APPS } from "../store/useOS";
import { useOutsideClick as useOutsideClose } from "../lib/useOutsideClick";
import LiveBadge from "./LiveBadge";
import codeXmlIcon from "../assets/code-xml.png"; // Import the icon

function MenuDropdown({ label, isOpen, onToggle, onClose, children }) {
  const ref = useRef(null);
  useOutsideClose(ref, onClose);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`px-3 py-0.5 rounded transition-colors cursor-default text-[14px] ${isOpen ? "bg-white/15 text-white" : "hover:text-white text-white/70"}`}>
        {label}
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1.5 min-w-[240px] glass rounded-lg border border-white/10 shadow-2xl py-1.5 z-[1300] origin-top-left"
          style={{ animation: "menuOpen 130ms cubic-bezier(.16,1,.3,1) both" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, disabled, checked, shortcut }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 text-left px-4 py-2 text-[14px] ${
        disabled
          ? "text-white/25 cursor-default"
          : "text-white/85 hover:bg-accent hover:text-white cursor-default"
      }`}>
      <span className="w-4 shrink-0">{checked && <Check size={14} />}</span>
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="text-[12px] text-white/35">{shortcut}</span>
      )}
    </button>
  );
}

function MenuSeparator() {
  return <div className="h-px bg-white/10 my-2" />;
}

function InfoModal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-6"
      onClick={onClose}>
      <div
        className="glass rounded-2xl max-w-sm w-full p-5 border border-white/10"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X size={14} />
          </button>
        </div>
        <div className="text-xs text-white/75 leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function MenuBar() {
  const {
    windows,
    openApp,
    closeWindow,
    minimizeWindow,
    focusWindow,
    reduceMotion,
    toggleMotion,
  } = useOS();
  const [now, setNow] = useState(new Date());
  const [openMenu, setOpenMenu] = useState(null);
  const [modal, setModal] = useState(null); // "about" | "shortcuts" | null
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const searchRef = useRef(null);
  const searchWrapRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useOutsideClose(searchWrapRef, () => setSearchOpen(false));

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const focusedId = windows.length
    ? windows.reduce((a, b) => (a.z > b.z ? a : b)).id
    : null;

  const appMatches = Object.entries(APPS)
    .filter(([key, meta]) =>
      meta.title.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 6);

  const runSearch = () => {
    if (appMatches.length) {
      openApp(appMatches[0][0]);
      setQuery("");
      setSearchOpen(false);
    }
  };

  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const m = (name) => ({
    isOpen: openMenu === name,
    onToggle: () => setOpenMenu((o) => (o === name ? null : name)),
    onClose: () => setOpenMenu((o) => (o === name ? null : o)),
  });

  return (
    <div className="absolute top-0 left-0 right-0 h-8 z-[999] glass flex items-center justify-between px-3 sm:px-4 text-[14px] text-white/80 select-none">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        {/* Icon with responsive sizing */}
        <div className="flex items-center shrink-0">
          <img
            src={codeXmlIcon}
            alt="Code XML"
            className="h-5 w-5 sm:h-5 md:h-6 object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>

        <button
          onClick={() => setMobileSheetOpen(true)}
          className="sm:hidden p-1 -ml-1 hover:bg-white/10 rounded">
          <MenuIcon size={16} />
        </button>

        <div className="hidden sm:flex items-center gap-1">
          <MenuDropdown label="File" {...m("file")}>
            <MenuItem
              onClick={() => {
                openApp("files");
                setOpenMenu(null);
              }}>
              New Window
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("resume");
                setOpenMenu(null);
              }}>
              Open Resume
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              disabled={!focusedId}
              onClick={() => {
                closeWindow(focusedId);
                setOpenMenu(null);
              }}
              shortcut="⌘W">
              Close Window
            </MenuItem>
          </MenuDropdown>

          <MenuDropdown label="Edit" {...m("edit")}>
            <MenuItem disabled shortcut="⌘Z">
              Undo
            </MenuItem>
            <MenuItem disabled shortcut="⇧⌘Z">
              Redo
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setOpenMenu(null);
              }}
              shortcut="⌘C">
              Copy Portfolio Link
            </MenuItem>
          </MenuDropdown>

          <MenuDropdown label="View" {...m("view")}>
            <MenuItem
              onClick={() => {
                toggleFullscreen();
                setOpenMenu(null);
              }}>
              {fullscreen ? "Exit Full Screen" : "Enter Full Screen"}
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              checked={reduceMotion}
              onClick={() => {
                toggleMotion();
                setOpenMenu(null);
              }}>
              Reduce Motion
            </MenuItem>
            <MenuItem
              disabled={!windows.length}
              onClick={() => {
                windows.forEach((w) => minimizeWindow(w.id));
                setOpenMenu(null);
              }}>
              Show Desktop
            </MenuItem>
          </MenuDropdown>

          <MenuDropdown label="Window" {...m("window")}>
            {windows.length === 0 && (
              <MenuItem disabled>No Open Windows</MenuItem>
            )}
            {windows.map((w) => (
              <MenuItem
                key={w.id}
                checked={w.id === focusedId}
                onClick={() => {
                  focusWindow(w.id);
                  setOpenMenu(null);
                }}>
                {w.title}
              </MenuItem>
            ))}
            {windows.length > 0 && (
              <>
                <MenuSeparator />
                <MenuItem
                  onClick={() => {
                    windows.forEach((w) => minimizeWindow(w.id));
                    setOpenMenu(null);
                  }}>
                  Minimize All
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    windows.forEach((w) => closeWindow(w.id));
                    setOpenMenu(null);
                  }}>
                  Close All
                </MenuItem>
              </>
            )}
          </MenuDropdown>

          <MenuDropdown label="Help" {...m("help")}>
            <MenuItem
              onClick={() => {
                setModal("about");
                setOpenMenu(null);
              }}>
              About This Portfolio
            </MenuItem>
            <MenuItem
              onClick={() => {
                setModal("shortcuts");
                setOpenMenu(null);
              }}>
              Keyboard Shortcuts
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                openApp("chats");
                setOpenMenu(null);
              }}>
              Say Hi in Chat
            </MenuItem>
          </MenuDropdown>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 text-white/70">
        <div
          data-search-wrap
          ref={searchWrapRef}
          className="relative flex items-center">
          {searchOpen ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch();
              }}
              className="flex items-center gap-1.5 bg-white/10 rounded-md px-2.5 py-1">
              <Search size={14} className="text-white/40 shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
                placeholder="Search apps…"
                className="bg-transparent outline-none text-[13px] w-32 sm:w-44"
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="hover:text-white transition-colors p-1">
              <Search size={15} />
            </button>
          )}
          {searchOpen && query && appMatches.length > 0 && (
            <div className="absolute top-full right-0 mt-1.5 min-w-[200px] glass rounded-lg border border-white/10 shadow-2xl py-1.5 z-[1300]">
              {appMatches.map(([key, meta]) => (
                <button
                  key={key}
                  onMouseDown={() => {
                    openApp(key);
                    setQuery("");
                    setSearchOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] text-white/80 hover:bg-accent hover:text-white">
                  {meta.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <LiveBadge compact />
        <Wifi size={14} className="hidden xs:inline" />
        <BatteryMedium size={16} className="hidden xs:inline" />
        <span className="font-mono text-white/85 text-[12px] sm:text-[14px] whitespace-nowrap">
          <span className="hidden sm:inline">{date} · </span>
          {time}
        </span>
      </div>

      {mobileSheetOpen && (
        <div
          className="fixed inset-0 z-[2000] bg-black/60 flex items-end sm:items-center justify-center"
          onClick={() => setMobileSheetOpen(false)}>
          <div
            className="glass rounded-t-2xl sm:rounded-2xl w-full sm:w-80 max-h-[75vh] overflow-y-auto thin-scroll border border-white/10 p-2"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "menuOpen 160ms cubic-bezier(.16,1,.3,1) both",
            }}>
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                Menu
              </span>
              <button
                onClick={() => setMobileSheetOpen(false)}
                className="p-1 hover:bg-white/10 rounded">
                <X size={14} />
              </button>
            </div>

            <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-white/35">
              File
            </div>
            <MenuItem
              onClick={() => {
                openApp("files");
                setMobileSheetOpen(false);
              }}>
              New Window
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("resume");
                setMobileSheetOpen(false);
              }}>
              Open Resume
            </MenuItem>
            <MenuItem
              disabled={!focusedId}
              onClick={() => {
                closeWindow(focusedId);
                setMobileSheetOpen(false);
              }}>
              Close Window
            </MenuItem>

            <div className="px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-white/35">
              View
            </div>
            <MenuItem
              onClick={() => {
                toggleFullscreen();
                setMobileSheetOpen(false);
              }}>
              {fullscreen ? "Exit Full Screen" : "Enter Full Screen"}
            </MenuItem>
            <MenuItem
              checked={reduceMotion}
              onClick={() => {
                toggleMotion();
                setMobileSheetOpen(false);
              }}>
              Reduce Motion
            </MenuItem>
            <MenuItem
              disabled={!windows.length}
              onClick={() => {
                windows.forEach((w) => minimizeWindow(w.id));
                setMobileSheetOpen(false);
              }}>
              Show Desktop
            </MenuItem>

            <div className="px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-white/35">
              Window
            </div>
            {windows.length === 0 && (
              <MenuItem disabled>No Open Windows</MenuItem>
            )}
            {windows.map((w) => (
              <MenuItem
                key={w.id}
                checked={w.id === focusedId}
                onClick={() => {
                  focusWindow(w.id);
                  setMobileSheetOpen(false);
                }}>
                {w.title}
              </MenuItem>
            ))}
            {windows.length > 0 && (
              <MenuItem
                onClick={() => {
                  windows.forEach((w) => closeWindow(w.id));
                  setMobileSheetOpen(false);
                }}>
                Close All
              </MenuItem>
            )}

            <div className="px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-white/35">
              Help
            </div>
            <MenuItem
              onClick={() => {
                setModal("about");
                setMobileSheetOpen(false);
              }}>
              About This Portfolio
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("chats");
                setMobileSheetOpen(false);
              }}>
              Say Hi in Chat
            </MenuItem>
          </div>
        </div>
      )}

      {modal === "about" && (
        <InfoModal title="About This Portfolio" onClose={() => setModal(null)}>
          <p>
            A desktop-style portfolio built with React, Vite, Tailwind, and a
            real-time Socket.IO backend.
          </p>
          <p>
            Switch between macOS and Windows 11 shells anytime from Settings —
            same apps and data underneath either way.
          </p>
        </InfoModal>
      )}
      {modal === "shortcuts" && (
        <InfoModal title="Keyboard Shortcuts" onClose={() => setModal(null)}>
          <div className="flex justify-between">
            <span>Close focused window</span>
            <span className="font-mono text-white/50">⌘W</span>
          </div>
          <div className="flex justify-between">
            <span>Copy portfolio link</span>
            <span className="font-mono text-white/50">⌘C</span>
          </div>
          <div className="flex justify-between">
            <span>Close gallery/lightbox</span>
            <span className="font-mono text-white/50">Esc</span>
          </div>
          <div className="flex justify-between">
            <span>Navigate gallery</span>
            <span className="font-mono text-white/50">← →</span>
          </div>
        </InfoModal>
      )}
    </div>
  );
}
