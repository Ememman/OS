"use client";

import dynamic from "next/dynamic";

const PortfolioOS = dynamic(() => import("../src/App"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <span className="font-mono text-xs tracking-wider text-white/60">BOOTING PORTFOLIO OS...</span>
      </div>
    </div>
  )
});

export default function Page() {
  return <PortfolioOS />;
}

