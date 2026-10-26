import { useOS } from "../store/useOS";
import StarfieldCanvas from "./StarfieldCanvas";

// Custom image wallpapers, served from /public/wallpapers so they work
// identically in `npm run dev` and in a production build.
const IMAGE_SRC = {
  bg1: "/wallpapers/BG_1.jpg",
  bg2: "/wallpapers/BG_2.png",
  bg3: "/wallpapers/BG_3.jpg",
};

const FALLBACK_GRADIENT = {
  bg1: "linear-gradient(135deg, #1a1a2e, #16213e)",
  bg2: "linear-gradient(135deg, #0f0c29, #302b63)",
  bg3: "linear-gradient(135deg, #1a1a2e, #2d2b4a)",
};

function ImageScene({ id }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: FALLBACK_GRADIENT[id] }}>
      <img
        src={IMAGE_SRC[id]}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-black/45" />
    </div>
  );
}

function OceanScene() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "linear-gradient(180deg,#050810 0%,#0A1220 38%,#101a2c 55%,#1b2740 68%,#0b1420 100%)" }}
    />
  );
}

function GalaxyScene() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 30% 20%, #1c1240 0%, #0a0818 45%, #050308 100%)" }}
    />
  );
}

function AuroraScene() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "linear-gradient(180deg,#04070d 0%,#071018 45%,#0a1a1f 70%,#04090d 100%)" }}
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
    <div className="absolute inset-0 overflow-hidden">
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
