/**
 * Adaptive UI/UX Color Harmonizer for Portfolio OS
 * Calibrates any user-picked color to be eye-friendly, WCAG compliant,
 * and harmoniously blended across dark and light glassmorphism themes.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
}

export interface HarmonizedPalette {
  raw: string; // original input
  rgb: string; // "r g b" format for CSS rgb(var(--accent))
  hex: string; // "#rrggbb"
  hsl: HSL;
  contrastText: "#ffffff" | "#0b0f19";
  hoverRgb: string;
  activeRgb: string;
  subtle: string; // "rgba(r, g, b, 0.15)"
  border: string; // "rgba(r, g, b, 0.32)"
  glow: string;
  gradient: string;
  wcagContrast: string; // e.g. "6.8:1"
  mode: "night" | "light";
}

/**
 * Parse any raw color input (space-separated "r g b", hex "#rgb", "#rrggbb", or "rgb(r,g,b)")
 */
export function parseColor(input: string): RGB {
  const trimmed = input.trim();

  // 1. Space-separated "232 84 63"
  const spaceParts = trimmed.split(/\s+/).map(Number);
  if (spaceParts.length === 3 && spaceParts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
    return { r: spaceParts[0], g: spaceParts[1], b: spaceParts[2] };
  }

  // 2. Hex formats: "#fff", "#ffffff", "fff", "ffffff"
  let cleanHex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return {
      r: parseInt(cleanHex.slice(0, 2), 16),
      g: parseInt(cleanHex.slice(2, 4), 16),
      b: parseInt(cleanHex.slice(4, 6), 16),
    };
  }

  // 3. rgb(r, g, b)
  const rgbMatch = trimmed.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Default fallback (Portfolio OS System Electric Blue)
  return { r: 59, g: 130, b: 246 };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / delta + 2) * 60;
        break;
      case b:
        h = ((r - g) / delta + 4) * 60;
        break;
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = (hsl.h % 360) / 360;
  const s = Math.max(0, Math.min(100, hsl.s)) / 100;
  const l = Math.max(0, Math.min(100, hsl.l)) / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tAdj = t;
    if (tAdj < 0) tAdj += 1;
    if (tAdj > 1) tAdj -= 1;
    if (tAdj < 1 / 6) return p + (q - p) * 6 * tAdj;
    if (tAdj < 1 / 2) return q;
    if (tAdj < 2 / 3) return p + (q - p) * (2 / 3 - tAdj) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

/**
 * Convert RGB to Hex string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Calculate WCAG Relative Luminance
 */
export function getRelativeLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG Contrast Ratio between two relative luminances
 */
export function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Core Harmonization Algorithm:
 * Takes ANY raw user-picked color (even pure neon #00FF00, harsh electric yellow, or muddy brown)
 * and calibrates it into an eye-friendly, UI/UX harmonious palette that matches the OS theme mode.
 */
export function harmonizeAccentColor(
  rawInput: string,
  isNight: boolean = true
): HarmonizedPalette {
  const rawRgb = parseColor(rawInput);
  const hsl = rgbToHsl(rawRgb);

  // 1. Balance Saturation (eliminates harsh neon glare without losing chromatic identity)
  // Human eye is fatigued by 100% saturation on dark or light interfaces.
  // We clamp saturation to a tasteful, rich range [58%, 86%].
  let targetS = hsl.s;
  if (targetS > 86) {
    targetS = 84; // Soften extreme neon
  } else if (targetS < 45 && hsl.l < 90 && hsl.l > 10) {
    targetS = 58; // Give subtle vibrancy to washed out muddy tones
  }

  // 2. Calibrate Lightness based on Hue & Theme Mode (Night vs Light)
  // Certain hues (Yellow/Lime, 50-95 deg) have naturally high luminance, while Blues (210-260 deg) have low luminance.
  let targetL = hsl.l;
  const isYellowOrLime = hsl.h >= 45 && hsl.h <= 95;
  const isBlueOrViolet = hsl.h >= 210 && hsl.h <= 275;

  if (isNight) {
    // NIGHT MODE:
    // Electric blue / accents need clean contrast against deep glass #0a0a0f
    if (isYellowOrLime) {
      targetL = Math.max(50, Math.min(62, targetL));
    } else if (isBlueOrViolet) {
      targetL = Math.max(60, Math.min(68, targetL));
    } else {
      targetL = Math.max(54, Math.min(66, targetL));
    }
  } else {
    // LIGHT MODE:
    // Deeper tone for clean contrast against light frosted surfaces
    if (isYellowOrLime) {
      targetL = Math.max(36, Math.min(46, targetL));
    } else if (isBlueOrViolet) {
      targetL = Math.max(45, Math.min(52, targetL));
    } else {
      targetL = Math.max(38, Math.min(48, targetL));
    }
  }

  const harmonizedHsl: HSL = {
    h: hsl.h,
    s: targetS,
    l: targetL,
  };

  const harmonizedRgb = hslToRgb(harmonizedHsl);
  const hex = rgbToHex(harmonizedRgb);
  const rgbString = `${harmonizedRgb.r} ${harmonizedRgb.g} ${harmonizedRgb.b}`;

  // 3. Optimal Contrast Text: Determine whether text ON TOP of this accent should be white or dark
  const lum = getRelativeLuminance(harmonizedRgb);
  const whiteLum = 1.0;
  const darkLum = getRelativeLuminance({ r: 11, g: 15, b: 25 }); // #0b0f19

  const whiteContrast = getContrastRatio(whiteLum, lum);
  const darkContrast = getContrastRatio(lum, darkLum);

  // If contrast against dark text is significantly better (e.g. bright cyan or amber), use dark text
  const contrastText: "#ffffff" | "#0b0f19" =
    darkContrast >= 4.5 && darkContrast > whiteContrast ? "#0b0f19" : "#ffffff";
  const activeRatio = Math.max(whiteContrast, darkContrast);

  // 4. Hover & Active (Clicking) States
  // Hover: brighter with glowing lift
  const hoverHsl: HSL = {
    h: harmonizedHsl.h,
    s: Math.min(95, harmonizedHsl.s + 4),
    l: isNight
      ? Math.min(78, harmonizedHsl.l + 8)
      : Math.max(30, harmonizedHsl.l - 6),
  };
  const hoverRgbObj = hslToRgb(hoverHsl);
  const hoverRgb = `${hoverRgbObj.r} ${hoverRgbObj.g} ${hoverRgbObj.b}`;

  // Active / Clicking: deeper, saturated pressed tone
  const activeHsl: HSL = {
    h: harmonizedHsl.h,
    s: Math.min(100, harmonizedHsl.s + 6),
    l: isNight
      ? Math.max(42, harmonizedHsl.l - 8)
      : Math.min(65, harmonizedHsl.l + 8),
  };
  const activeRgbObj = hslToRgb(activeHsl);
  const activeRgb = `${activeRgbObj.r} ${activeRgbObj.g} ${activeRgbObj.b}`;

  // 5. Secondary analogous hue for harmonious gradients
  const gradientHsl: HSL = {
    h: (harmonizedHsl.h + 20) % 360,
    s: harmonizedHsl.s,
    l: harmonizedHsl.l,
  };
  const gradientRgbObj = hslToRgb(gradientHsl);

  return {
    raw: rawInput,
    rgb: rgbString,
    hex,
    hsl: harmonizedHsl,
    contrastText,
    hoverRgb,
    activeRgb,
    subtle: `rgba(${rgbString.split(" ").join(", ")}, 0.14)`,
    border: `rgba(${rgbString.split(" ").join(", ")}, 0.32)`,
    glow: `0 0 24px rgba(${rgbString.split(" ").join(", ")}, 0.38)`,
    gradient: `linear-gradient(135deg, rgb(${rgbString.split(" ").join(", ")}), rgb(${gradientRgbObj.r}, ${gradientRgbObj.g}, ${gradientRgbObj.b}))`,
    wcagContrast: `${activeRatio.toFixed(1)}:1`,
    mode: isNight ? "night" : "light",
  };
}

/**
 * Apply the harmonized palette directly to the document root element
 */
export function applyHarmonizedPaletteToDoc(palette: HarmonizedPalette, _isNight: boolean = true) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.style.setProperty("--accent", palette.rgb);
  root.style.setProperty("--accent-hex", palette.hex);
  root.style.setProperty("--accent-hover", palette.hoverRgb);
  root.style.setProperty("--accent-active", palette.activeRgb);
  root.style.setProperty("--accent-contrast", palette.contrastText);
  root.style.setProperty("--accent-subtle", palette.subtle);
  root.style.setProperty("--accent-border", palette.border);
  root.style.setProperty("--accent-glow", palette.glow);
  root.style.setProperty("--accent-gradient", palette.gradient);

  // Default to native dark-theme
  root.removeAttribute("data-theme");
  root.classList.remove("light-theme");
  root.classList.add("dark-theme");
}
