export function BorderBeam({ children, duration = 6 }) {
  return (
    <div className="relative rounded-lg p-[2px] overflow-hidden">
      {/* Moving gradient strip */}
      <div
        className="absolute inset-0 animate-border-beam"
        style={{
          background: `
            linear-gradient(
              90deg,
              transparent,
              #3b82f6,
              #6366f1,
              transparent
            )
          `,
          backgroundSize: "200% 100%",
        }}
      />

      {/* Inner content */}
      <div className="relative rounded-lg bg-background">
        {children}
      </div>
    </div>
  )
}
