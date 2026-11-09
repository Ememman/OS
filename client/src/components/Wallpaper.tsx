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

export default function Wallpaper() {
  const wallpaper = useOS((s) => s.wallpaper);

  let scene = <OceanScene />;
  if (wallpaper === "bg1" || wallpaper === "bg2" || wallpaper === "bg3") {
    scene = <ImageScene id={wallpaper} />;
  } else if (wallpaper === "galaxy") {
    scene = <GalaxyScene />;
  } else if (wallpaper === "aurora") {
    scene = <AuroraScene />;
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
      <StarfieldCanvas />
    </div>
  );
}
