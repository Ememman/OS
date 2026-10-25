import { useEffect } from "react";

/**
 * Closes a popover/dropdown when the user clicks outside it or presses Escape.
 * Shared across menu dropdowns, taskbar flyouts, and the mobile action sheet.
 */
export function useOutsideClick(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    const onKey = (e) => e.key === "Escape" && onOutside();
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onOutside]);
}
