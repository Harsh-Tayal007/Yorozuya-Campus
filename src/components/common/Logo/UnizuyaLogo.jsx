// UnizuyaLogo.jsx
// Usage: <UnizuyaLogo size={40} theme="dark" /> or <UnizuyaLogo size={40} theme="light" />
// theme="dark"  → blue accents on dark background (for navbar, sidebar)
// theme="light" → navy accents (for light background)
// theme="auto"  → uses CSS media query (default)

const UnizuyaLogo = ({ size = 40, theme = "auto", className = "" }) => {
  const isDark = theme === "dark"
  const isLight = theme === "light"

  // Colors
  const accent = isDark ? "#4A9EFF" : isLight ? "#1e4db7" : "var(--logo-accent, #4A9EFF)"
  const fillOpacity = 0.13
  const orbitOpacity = isDark ? 0.3 : 0.25

  // All coordinates are on a 120x120 viewBox
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-label="Unizuya logo"
    >
      {/* Outer orbital arc */}
      <circle
        cx="60" cy="62" r="46"
        stroke={accent}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="230 60"
        strokeDashoffset="-15"
        opacity={orbitOpacity}
      />

      {/* Inner orbital arc */}
      <circle
        cx="60" cy="62" r="34"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="140 74"
        strokeDashoffset="30"
        opacity={isDark ? 0.18 : 0.15}
      />

      {/* Left page - filled + outlined */}
      <path
        d="M28 32 L28 78 Q28 90 42 90 L58 90 L58 32 Z"
        fill={accent}
        fillOpacity={fillOpacity}
      />
      <path
        d="M28 32 L28 78 Q28 90 42 90 L58 90 L58 32 Z"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Right page - filled + outlined */}
      <path
        d="M92 32 L92 78 Q92 90 78 90 L62 90 L62 32 Z"
        fill={accent}
        fillOpacity={fillOpacity}
      />
      <path
        d="M92 32 L92 78 Q92 90 78 90 L62 90 L62 32 Z"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Top crossbar */}
      <line x1="28" y1="32" x2="92" y2="32" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />

      {/* Center spine */}
      <line x1="60" y1="32" x2="60" y2="90" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />

      {/* Page lines - left */}
      {[48, 56, 64].map(y => (
        <line key={y} x1="35" y1={y} x2="55" y2={y} stroke={accent} strokeWidth="1" opacity="0.22" strokeLinecap="round" />
      ))}

      {/* Page lines - right */}
      {[48, 56, 64].map(y => (
        <line key={y} x1="65" y1={y} x2="85" y2={y} stroke={accent} strokeWidth="1" opacity="0.22" strokeLinecap="round" />
      ))}

      {/* Beacon dot */}
      <circle cx="60" cy="18" r="5.5" fill={accent} />
      {/* Beacon halo */}
      <circle cx="60" cy="18" r="9" stroke={accent} strokeWidth="1.5" opacity={isDark ? 0.28 : 0.22} />

      {/* Beacon → spine connector */}
      <line x1="60" y1="23.5" x2="60" y2="32" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}

export default UnizuyaLogo