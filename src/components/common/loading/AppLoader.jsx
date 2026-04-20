// AppLoader.jsx

const AppLoader = () => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--loader-bg, #0b1220)",
        zIndex: 9999,
      }}
    >
      <style>{`
        /* ─── Light mode override ─── */
        @media (prefers-color-scheme: light) {
          :root { --loader-bg: #f0f4ff; --loader-accent: #1e4db7; --loader-text: #1a3a6b; }
        }
        @media (prefers-color-scheme: dark) {
          :root { --loader-bg: #0b1220; --loader-accent: #4A9EFF; --loader-text: #7eb8f7; }
        }

        /* ─── Reddit-style bounce: drop in, squash, spring up ─── */
        @keyframes uz-bounce {
          0%   { transform: translateY(-60px) scale(1, 1);   opacity: 0; }
          40%  { transform: translateY(0px)   scale(1, 1);   opacity: 1; }
          /* squash on landing */
          50%  { transform: translateY(4px)   scale(1.18, 0.82); }
          /* spring back up */
          65%  { transform: translateY(-14px) scale(0.92, 1.08); }
          75%  { transform: translateY(0px)   scale(1.06, 0.96); }
          85%  { transform: translateY(-5px)  scale(0.98, 1.02); }
          93%  { transform: translateY(0px)   scale(1.01, 0.99); }
          100% { transform: translateY(0px)   scale(1, 1);   opacity: 1; }
        }

        /* ─── Shadow pops up as logo lands ─── */
        @keyframes uz-shadow {
          0%   { transform: scaleX(0.1); opacity: 0; }
          40%  { transform: scaleX(1);   opacity: 0.35; }
          50%  { transform: scaleX(1.2); opacity: 0.5; }
          65%  { transform: scaleX(0.85); opacity: 0.28; }
          75%  { transform: scaleX(1.08); opacity: 0.38; }
          100% { transform: scaleX(1);   opacity: 0.3; }
        }

        /* ─── Wordmark fades up after logo settles ─── */
        @keyframes uz-wordmark {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0px); }
        }

        /* ─── Beacon pulse: tiny dot above logo breathes ─── */
        @keyframes uz-beacon {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }

        .uz-logo-wrap {
          animation: uz-bounce 0.85s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .uz-logo-wrap svg circle:last-of-type {
          /* The beacon dot gets a subtle pulse after the bounce */
          animation: uz-beacon 1.6s ease-in-out 0.9s infinite;
        }

        .uz-shadow {
          width: 72px;
          height: 12px;
          border-radius: 50%;
          background: var(--loader-accent, #4A9EFF);
          filter: blur(8px);
          margin-top: -4px;
          animation: uz-shadow 0.85s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .uz-wordmark {
          margin-top: 28px;
          font-family: 'Syne', 'Outfit', ui-sans-serif, system-ui, sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--loader-text, #7eb8f7);
          animation: uz-wordmark 0.4s ease both;
          animation-delay: 0.78s;
          opacity: 0;
        }

        .uz-dots {
          display: flex;
          gap: 5px;
          margin-top: 12px;
          animation: uz-wordmark 0.4s ease both;
          animation-delay: 0.9s;
          opacity: 0;
        }

        .uz-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--loader-accent, #4A9EFF);
          opacity: 0.5;
        }

        @keyframes uz-dot-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          40%            { opacity: 1;   transform: scale(1.4); }
        }

        .uz-dot:nth-child(1) { animation: uz-dot-pulse 1.1s ease-in-out 1.0s infinite; }
        .uz-dot:nth-child(2) { animation: uz-dot-pulse 1.1s ease-in-out 1.2s infinite; }
        .uz-dot:nth-child(3) { animation: uz-dot-pulse 1.1s ease-in-out 1.4s infinite; }
      `}</style>

      {/* The bouncing logo mark */}
      <div className="uz-logo-wrap">
        {/* Inline SVG so CSS can target internal elements */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 120"
          width="88"
          height="88"
          fill="none"
          aria-label="Unizuya"
        >
          {/* Outer orbital arc */}
          <circle cx="60" cy="62" r="46" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="3.5"
            strokeLinecap="round" strokeDasharray="230 60" strokeDashoffset="-15" opacity="0.3"/>

          {/* Left page */}
          <path d="M28 32 L28 78 Q28 90 42 90 L58 90 L58 32 Z"
            fill="var(--loader-accent,#4A9EFF)" fillOpacity="0.12"/>
          <path d="M28 32 L28 78 Q28 90 42 90 L58 90 L58 32 Z"
            stroke="var(--loader-accent,#4A9EFF)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>

          {/* Right page */}
          <path d="M92 32 L92 78 Q92 90 78 90 L62 90 L62 32 Z"
            fill="var(--loader-accent,#4A9EFF)" fillOpacity="0.12"/>
          <path d="M92 32 L92 78 Q92 90 78 90 L62 90 L62 32 Z"
            stroke="var(--loader-accent,#4A9EFF)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>

          {/* Top bar */}
          <line x1="28" y1="32" x2="92" y2="32" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="2.5" strokeLinecap="round"/>

          {/* Center spine */}
          <line x1="60" y1="32" x2="60" y2="90" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>

          {/* Page lines left */}
          <line x1="35" y1="48" x2="55" y2="48" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="1" opacity="0.22" strokeLinecap="round"/>
          <line x1="35" y1="56" x2="55" y2="56" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="1" opacity="0.22" strokeLinecap="round"/>
          <line x1="35" y1="64" x2="55" y2="64" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="1" opacity="0.22" strokeLinecap="round"/>

          {/* Page lines right */}
          <line x1="65" y1="48" x2="85" y2="48" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="1" opacity="0.22" strokeLinecap="round"/>
          <line x1="65" y1="56" x2="85" y2="56" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="1" opacity="0.22" strokeLinecap="round"/>
          <line x1="65" y1="64" x2="85" y2="64" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="1" opacity="0.22" strokeLinecap="round"/>

          {/* Beacon connector */}
          <line x1="60" y1="23.5" x2="60" y2="32" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="1.5" strokeLinecap="round" opacity="0.55"/>

          {/* Beacon halo */}
          <circle cx="60" cy="18" r="9" stroke="var(--loader-accent,#4A9EFF)" strokeWidth="1.5" opacity="0.28"/>

          {/* Beacon dot - targeted by CSS beacon pulse */}
          <circle cx="60" cy="18" r="5.5" fill="var(--loader-accent,#4A9EFF)"/>
        </svg>
      </div>

      {/* Ground shadow */}
      <div className="uz-shadow" />

      {/* Wordmark */}
      <div className="uz-wordmark">Unizuya</div>

      {/* Loading dots */}
      <div className="uz-dots">
        <div className="uz-dot" />
        <div className="uz-dot" />
        <div className="uz-dot" />
      </div>
    </div>
  )
}

export default AppLoader