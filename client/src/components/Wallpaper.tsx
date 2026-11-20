import { useOS } from "../store/useOS";
import StarfieldCanvas from "./StarfieldCanvas";
import { getAssetUrl } from "../lib/assets";

// Custom image wallpapers, resolved with getAssetUrl so they work
// identically in local dev and subpath production deployments (GitHub Pages).
const IMAGE_SRC: Record<string, string> = {
  bg1: getAssetUrl("wallpapers/BG_1.jpg"),
  bg2: getAssetUrl("wallpapers/BG_2.png"),
  bg3: getAssetUrl("wallpapers/BG_3.jpg"),
};

const FALLBACK_GRADIENT: Record<string, string> = {
  bg1: "linear-gradient(135deg, #1a1a2e, #16213e)",
  bg2: "linear-gradient(135deg, #0f0c29, #302b63)",
  bg3: "linear-gradient(135deg, #1a1a2e, #2d2b4a)",
};

function ImageScene({ id }: { id: string }) {
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
      style={{ background: FALLBACK_GRADIENT[id] || "#080c16" }}
    >
      <img
        src={IMAGE_SRC[id]}
        alt=""
        className="w-full h-full object-cover object-center sm:object-center select-none transform scale-[1.01] transition-transform duration-700"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      {/* Subtle vignette & contrast gradient for mobile portrait readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/35 to-black/50 sm:bg-black/40 pointer-events-none" />
    </div>
  );
}

function OceanScene() {
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(180deg, #050810 0%, #0A1220 38%, #101a2c 55%, #1b2740 68%, #0b1420 100%)",
      }}
    />
  );
}

function GalaxyScene() {
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, #1c1240 0%, #0a0818 45%, #050308 100%)",
      }}
    />
  );
}

function AuroraScene() {
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(180deg, #04070d 0%, #071018 45%, #0a1a1f 70%, #04090d 100%)",
      }}
    />
  );
}

function DarkNatureScene() {
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 90%, #0d2818 0%, #071a10 38%, #030d07 70%, #010402 100%)",
      }}
    >
      {/* Ethereal emerald mist & botanical gradient meshes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 25% 35%, rgba(16, 185, 129, 0.16) 0%, transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(5, 150, 105, 0.18) 0%, transparent 55%), radial-gradient(circle at 50% 85%, rgba(6, 78, 59, 0.35) 0%, transparent 60%)",
        }}
      />

      {/* Silhouetted evergreen pine forest horizon */}
      <div className="absolute inset-x-0 bottom-0 h-48 sm:h-64 pointer-events-none opacity-85">
        <svg
          viewBox="0 0 1200 320"
          preserveAspectRatio="none"
          className="w-full h-full text-[#020704] fill-current"
        >
          {/* Distant pine ridge */}
          <path
            opacity="0.45"
            d="M0,320 L0,220 L30,170 L60,220 L90,150 L120,210 L160,130 L200,200 L240,160 L280,220 L320,140 L360,210 L410,120 L460,200 L510,150 L560,220 L610,130 L660,210 L710,160 L760,220 L810,140 L860,210 L910,120 L960,200 L1010,150 L1060,210 L1110,130 L1160,190 L1200,160 L1200,320 Z"
          />
          {/* Foreground dense conifer silhouette */}
          <path
            d="M0,320 L0,250 L20,210 L45,260 L70,190 L95,250 L130,170 L165,245 L195,200 L225,260 L265,180 L305,250 L345,160 L385,245 L435,180 L485,260 L525,170 L565,250 L615,150 L665,240 L705,190 L745,255 L795,170 L845,245 L885,200 L925,260 L975,160 L1025,245 L1065,190 L1105,255 L1155,175 L1200,230 L1200,320 Z"
          />
        </svg>
      </div>

      {/* Atmospheric misty vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#010402] via-transparent to-[#020804]/60 pointer-events-none" />
    </div>
  );
}

export default function Wallpaper() {
  const wallpaper = useOS((s) => s.wallpaper);
  const themeMode = useOS((s) => s.themeMode);

  let scene = <OceanScene />;
  if (wallpaper === "bg1" || wallpaper === "bg2" || wallpaper === "bg3") {
    scene = <ImageScene id={wallpaper} />;
  } else if (wallpaper === "nature" || wallpaper === "dark-nature") {
    scene = <DarkNatureScene />;
  } else if (wallpaper === "galaxy") {
    scene = <GalaxyScene />;
  } else if (wallpaper === "aurora") {
    scene = <AuroraScene />;
  } else if (wallpaper.startsWith("data:") || wallpaper.startsWith("http") || wallpaper.startsWith("blob:")) {
    scene = (
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none bg-[#080c16]">
        <img
          src={wallpaper}
          alt=""
          className="w-full h-full object-cover object-center select-none transform scale-[1.01] transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/35 to-black/50 sm:bg-black/40 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none pointer-events-none z-0">
      {scene}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(110deg, rgba(6, 10, 21, 0.18), transparent 58%, rgba(65, 49, 111, 0.12)), linear-gradient(0deg, rgba(5, 9, 18, 0.2), transparent 34%)",
        }}
      />
      {themeMode === "night" && (
        <div className="absolute inset-0 bg-black/35 pointer-events-none transition-opacity duration-500" />
      )}
      <StarfieldCanvas />
    </div>
  );
}
