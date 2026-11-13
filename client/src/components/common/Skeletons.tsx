import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

/**
 * Universal Dark Glass theme wrapper for React Loading Skeleton
 */
export function GlassSkeletonTheme({ children }: { children: React.ReactNode }) {
  return (
    <SkeletonTheme
      baseColor="rgba(255, 255, 255, 0.07)"
      highlightColor="rgba(255, 255, 255, 0.16)"
      borderRadius={10}
      duration={1.5}
    >
      {children}
    </SkeletonTheme>
  );
}

/**
 * Full-app window placeholder while lazy components load in Suspense.
 */
export function WindowAppSkeleton({ title = "Loading application..." }: { title?: string }) {
  return (
    <GlassSkeletonTheme>
      <div className="flex-1 w-full h-full flex flex-col p-4 sm:p-6 bg-transparent select-none overflow-hidden animate-fade-in">
        {/* Top Header Placeholder */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Skeleton circle width={32} height={32} />
            <div className="space-y-1">
              <span className="text-xs font-medium text-white/75">{title}</span>
              <Skeleton width={90} height={10} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width={80} height={28} borderRadius={8} />
            <Skeleton width={28} height={28} borderRadius={8} />
          </div>
        </div>

        {/* Content Body: Sidebar + Main Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden">
          {/* Sidebar */}
          <div className="hidden md:flex flex-col gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <Skeleton width="60%" height={12} className="mb-2" />
            <Skeleton count={5} height={32} borderRadius={8} className="mb-1" />
          </div>

          {/* Main Area */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <Skeleton width="40%" height={10} className="mb-1.5" />
                <Skeleton width="70%" height={22} className="mb-1" />
                <Skeleton width="90%" height={10} />
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <Skeleton width="40%" height={10} className="mb-1.5" />
                <Skeleton width="70%" height={22} className="mb-1" />
                <Skeleton width="90%" height={10} />
              </div>
              <div className="hidden sm:block p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <Skeleton width="40%" height={10} className="mb-1.5" />
                <Skeleton width="70%" height={22} className="mb-1" />
                <Skeleton width="90%" height={10} />
              </div>
            </div>

            {/* List / Table rows */}
            <div className="flex-1 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5 overflow-hidden">
              <Skeleton width="30%" height={12} className="mb-2" />
              <Skeleton count={6} height={42} borderRadius={8} className="mb-1.5" />
            </div>
          </div>
        </div>
      </div>
    </GlassSkeletonTheme>
  );
}

/**
 * Skeleton for Guestbook Ledger entries.
 */
export function GuestbookListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <GlassSkeletonTheme>
      <div className="space-y-3 p-1">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-start gap-3"
          >
            <Skeleton circle width={42} height={42} className="shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton width={120} height={14} />
                <Skeleton width={60} height={11} />
              </div>
              <Skeleton width="90%" height={12} />
              <Skeleton width="70%" height={12} />
              <div className="pt-1 flex items-center gap-2">
                <Skeleton width={48} height={20} borderRadius={6} />
                <Skeleton width={48} height={20} borderRadius={6} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassSkeletonTheme>
  );
}

/**
 * Skeleton for Activity Monitor / Task Manager metrics and process table.
 */
export function ActivityMonitorSkeleton() {
  return (
    <GlassSkeletonTheme>
      <div className="space-y-4 p-4 animate-fade-in">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <Skeleton width="50%" height={11} />
              <Skeleton width="80%" height={24} />
              <Skeleton width="100%" height={6} borderRadius={4} />
            </div>
          ))}
        </div>

        {/* Process rows */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
          <Skeleton width="25%" height={14} className="mb-2" />
          <Skeleton count={7} height={36} borderRadius={6} className="mb-1" />
        </div>
      </div>
    </GlassSkeletonTheme>
  );
}

/**
 * Skeleton for Library / Portfolio project cards.
 */
export function ProjectCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <GlassSkeletonTheme>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <Skeleton height={140} borderRadius={12} />
            <div className="space-y-1.5">
              <Skeleton width="70%" height={16} />
              <Skeleton width="95%" height={12} />
              <Skeleton width="85%" height={12} />
            </div>
            <div className="flex gap-2 pt-1">
              <Skeleton width={60} height={22} borderRadius={6} />
              <Skeleton width={60} height={22} borderRadius={6} />
            </div>
          </div>
        ))}
      </div>
    </GlassSkeletonTheme>
  );
}

/**
 * Skeleton for Updates / Changelog timeline cards.
 */
export function TimelineSkeleton({ count = 4 }: { count?: number }) {
  return (
    <GlassSkeletonTheme>
      <div className="space-y-3 p-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton circle width={24} height={24} />
                <Skeleton width={140} height={14} />
              </div>
              <Skeleton width={70} height={12} />
            </div>
            <Skeleton width="90%" height={12} />
            <Skeleton width="75%" height={12} />
            <div className="flex gap-2 pt-1">
              <Skeleton width={50} height={22} borderRadius={6} />
              <Skeleton width={50} height={22} borderRadius={6} />
            </div>
          </div>
        ))}
      </div>
    </GlassSkeletonTheme>
  );
}
