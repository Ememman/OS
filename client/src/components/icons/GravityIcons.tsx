import React from "react";
import { Dice5, Megaphone } from "@gravity-ui/icons";
import * as GIcons from "@gravity-ui/icons";

type GravityIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

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
  icon: GravityIconComponent;
  size?: number;
  className?: string;
  color?: string;
} & Omit<React.SVGProps<SVGSVGElement>, "color">) {
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
export const GIconUpdates = (props: any) => <GravityIcon icon={Megaphone} {...props} />;
export const GIconChats = (props: any) => <GravityIcon icon={GIcons.Comment} {...props} />;
export const GIconGallery = (props: any) => <GravityIcon icon={GIcons.Picture} {...props} />;
export const GIconGames = (props: any) => <GravityIcon icon={Dice5} {...props} />;
export const GIconFiles = (props: any) => <GravityIcon icon={GIcons.FolderOpen || GIcons.Folder} {...props} />;
export const GIconSettings = (props: any) => <GravityIcon icon={GIcons.Gear} {...props} />;
export const GIconResume = (props: any) => <GravityIcon icon={GIcons.Person || GIcons.FileText} {...props} />;
export const GIconCalculator = (props: any) => <GravityIcon icon={GIcons.Calculator} {...props} />;
export const GIconNotes = (props: any) => <GravityIcon icon={GIcons.PencilToSquare || GIcons.Pencil} {...props} />;
export const GIconActivity = (props: any) => <GravityIcon icon={GIcons.DisplayPulse || GIcons.ChartLine || GIcons.HeartPulse} {...props} />;
export const GIconBookOpen = (props: any) => <GravityIcon icon={GIcons.BookOpen || GIcons.Books} {...props} />;

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
export const GIconBriefcase = (props: any) => <GravityIcon icon={(GIcons as any).Briefcase || (GIcons as any).Suitcase || GIcons.Folder} {...props} />;
export const GIconGraduationCap = (props: any) => <GravityIcon icon={(GIcons as any).GraduationCap || GIcons.BookOpen} {...props} />;
export const GIconPersons = (props: any) => <GravityIcon icon={GIcons.Persons || GIcons.Person} {...props} />;
export const GIconPencil = (props: any) => <GravityIcon icon={GIcons.Pencil} {...props} />;
export const GIconExternalLink = (props: any) => <GravityIcon icon={GIcons.ArrowUpRightFromSquare || GIcons.Link} {...props} />;
export const GIconGithub = (props: any) => <GravityIcon icon={GIcons.LogoGithub || GIcons.Code} {...props} />;
export const GIconLinkedin = (props: any) => (
  <svg width={props.size || 14} height={props.size || 14} viewBox="0 0 24 24" fill="currentColor" className={props.className}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.88a1.45 1.45 0 0 0-1.45 1.45c0 .8.65 1.45 1.45 1.45a1.45 1.45 0 0 0 1.45-1.45c0-.8-.65-1.45-1.45-1.45Z" />
  </svg>
);
export const GIconPrinter = (props: any) => (
  <svg width={props.size || 14} height={props.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
export const GIconPhone = (props: any) => (
  <svg width={props.size || 14} height={props.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
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
export const GIconCpu = (props: any) => <GravityIcon icon={GIcons.Cpu || GIcons.HardDrive} {...props} />;
export const GIconChartLine = (props: any) => <GravityIcon icon={GIcons.ChartLine || GIcons.ChartAreaStacked} {...props} />;
export const GIconHeartPulse = (props: any) => <GravityIcon icon={GIcons.HeartPulse || GIcons.Heart} {...props} />;
export const GIconSmile = (props: any) => <GravityIcon icon={GIcons.FaceSmile || GIcons.Person} {...props} />;
export const GIconHistory = (props: any) => <GravityIcon icon={GIcons.Clock || GIcons.ArrowsRotateRight} {...props} />;
export const GIconPin = (props: any) => <GravityIcon icon={GIcons.Pin || GIcons.Star} {...props} />;
export const GIconEye = (props: any) => <GravityIcon icon={GIcons.Eye || GIcons.Magnifier} {...props} />;
export const GIconCopy = (props: any) => <GravityIcon icon={GIcons.Copy || GIcons.File} {...props} />;
export const GIconFlame = (props: any) => <GravityIcon icon={(GIcons as any).Flame || GIcons.Star} {...props} />;
export const GIconThumbsUp = (props: any) => <GravityIcon icon={(GIcons as any).ThumbsUp || GIcons.Check} {...props} />;
export const GIconFlag = (props: any) => <GravityIcon icon={(GIcons as any).Flag} {...props} />;
export const GIconBug = (props: any) => <GravityIcon icon={(GIcons as any).Bug || GIcons.Code} {...props} />;
export const GIconTag = (props: any) => <GravityIcon icon={(GIcons as any).Tag || GIcons.Tags} {...props} />;
export const GIconHashtag = (props: any) => <GravityIcon icon={(GIcons as any).Hashtag} {...props} />;
export const GIconThunderbolt = (props: any) => <GravityIcon icon={(GIcons as any).Thunderbolt || GIcons.Sparkles} {...props} />;
export const GIconDice5 = (props: any) => <GravityIcon icon={Dice5} {...props} />;

export const GIconCamera = (props: any) => <GravityIcon icon={(GIcons as any).Camera} {...props} />;
export const GIconGlobe = (props: any) => <GravityIcon icon={(GIcons as any).Globe} {...props} />;
export const GIconLink = (props: any) => <GravityIcon icon={(GIcons as any).Link || (GIcons as any).ArrowUpRightFromSquare} {...props} />;
export const GIconUpload = (props: any) => <GravityIcon icon={(GIcons as any).ArrowUpFromLine || (GIcons as any).ArrowUpFromSquare} {...props} />;
export const GIconCircleInfo = (props: any) => <GravityIcon icon={GIcons.CircleInfo} {...props} />;
export const GIconBell = (props: any) => <GravityIcon icon={GIcons.Bell} {...props} />;

// Text Formatting & Editor
export const GIconBold = (props: any) => <GravityIcon icon={(GIcons as any).Bold} {...props} />;
export const GIconItalic = (props: any) => <GravityIcon icon={(GIcons as any).Italic} {...props} />;
export const GIconUnderline = (props: any) => <GravityIcon icon={(GIcons as any).Underline || (GIcons as any).LetterAUnderline} {...props} />;
export const GIconStrikethrough = (props: any) => <GravityIcon icon={(GIcons as any).Strikethrough} {...props} />;
export const GIconHeading1 = (props: any) => <GravityIcon icon={(GIcons as any).Heading1 || (GIcons as any).Heading} {...props} />;
export const GIconHeading2 = (props: any) => <GravityIcon icon={(GIcons as any).Heading2 || (GIcons as any).Heading} {...props} />;
export const GIconHeading3 = (props: any) => <GravityIcon icon={(GIcons as any).Heading3 || (GIcons as any).Heading} {...props} />;
export const GIconListUl = (props: any) => <GravityIcon icon={(GIcons as any).ListUl || (GIcons as any).SquareListUl} {...props} />;
export const GIconListOl = (props: any) => <GravityIcon icon={(GIcons as any).ListOl || (GIcons as any).LayoutList} {...props} />;
export const GIconListCheck = (props: any) => <GravityIcon icon={(GIcons as any).ListCheck || (GIcons as any).SquareCheck} {...props} />;
export const GIconQuote = (props: any) => <GravityIcon icon={(GIcons as any).QuoteOpen || (GIcons as any).QuoteClose} {...props} />;
export const GIconUndo = (props: any) => <GravityIcon icon={(GIcons as any).ArrowRotateLeft || (GIcons as any).ArrowsRotateLeft} {...props} />;
export const GIconRedo = (props: any) => <GravityIcon icon={(GIcons as any).ArrowRotateRight || (GIcons as any).ArrowsRotateRight} {...props} />;
export const GIconFontCursor = (props: any) => <GravityIcon icon={(GIcons as any).FontCursor || (GIcons as any).Font} {...props} />;

export default GIcons;
