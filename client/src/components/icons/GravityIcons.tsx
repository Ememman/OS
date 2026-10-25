import React from "react";
import * as GIcons from "@gravity-ui/icons";

/**
 * Universal wrapper for Gravity UI Icons.
 * Normalizes props (size, className, color) to integrate cleanly across Portfolio OS.
 */
export function GravityIcon({
  icon: IconComponent,
  size = 16,
  className = "",
  color,
  style,
  ...props
}: {
  icon: any;
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  if (!IconComponent) return null;

  const customStyle: React.CSSProperties = {
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

// App Launch Icons
export const GIconTerminal = (props: any) => <GravityIcon icon={GIcons.Terminal} {...props} />;
export const GIconLibrary = (props: any) => <GravityIcon icon={GIcons.Books || GIcons.BookOpen} {...props} />;
export const GIconMusic = (props: any) => <GravityIcon icon={GIcons.MusicNote} {...props} />;
export const GIconUpdates = (props: any) => <GravityIcon icon={GIcons.Bell} {...props} />;
export const GIconChats = (props: any) => <GravityIcon icon={GIcons.Comment} {...props} />;
export const GIconGallery = (props: any) => <GravityIcon icon={GIcons.Picture} {...props} />;
export const GIconGames = (props: any) => <GravityIcon icon={GIcons.Puzzle || GIcons.Cube} {...props} />;
export const GIconFiles = (props: any) => <GravityIcon icon={GIcons.FolderOpen || GIcons.Folder} {...props} />;
export const GIconSettings = (props: any) => <GravityIcon icon={GIcons.Gear} {...props} />;
export const GIconResume = (props: any) => <GravityIcon icon={GIcons.Person || GIcons.FileText} {...props} />;
export const GIconCalculator = (props: any) => <GravityIcon icon={GIcons.Calculator} {...props} />;
export const GIconNotes = (props: any) => <GravityIcon icon={GIcons.PencilToSquare || GIcons.Pencil} {...props} />;

// Window & Action Controls
export const GIconClose = (props: any) => <GravityIcon icon={GIcons.Xmark} {...props} />;
export const GIconMinus = (props: any) => <GravityIcon icon={GIcons.Minus} {...props} />;
export const GIconSquare = (props: any) => <GravityIcon icon={GIcons.Square} {...props} />;
export const GIconMaximize = (props: any) => <GravityIcon icon={GIcons.ArrowsExpand || GIcons.Square} {...props} />;
export const GIconSearch = (props: any) => <GravityIcon icon={GIcons.Magnifier} {...props} />;
export const GIconTrash = (props: any) => <GravityIcon icon={GIcons.TrashBin} {...props} />;
export const GIconCode = (props: any) => <GravityIcon icon={GIcons.Code} {...props} />;
export const GIconCheck = (props: any) => <GravityIcon icon={GIcons.Check} {...props} />;
export const GIconCheckDouble = (props: any) => <GravityIcon icon={GIcons.CheckDouble || GIcons.Check} {...props} />;
export const GIconPlus = (props: any) => <GravityIcon icon={GIcons.Plus} {...props} />;
export const GIconPercent = (props: any) => <GravityIcon icon={GIcons.Percent} {...props} />;

// Snap Layout Icons
export const GIconLayoutColumns = (props: any) => <GravityIcon icon={GIcons.LayoutColumns} {...props} />;
export const GIconLayoutRows = (props: any) => <GravityIcon icon={GIcons.LayoutRows} {...props} />;
export const GIconLayoutHeader = (props: any) => <GravityIcon icon={GIcons.LayoutHeader} {...props} />;
export const GIconLayoutCells = (props: any) => <GravityIcon icon={GIcons.LayoutCells} {...props} />;

// Files & Folders
export const GIconFolder = (props: any) => <GravityIcon icon={GIcons.Folder} {...props} />;
export const GIconFolderOpen = (props: any) => <GravityIcon icon={GIcons.FolderOpen || GIcons.Folder} {...props} />;
export const GIconFile = (props: any) => <GravityIcon icon={GIcons.File} {...props} />;
export const GIconFileText = (props: any) => <GravityIcon icon={GIcons.FileText || GIcons.File} {...props} />;
export const GIconFileCode = (props: any) => <GravityIcon icon={GIcons.FileCode || GIcons.Code} {...props} />;
export const GIconHardDrive = (props: any) => <GravityIcon icon={GIcons.HardDrive || GIcons.Folder} {...props} />;

// Weather & Environment
export const GIconCloud = (props: any) => <GravityIcon icon={GIcons.Cloud} {...props} />;
export const GIconClouds = (props: any) => <GravityIcon icon={GIcons.Clouds || GIcons.Cloud} {...props} />;
export const GIconSun = (props: any) => <GravityIcon icon={GIcons.Sun} {...props} />;
export const GIconMoon = (props: any) => <GravityIcon icon={GIcons.Moon} {...props} />;
export const GIconDroplet = (props: any) => <GravityIcon icon={GIcons.Droplet} {...props} />;
export const GIconSnowflake = (props: any) => <GravityIcon icon={GIcons.Snowflake} {...props} />;

// Media & Audio Playback
export const GIconPlay = (props: any) => <GravityIcon icon={GIcons.Play} {...props} />;
export const GIconPause = (props: any) => <GravityIcon icon={GIcons.Pause} {...props} />;
export const GIconForward = (props: any) => <GravityIcon icon={GIcons.ForwardStep || GIcons.Play} {...props} />;
export const GIconBackward = (props: any) => <GravityIcon icon={GIcons.BackwardStep || GIcons.Play} {...props} />;
export const GIconVolume = (props: any) => <GravityIcon icon={GIcons.Volume} {...props} />;
export const GIconVolumeLow = (props: any) => <GravityIcon icon={GIcons.VolumeLow || GIcons.Volume} {...props} />;
export const GIconVolumeMute = (props: any) => <GravityIcon icon={GIcons.VolumeOff || GIcons.VolumeXmark} {...props} />;
export const GIconBarsPlay = (props: any) => <GravityIcon icon={GIcons.BarsPlay || GIcons.Play} {...props} />;
export const GIconDisplayPulse = (props: any) => <GravityIcon icon={GIcons.DisplayPulse || GIcons.Display} {...props} />;

// Navigation & Chevrons
export const GIconChevronDown = (props: any) => <GravityIcon icon={GIcons.ArrowChevronDown} {...props} />;
export const GIconChevronUp = (props: any) => <GravityIcon icon={GIcons.ArrowChevronUp} {...props} />;
export const GIconChevronLeft = (props: any) => <GravityIcon icon={GIcons.ArrowChevronLeft} {...props} />;
export const GIconChevronRight = (props: any) => <GravityIcon icon={GIcons.ArrowChevronRight} {...props} />;
export const GIconArrowLeft = (props: any) => <GravityIcon icon={GIcons.ArrowLeft} {...props} />;
export const GIconRotateRight = (props: any) => <GravityIcon icon={GIcons.ArrowsRotateRight || GIcons.ArrowRotateRight} {...props} />;
export const GIconRotateLeft = (props: any) => <GravityIcon icon={GIcons.ArrowsRotateLeft || GIcons.ArrowRotateLeft} {...props} />;

// Status, Utility & Actions
export const GIconClock = (props: any) => <GravityIcon icon={GIcons.Clock} {...props} />;
export const GIconCalendar = (props: any) => <GravityIcon icon={GIcons.Calendar} {...props} />;
export const GIconSparkles = (props: any) => <GravityIcon icon={GIcons.Sparkles} {...props} />;
export const GIconStar = (props: any) => <GravityIcon icon={GIcons.Star} {...props} />;
export const GIconHeart = (props: any) => <GravityIcon icon={GIcons.Heart} {...props} />;
export const GIconTrophy = (props: any) => <GravityIcon icon={GIcons.Cup || GIcons.Star} {...props} />;
export const GIconPuzzle = (props: any) => <GravityIcon icon={GIcons.Puzzle || GIcons.Cube} {...props} />;
export const GIconPaperPlane = (props: any) => <GravityIcon icon={GIcons.PaperPlane} {...props} />;
export const GIconPerson = (props: any) => <GravityIcon icon={GIcons.Person} {...props} />;
export const GIconPersons = (props: any) => <GravityIcon icon={GIcons.Persons || GIcons.Person} {...props} />;
export const GIconPencil = (props: any) => <GravityIcon icon={GIcons.Pencil} {...props} />;
export const GIconExternalLink = (props: any) => <GravityIcon icon={GIcons.ArrowUpRightFromSquare || GIcons.Link} {...props} />;
export const GIconGithub = (props: any) => <GravityIcon icon={GIcons.LogoGithub || GIcons.Code} {...props} />;
export const GIconDownload = (props: any) => <GravityIcon icon={GIcons.ArrowDownToLine} {...props} />;
export const GIconMail = (props: any) => <GravityIcon icon={GIcons.Envelope} {...props} />;
export const GIconMapPin = (props: any) => <GravityIcon icon={GIcons.GeoPin || GIcons.MapPin} {...props} />;
export const GIconLock = (props: any) => <GravityIcon icon={GIcons.Lock} {...props} />;
export const GIconLockOpen = (props: any) => <GravityIcon icon={GIcons.LockOpen} {...props} />;
export const GIconRocket = (props: any) => <GravityIcon icon={GIcons.Rocket} {...props} />;
export const GIconWrench = (props: any) => <GravityIcon icon={GIcons.Wrench} {...props} />;
export const GIconList = (props: any) => <GravityIcon icon={GIcons.LayoutList || GIcons.SquareListUl} {...props} />;
export const GIconLoader = (props: any) => <GravityIcon icon={GIcons.CircleDashed || GIcons.ArrowsRotateRight} className={`animate-spin ${props.className || ""}`} {...props} />;
export const GIconSliders = (props: any) => <GravityIcon icon={GIcons.Sliders} {...props} />;
export const GIconBars = (props: any) => <GravityIcon icon={GIcons.Bars} {...props} />;
export const GIconSignal = (props: any) => <GravityIcon icon={GIcons.Signal || GIcons.AntennaSignal} {...props} />;
export const GIconPower = (props: any) => <GravityIcon icon={GIcons.Power || GIcons.PlugConnection} {...props} />;

export default GIcons;
