import React from "react";
import * as GIcons from "@gravity-ui/icons";

/**
 * Universal wrapper for Gravity UI Icons.
 * Normalizes props (size, className, color) to play nicely with Tailwind and OS components.
 */
export function GravityIcon({ icon: IconComponent, size = 16, className = "", color, style, ...props }) {
  if (!IconComponent) return null;
  
  const customStyle = {
    ...(color ? { color } : {}),
    ...style,
  };

  return (
    <IconComponent
      width={size}
      height={size}
      className={`inline-block shrink-0 transition-colors ${className}`}
      style={customStyle}
      {...props}
    />
  );
}

// System App Icons (Gravity UI)
export const GIconTerminal = (props) => <GravityIcon icon={GIcons.Terminal} {...props} />;
export const GIconLibrary = (props) => <GravityIcon icon={GIcons.Books || GIcons.BookOpen} {...props} />;
export const GIconMusic = (props) => <GravityIcon icon={GIcons.MusicNote} {...props} />;
export const GIconUpdates = (props) => <GravityIcon icon={GIcons.Bell} {...props} />;
export const GIconChats = (props) => <GravityIcon icon={GIcons.Comment} {...props} />;
export const GIconGallery = (props) => <GravityIcon icon={GIcons.Picture} {...props} />;
export const GIconGames = (props) => <GravityIcon icon={GIcons.Puzzle || GIcons.Cube} {...props} />;
export const GIconFiles = (props) => <GravityIcon icon={GIcons.FolderOpen || GIcons.Folder} {...props} />;
export const GIconSettings = (props) => <GravityIcon icon={GIcons.Gear} {...props} />;
export const GIconResume = (props) => <GravityIcon icon={GIcons.Person || GIcons.FileText} {...props} />;

// Window & System Controls
export const GIconClose = (props) => <GravityIcon icon={GIcons.Xmark} {...props} />;
export const GIconMinus = (props) => <GravityIcon icon={GIcons.Minus} {...props} />;
export const GIconSquare = (props) => <GravityIcon icon={GIcons.Square} {...props} />;
export const GIconMaximize = (props) => <GravityIcon icon={GIcons.ArrowsExpand || GIcons.Square} {...props} />;
export const GIconSearch = (props) => <GravityIcon icon={GIcons.Magnifier} {...props} />;
export const GIconTrash = (props) => <GravityIcon icon={GIcons.TrashBin} {...props} />;
export const GIconCode = (props) => <GravityIcon icon={GIcons.Code} {...props} />;
export const GIconCheck = (props) => <GravityIcon icon={GIcons.Check} {...props} />;

// Status Bar & Indicator Icons
export const GIconSignal = (props) => <GravityIcon icon={GIcons.Signal || GIcons.AntennaSignal} {...props} />;
export const GIconPower = (props) => <GravityIcon icon={GIcons.Power || GIcons.PlugConnection} {...props} />;
export const GIconVolume = (props) => <GravityIcon icon={GIcons.Volume} {...props} />;
export const GIconVolumeMute = (props) => <GravityIcon icon={GIcons.VolumeOff} {...props} />;
export const GIconMoon = (props) => <GravityIcon icon={GIcons.Moon} {...props} />;
export const GIconSun = (props) => <GravityIcon icon={GIcons.Sun} {...props} />;
export const GIconSliders = (props) => <GravityIcon icon={GIcons.Sliders} {...props} />;
export const GIconClock = (props) => <GravityIcon icon={GIcons.Clock} {...props} />;
export const GIconCalendar = (props) => <GravityIcon icon={GIcons.Calendar} {...props} />;
export const GIconSparkles = (props) => <GravityIcon icon={GIcons.Sparkles} {...props} />;
export const GIconStar = (props) => <GravityIcon icon={GIcons.Star} {...props} />;

// Navigation Chevrons
export const GIconChevronDown = (props) => <GravityIcon icon={GIcons.ArrowChevronDown} {...props} />;
export const GIconChevronUp = (props) => <GravityIcon icon={GIcons.ArrowChevronUp} {...props} />;
export const GIconChevronLeft = (props) => <GravityIcon icon={GIcons.ArrowChevronLeft} {...props} />;
export const GIconChevronRight = (props) => <GravityIcon icon={GIcons.ArrowChevronRight} {...props} />;

// Audio Controls
export const GIconPlay = (props) => <GravityIcon icon={GIcons.Play} {...props} />;
export const GIconPause = (props) => <GravityIcon icon={GIcons.Pause} {...props} />;
export const GIconForward = (props) => <GravityIcon icon={GIcons.ForwardStep} {...props} />;
export const GIconBackward = (props) => <GravityIcon icon={GIcons.BackwardStep} {...props} />;

export default GIcons;

