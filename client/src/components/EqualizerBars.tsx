// Small bouncing-bars "now playing" indicator. Deliberately CSS-only (not
// tied to the Web Audio analyser) so it always animates the instant playback
// starts, everywhere it's used — sidebar rows, the mini-player, the main
// player bar — even for sources where the analyser can't get real data
// (CORS-restricted previews, etc).
export default function EqualizerBars({ size = "sm", className = "" }) {
  const heights = size === "lg" ? [10, 16, 8, 14] : [5, 9, 4, 7];
  const width = size === "lg" ? 2.5 : 2;

  return (
    <div className={`flex items-end gap-\[2px] ${className}`} style={{ height: Math.max(...heights) }} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className="bg-accent rounded-full eq-bar"
          style={{
            width,
            height: h,
            animationDelay: `${i * 120}ms`
          }}
        />
      ))}
    </div>
  );
}
