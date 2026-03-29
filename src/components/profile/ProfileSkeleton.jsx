// ProfileSkeleton.jsx
// Drop this in src/components/profile/ProfileSkeleton.jsx
// Then import and use in UserProfile.jsx's isLoading block

const ProfileSkeleton = () => {
  return (
    <div className="max-w-xl mx-auto space-y-6 pt-6">

      {/* ── Profile card skeleton ── */}
      <div className="rounded-2xl border border-border bg-card px-4 py-5 space-y-4 overflow-hidden">

        {/* Top row */}
        <div className="flex items-start gap-3 sm:gap-4">

          {/* Avatar pulse */}
          <div className="shrink-0 relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted animate-pulse" />
            {/* Subtle shimmer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-pulse" />
          </div>

          {/* Right side */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Name + button row */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-muted rounded-md w-32 animate-pulse" />
                <div className="h-3 bg-muted rounded-md w-20 animate-pulse" style={{ animationDelay: "100ms" }} />
              </div>
              <div className="h-7 w-20 bg-muted rounded-xl animate-pulse shrink-0" style={{ animationDelay: "150ms" }} />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-1 w-full">
              {[0, 80, 160, 240].map((delay, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" style={{ animationDelay: `${delay}ms` }} />
                  <div className="h-2.5 w-10 bg-muted/60 rounded animate-pulse" style={{ animationDelay: `${delay + 50}ms` }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bio lines */}
        <div className="space-y-1.5 px-1">
          <div className="h-3 bg-muted rounded w-full animate-pulse" style={{ animationDelay: "200ms" }} />
          <div className="h-3 bg-muted rounded w-4/5 animate-pulse" style={{ animationDelay: "260ms" }} />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 px-1">
          {[80, 60, 48, 40].map((w, i) => (
            <div key={i}
              className="h-6 bg-muted rounded-md animate-pulse"
              style={{ width: `${w}px`, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>

      {/* ── Tabs skeleton ── */}
      <div className="flex border-b border-border gap-1 pb-0">
        {[40, 48, 36].map((w, i) => (
          <div key={i}
            className="h-9 bg-muted/50 rounded-t-md animate-pulse mx-2"
            style={{ width: `${w}px`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      {/* ── Post card skeletons ── */}
      <div className="space-y-2.5">
        {[0, 1, 2].map(i => (
          <div key={i}
            className="rounded-2xl border border-border bg-card px-5 py-4 space-y-2.5 overflow-hidden relative"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
              style={{ animationDelay: `${i * 200}ms` }}
            />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
              <div className="h-3 bg-muted rounded w-24 animate-pulse" />
              <div className="h-3 bg-muted/50 rounded w-12 animate-pulse ml-auto" />
            </div>
            <div className="h-3.5 bg-muted rounded w-3/4 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 bg-muted/70 rounded w-full animate-pulse" />
              <div className="h-3 bg-muted/70 rounded w-5/6 animate-pulse" />
              <div className="h-3 bg-muted/50 rounded w-2/3 animate-pulse" />
            </div>
            <div className="flex gap-3 pt-1">
              <div className="h-3 w-12 bg-muted/40 rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted/40 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}

export default ProfileSkeleton