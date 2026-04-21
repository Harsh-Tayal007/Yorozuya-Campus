import { useEffect, useRef, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const COUNT         = 420;
const SPRING_K      = 0.016;
const DAMPING       = 0.875;
const MAX_VEL       = 16;
const IDLE_MS       = 1400;
const DASH_MIN_L    = 3;
const DASH_MAX_L    = 16;
const DASH_W        = 1.6;
const DEFAULT_CURSOR_R = 0.38;

// Google palette — blues dominant, accents of red/yellow/green/purple
const PALETTES = [
  ["#4285f4","#669df6","#8ab4f8","#1a73e8","#1557b0","#aecbfa","#5194f8"],
  ["#ea4335","#f28b82","#d93025","#ff6d62"],
  ["#fbbc04","#f9ab00","#fde293"],
  ["#34a853","#81c995","#1e8e3e","#a8dab5"],
  ["#a142f4","#c58af9","#7627bb"],
];
// Blues appear ~4× more often
const WEIGHTS = [0,0,0,0,1,1,1,1,2,2,3,3,4];

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function AntigravityField() {
  const canvasRef  = useRef(null);
  const stateRef   = useRef(null);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    const W = canvas.width  = rect.width  * dpr;
    const H = canvas.height = rect.height * dpr;
    const rand = seededRand(137);

    const particles = Array.from({ length: COUNT }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const dist  = (0.1 + Math.pow(rand(), 0.55) * 0.9) * Math.min(W, H) * 0.46;
      const hx    = W / 2 + Math.cos(angle) * dist;
      const hy    = H / 2 + Math.sin(angle) * dist;

      const pi     = WEIGHTS[Math.floor(rand() * WEIGHTS.length)];
      const palette = PALETTES[pi];
      const color  = palette[Math.floor(rand() * palette.length)];
      const isCross = rand() < 0.06;
      const isDot   = rand() < 0.04;

      return {
        hx, hy,
        x: hx, y: hy,
        vx: 0, vy: 0,
        length:    DASH_MIN_L + rand() * (DASH_MAX_L - DASH_MIN_L),
        angle:     rand() * Math.PI,
        color,
        baseAlpha: 0.38 + rand() * 0.52,
        alpha:     0.38 + rand() * 0.52,
        driftAngle: rand() * Math.PI * 2,
        driftSpeed: 0.0003 + rand() * 0.0007,
        phase:  rand() * Math.PI * 2,
        phaseY: rand() * Math.PI * 2,
        // shape: 'dash' | 'cross' | 'dot'
        shape: isDot ? 'dot' : isCross ? 'cross' : 'dash',
        size:  isDot ? (1.2 + rand() * 2.2) : null,
        energy: 0,
      };
    });

    const prev = stateRef.current;
    stateRef.current = {
      W, H, dpr, particles,
      mouse: { x: W / 2, y: H / 2, active: false, lastMove: -9999 },
      repelling: false,
      cursorR: prev?.cursorR ?? DEFAULT_CURSOR_R,
      raf: null,
      t: 0,
    };
  }, []);

  useEffect(() => {
    init();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const state  = stateRef.current;

    // ── Pointer helpers ────────────────────────────────────────────────────
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const dpr  = state.dpr;
      const src  = e.touches ? e.touches[0] : e;
      return {
        x: (src.clientX - rect.left) * dpr,
        y: (src.clientY - rect.top)  * dpr,
      };
    };

    const onMove = (e) => {
      const p = getPos(e);
      const s = stateRef.current;
      s.mouse.x = p.x; s.mouse.y = p.y;
      s.mouse.active   = true;
      s.mouse.lastMove = performance.now();
    };
    const onLeave = () => { stateRef.current.mouse.active = false; };
    const onDown  = (e) => { e.preventDefault(); stateRef.current.repelling = true;  if (e.touches) onMove(e); };
    const onUp    = ()  => { stateRef.current.repelling = false; };

    const onWheel = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      s.cursorR = Math.max(0.15, Math.min(0.65, s.cursorR - e.deltaY * 0.0004));
    };

    canvas.addEventListener("mousemove",  onMove,  { passive: true });
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("mousedown",  onDown);
    canvas.addEventListener("mouseup",    onUp);
    canvas.addEventListener("touchstart", onDown,  { passive: false });
    canvas.addEventListener("touchmove",  onMove,  { passive: false });
    canvas.addEventListener("touchend",   onUp);
    canvas.addEventListener("wheel",      onWheel, { passive: false });

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => { cancelAnimationFrame(state.raf); init(); };
    window.addEventListener("resize", onResize);

    // ── Cursor drawing ─────────────────────────────────────────────────────
    const drawCursor = (s, baseR) => {
      const { mouse, repelling } = s;
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.004);
      const r     = repelling ? 7 : 4;

      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = repelling ? "#ea4335" : "#4285f4";
      ctx.lineWidth   = 1.2;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, r + pulse * 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.12 + pulse * 0.06;
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, baseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    // ── Render loop ────────────────────────────────────────────────────────
    let prevTime = performance.now();

    const tick = (now) => {
      const s = stateRef.current;
      s.raf   = requestAnimationFrame(tick);
      const dt = Math.min(now - prevTime, 50);
      prevTime = now;
      s.t    += dt;

      const { W, H, particles, mouse, repelling } = s;
      const idleMs = now - mouse.lastMove;
      const isIdle = idleMs > IDLE_MS;
      const baseR  = Math.min(W, H) * s.cursorR;

      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let fx = 0, fy = 0;

        // ── Cursor force ────────────────────────────────────────────────
        if (!isIdle && mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < baseR && d > 1) {
            const t01     = 1 - d / baseR;
            const strength = (repelling ? -0.22 : 0.14) * t01 * t01;
            fx += (dx / d) * strength * baseR;
            fy += (dy / d) * strength * baseR;
            p.energy = lerp(p.energy, t01, 0.15);
          } else {
            p.energy = lerp(p.energy, 0, 0.05);
          }
        } else {
          p.energy = lerp(p.energy, 0, 0.04);
        }

        // ── Spring to home ───────────────────────────────────────────────
        fx += (p.hx - p.x) * SPRING_K;
        fy += (p.hy - p.y) * SPRING_K;

        // ── Autonomous drift ─────────────────────────────────────────────
        p.driftAngle += p.driftSpeed * dt;
        const dm = 0.0003 * dt;
        fx += Math.cos(p.driftAngle) * dm * baseR;
        fy += Math.sin(p.driftAngle) * dm * baseR;

        // ── Global oscillation ───────────────────────────────────────────
        fx += Math.sin(s.t * 0.00042 + p.phase)  * 0.09;
        fy += Math.cos(s.t * 0.00036 + p.phaseY) * 0.09;

        // ── Integrate ────────────────────────────────────────────────────
        p.vx = (p.vx + fx) * DAMPING;
        p.vy = (p.vy + fy) * DAMPING;

        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > MAX_VEL) { p.vx *= MAX_VEL / spd; p.vy *= MAX_VEL / spd; }

        p.x += p.vx;
        p.y += p.vy;

        // ── Soft boundary ────────────────────────────────────────────────
        const margin = 60;
        if (p.x < -margin)    { p.vx += 0.5; p.x = -margin;    }
        if (p.x > W + margin) { p.vx -= 0.5; p.x = W + margin; }
        if (p.y < -margin)    { p.vy += 0.5; p.y = -margin;    }
        if (p.y > H + margin) { p.vy -= 0.5; p.y = H + margin; }

        // ── Rotate toward velocity ───────────────────────────────────────
        if (spd > 0.25) {
          const va   = Math.atan2(p.vy, p.vx);
          let diff   = va - p.angle;
          diff      -= Math.PI * 2 * Math.round(diff / (Math.PI * 2));
          p.angle   += diff * 0.11;
        }

        // ── Alpha driven by energy ───────────────────────────────────────
        const energyBright = p.energy * (repelling ? 1.4 : 1.0);
        p.alpha = lerp(p.baseAlpha, Math.min(1, p.baseAlpha + 0.5), energyBright);

        // ── Draw ─────────────────────────────────────────────────────────
        ctx.save();
        ctx.globalAlpha  = p.alpha;
        ctx.strokeStyle  = p.color;
        ctx.fillStyle    = p.color;

        if (p.shape === "dot") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + energyBright * 0.5), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "cross") {
          const hw = p.length * 0.4;
          ctx.lineWidth = DASH_W * 1.1;
          ctx.lineCap   = "round";
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.beginPath();
          ctx.moveTo(-hw, 0); ctx.lineTo(hw, 0);
          ctx.moveTo(0, -hw); ctx.lineTo(0, hw);
          ctx.stroke();
        } else {
          const halfL = p.length * 0.5 * (1 + energyBright * 0.35);
          const cx2   = Math.cos(p.angle) * halfL;
          const cy2   = Math.sin(p.angle) * halfL;
          ctx.lineWidth = DASH_W * (1 + energyBright * 0.4);
          ctx.lineCap   = "round";
          ctx.beginPath();
          ctx.moveTo(p.x - cx2, p.y - cy2);
          ctx.lineTo(p.x + cx2, p.y + cy2);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (mouse.active) drawCursor(s, baseR);
    };

    state.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(stateRef.current?.raf);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("mousedown",  onDown);
      canvas.removeEventListener("mouseup",    onUp);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove",  onMove);
      canvas.removeEventListener("touchend",   onUp);
      canvas.removeEventListener("wheel",      onWheel);
      window.removeEventListener("resize",     onResize);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      "fixed",
        inset:         0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "auto",
        display:       "block",
        zIndex:        0,
        cursor:        "none",
      }}
      aria-hidden="true"
    />
  );
}