import { useState, useRef, type ComponentType, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutsideClick } from "../../lib/useOutsideClick";
import { GIconChevronDown, GIconCheck } from "../icons/GravityIcons";
import { soundFx } from "../../lib/soundFx";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  icon?: ComponentType<{ size?: number; className?: string; color?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface CustomDropdownProps<T extends string = string> {
  value: T;
  onChange: (val: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  containerClassName?: string;
  align?: "left" | "right";
  size?: "xs" | "sm" | "md";
  disabled?: boolean;
}

export default function CustomDropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  menuClassName = "",
  containerClassName = "",
  align = "left",
  size = "sm",
  disabled = false,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useOutsideClick(containerRef, () => setIsOpen(false));

  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = (val: T) => {
    soundFx.playClick();
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Size variations
  const sizeClasses = {
    xs: "px-2 py-0.5 text-[10px] rounded-md gap-1",
    sm: "px-2.5 py-1 text-xs rounded-lg gap-1.5",
    md: "px-3 py-1.5 text-xs sm:text-sm rounded-xl gap-2",
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative ${containerClassName || "inline-block"} text-left ${isOpen ? "z-50" : "z-10"}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            soundFx.playClick();
            setIsOpen(!isOpen);
          }
        }}
        onKeyDown={handleKeyDown}
        className={`focus-stroke flex items-center justify-between bg-white/5 border border-white/10 text-white/90 font-medium transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen
            ? "border-[#0091ff] ring-2 ring-[#0091ff]/40 shadow-[0_0_14px_rgba(0,145,255,0.28)] bg-white/10 text-white"
            : "hover:bg-white/10 hover:border-white/20"
        } ${sizeClasses} ${className}`}
      >
        <span className="flex items-center gap-1.5 truncate min-w-0 flex-1">
          {selectedOption?.icon && (
            <selectedOption.icon size={size === "xs" ? 11 : 13} className="shrink-0 text-white/60" />
          )}
          <span className="truncate min-w-0">{selectedOption ? selectedOption.label : placeholder}</span>
          {selectedOption?.badge && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono border ${
                selectedOption.badgeColor || "bg-white/10 text-white/60 border-white/10"
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </span>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="text-white/40 shrink-0 ml-1"
        >
          <GIconChevronDown size={size === "xs" ? 10 : 12} />
        </motion.span>
      </button>

      {/* Floating Glass Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`absolute z-[250] mt-1.5 min-w-[140px] max-w-[calc(100vw-32px)] sm:max-w-[260px] max-h-60 overflow-y-auto thin-scroll p-1 rounded-xl bg-[#0b101c]/95 border border-white/20 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 ${
              align === "right" ? "right-0" : "left-0"
            } ${menuClassName}`}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer select-none text-left ${
                    isSelected
                      ? "bg-[#0091ff]/20 text-white font-semibold border border-[#0091ff]/40 shadow-xs"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {Icon && <Icon size={12} className={isSelected ? "text-[#0091ff]" : "text-white/40"} />}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono border ${
                          opt.badgeColor || "bg-white/10 text-white/50 border-white/10"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </span>

                  {isSelected && (
                    <GIconCheck size={12} className="text-[#0091ff] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
