import { useState } from "react";
import { ArrowLeft, Gamepad2, Lock } from "lucide-react";
import BlockBlast from "./games/BlockBlast";

const RECOMMENDATIONS = [
  { name: "2048", desc: "Merge tiles to reach 2048.", soon: true },
  { name: "Sudoku Mini", desc: "5-minute logic puzzles.", soon: true },
  { name: "Snake", desc: "The classic, with a coral skin.", soon: true }
];

export default function Games() {
  const [open, setOpen] = useState("blockblast");

  if (open === "blockblast") {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
          <button onClick={() => setOpen(null)} className="p-1 hover:bg-white/10 rounded"><ArrowLeft size={14} /></button>
          <span className="text-xs font-medium">Block Blast</span>
        </div>
        <div className="flex-1 overflow-auto thin-scroll">
          <BlockBlast />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="font-display text-lg font-semibold mb-1">Games</h2>
      <p className="text-xs text-white/50 mb-4">Take a break — one game live, more on the way.</p>

      <button
        onClick={() => setOpen("blockblast")}
        className="w-full flex items-center gap-3 p-3 rounded-xl border border-accent/50 bg-accent/10 mb-4 text-left"
      >
        <Gamepad2 className="accent" size={22} />
        <div>
          <div className="text-sm font-medium">Block Blast</div>
          <div className="text-[11px] text-white/50">Clear rows and columns before the board fills up.</div>
        </div>
      </button>

      <div className="text-[11px] text-white/40 uppercase tracking-wide mb-2">Coming soon</div>
      <div className="space-y-2">
        {RECOMMENDATIONS.map((g) => (
          <div key={g.name} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 opacity-60">
            <Lock size={16} />
            <div>
              <div className="text-sm font-medium">{g.name}</div>
              <div className="text-[11px] text-white/50">{g.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
