import { useEffect, useRef, useState, useCallback } from "react"
import { X } from "lucide-react"
import MascotEngine from "./MascotEngine"
import InteractionController from "./InteractionController"
import UIController from "./UIController"
import MascotContextMenu from "./MascotContextMenu"
import AssetCacheManager from "./AssetCacheManager"
import { useUIPrefs } from "@/context/UIPrefsContext"
import { useQueryClient } from "@tanstack/react-query"
import "./mascot.css"

const MODEL_URL = "/mascot/assistant.vrm"

// Base dimensions — extra large to prevent clipping during wide animations.
// pointer-events: none on the container means this huge size doesn't block the site.
const BASE_WIDTH  = 1600   
const BASE_HEIGHT = 1600   

// How much clearance to leave at the bottom edge (navbar / taskbar)
const BOTTOM_PADDING = 32

const isCoarsePointer = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768)

/** Stable metrics object — avoids recreating on every render */
const makeMetrics = (w, h) => {
  // Since the canvas is 1600x1600 but the mascot only occupies the center ~300px,
  // we must use negative padding to allow the transparent container edges to go off-screen.
  // This allows the actual mascot in the center to reach the edges of the screen.
  const edgeMargin = 50 // minimum visible pixels before stopping
  return {
    width: w,
    height: h,
    padding: -(w / 2) + edgeMargin,
    bottomPadding: -(h / 2) + edgeMargin,
  }
}

const MascotRoot = () => {
  const { disabled, resolved, adminDefaults, globallyLocked, userLocked, stalePrefs } = useUIPrefs()
  const [uiController] = useState(() => new UIController())
  const [uiState, setUiState]   = useState(uiController.getState())
  const queryClient = useQueryClient()

  const shellRef      = useRef(null)
  const stageRef      = useRef(null)
  const canvasRef     = useRef(null)
  const engineRef     = useRef(null)
  const interactionRef = useRef(null)
  const prevCharRef   = useRef(null)   // which model is loaded in engine right now

  // Keep a ref to current dimensions so callbacks always see the latest values
  // without being listed as deps (avoids tearing down/recreating effects on scale)
  const dimsRef = useRef({ w: BASE_WIDTH, h: BASE_HEIGHT })

  // ── Subscribe ──────────────────────────────────────────────────────────────
  useEffect(() => uiController.subscribe(setUiState), [uiController])
  useEffect(() => () => uiController.destroy(), [uiController])

  // ── Global events ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onToggle  = () => {
      const currentUiState = uiController.getState()
      if (!currentUiState.mascotVisible) {
        uiController.setMascotVisible(true) // Triggers Welcome by showing
      } else {
        window.dispatchEvent(new CustomEvent("mascot-hide-request")) // Triggers Goodbye
      }
    }
    const onVrma    = (e) => engineRef.current?.playAnimationUrl(e.detail?.url)
    // After the Goodbye animation delay, the InteractionController fires this to close
    const onConfirm = (e) => {
      uiController.setMascotVisible(false)
      if (e?.detail?.permanent) {
        window.dispatchEvent(new CustomEvent("mascot-permanent-disable"))
      }
    }
    const onSetVisible = (e) => uiController.setMascotVisible(e.detail?.visible)
    const onSetMinimized = (e) => uiController.setMinimized(e.detail?.minimized)
    const onSetSfx = (e) => uiController.setSfxEnabled(e.detail?.enabled)

    window.addEventListener("mascot-toggle-visibility", onToggle)
    window.addEventListener("mascot-play-vrma", onVrma)
    window.addEventListener("mascot-hide-confirm", onConfirm)
    window.addEventListener("mascot-set-visible", onSetVisible)
    window.addEventListener("mascot-set-minimized", onSetMinimized)
    window.addEventListener("mascot-set-sfx", onSetSfx)
    return () => {
      window.removeEventListener("mascot-toggle-visibility", onToggle)
      window.removeEventListener("mascot-play-vrma", onVrma)
      window.removeEventListener("mascot-hide-confirm", onConfirm)
      window.removeEventListener("mascot-set-visible", onSetVisible)
      window.removeEventListener("mascot-set-minimized", onSetMinimized)
      window.removeEventListener("mascot-set-sfx", onSetSfx)
    }
  }, [uiController])

  // ── Derived dimensions (memoised) ─────────────────────────────────────────
  const scale        = uiState.mascotScale || 1.0
  const dynamicWidth  = Math.round(BASE_WIDTH  * scale)
  const dynamicHeight = Math.round(BASE_HEIGHT * scale)

  // Keep ref in sync so engine-resize callback always sees latest
  dimsRef.current = { w: dynamicWidth, h: dynamicHeight }

  // ── Position manager ───────────────────────────────────────────────────────
  // Runs on mount, on resize, and when dimensions change.
  // Does NOT depend on isReady/isLoading — position is view-layer concern only.
  useEffect(() => {
    if (uiState.mascotVisible === false) return

    const sync = () => {
      uiController.ensurePosition({
        ...makeMetrics(dimsRef.current.w, dimsRef.current.h),
        viewportWidth:  window.innerWidth,
        viewportHeight: window.innerHeight,
      })
    }

    sync()
    window.addEventListener("resize", sync, { passive: true })
    return () => window.removeEventListener("resize", sync)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiController, uiState.mascotVisible])

  // Re-clamp whenever scale changes so mascot never ends up off-screen
  useEffect(() => {
    if (uiState.mascotVisible === false) return
    uiController.ensurePosition({
      ...makeMetrics(dynamicWidth, dynamicHeight),
      viewportWidth:  window.innerWidth,
      viewportHeight: window.innerHeight,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicWidth, dynamicHeight])

  // ── Engine init / teardown ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let rafId = null

    // Immediately size the canvas element via attributes so the GPU surface is
    // the right resolution from frame 1 — avoids the 0×0 first-frame problem
    // that caused a black flash and the RAF spin-loop timing out.
    const w = dimsRef.current.w
    const h = dimsRef.current.h
    canvas.width  = w * Math.min(window.devicePixelRatio, 1.8)
    canvas.height = h * Math.min(window.devicePixelRatio, 1.8)

    uiController.setReady(false)
    uiController.setLoading(true)
    uiController.setError("")

    // ── Compute effective configuration ───────────────────────────────────────
    const forceAdmin = globallyLocked || userLocked || stalePrefs
    const adminChar = adminDefaults?.default_character || MODEL_URL
    let adminAnims = []
    try { adminAnims = JSON.parse(adminDefaults?.default_animations || "[]") } catch {}

    const effectiveCharacter = forceAdmin ? adminChar : (uiState.character || adminChar)
    const effectiveSequenceUrls = forceAdmin ? adminAnims : (uiState.sequenceUrls?.length ? uiState.sequenceUrls : adminAnims)

    const engine = new MascotEngine({
      canvas,
      modelUrl: effectiveCharacter,
      isMobile: isCoarsePointer(),
      sequenceUrls: effectiveSequenceUrls,
    })
    engineRef.current  = engine
    prevCharRef.current = effectiveCharacter

    // Initialise on next frame so the canvas has been laid out by the browser
    rafId = requestAnimationFrame(() => {
      if (cancelled) { engine.dispose(); return }

      engine.init()
        .then(() => {
          if (cancelled) { engine.dispose(); return }
          engine.setScaleMultiplier(scale)
          // Size renderer to actual CSS dimensions now that layout is complete
          const rect = canvas.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) engine.resize(rect.width, rect.height)
          uiController.setReady(true)
          
          // Note: Welcome interaction is now handled by InteractionController mount
        })
        .catch((err) => {
          if (cancelled) return
          if (engineRef.current === engine) engineRef.current = null
          engine.dispose()
          uiController.setError(err?.message || "Failed to load VRM model.")
        })
    })

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      interactionRef.current?.destroy()
      interactionRef.current = null
      const eng = engineRef.current
      if (eng) { engineRef.current = null; eng.dispose() }
      prevCharRef.current = null
    }
  // Only mount/unmount of MascotRoot drives init/teardown — all other changes are handled below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiController, resolved.mascotEnabled])

  // ── Scale → engine ────────────────────────────────────────────────────────
  useEffect(() => {
    if (engineRef.current && uiState.isReady) {
      engineRef.current.setScaleMultiplier(scale)
    }
  }, [scale, uiState.isReady])

  // ── Character hot-swap ────────────────────────────────────────────────────
  useEffect(() => {
    const engine  = engineRef.current
    const forceAdmin = globallyLocked || userLocked || stalePrefs
    const adminChar = adminDefaults?.default_character || MODEL_URL
    const effectiveCharacter = forceAdmin ? adminChar : (uiState.character || adminChar)

    if (!engine || !uiState.isReady || !effectiveCharacter) return
    if (effectiveCharacter === prevCharRef.current) return

    prevCharRef.current = effectiveCharacter
    uiController.setLoading(true)
    uiController.setError("")

    engine.loadModel(effectiveCharacter)
      .then(() => {
        engine.setScaleMultiplier(scale)
        uiController.setLoading(false)
        uiController.speak("New look!", { duration: 2000 })
      })
      .catch((err) => {
        console.error("Character swap failed:", err)
        uiController.setError("Failed to load character.")
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState.character, uiState.isReady, adminDefaults?.default_character, globallyLocked, userLocked, stalePrefs])

  // ── Sequence hot-swap ─────────────────────────────────────────────────────
  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !uiState.isReady) return

    const forceAdmin = globallyLocked || userLocked || stalePrefs
    let adminAnims = []
    try { adminAnims = JSON.parse(adminDefaults?.default_animations || "[]") } catch {}
    const effectiveSequenceUrls = forceAdmin ? adminAnims : (uiState.sequenceUrls?.length ? uiState.sequenceUrls : adminAnims)

    if (!effectiveSequenceUrls) return

    // Prevent duplicate loading by storing the last sequence reference
    if (JSON.stringify(engine.sequenceUrls) === JSON.stringify(effectiveSequenceUrls)) return
    engine.sequenceUrls = effectiveSequenceUrls
    engine.loadSequence(effectiveSequenceUrls)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState.sequenceUrls, uiState.isReady, adminDefaults?.default_animations, globallyLocked, userLocked, stalePrefs])

  // ── Renderer resize — RAF-debounced so CSS transitions don't thrash it ────
  //
  // Problem: the stage has a CSS transition on width+height. ResizeObserver fires
  // on EVERY intermediate frame of that transition (~60×) → engine.resize() 60×
  // per scale change → stutter. Fix: coalesce all resize calls into a single RAF.
  useEffect(() => {
    const stage  = stageRef.current
    const engine = engineRef.current
    if (!stage || !engine || !uiState.isReady) return

    let pending = null

    const scheduleResize = () => {
      if (pending) cancelAnimationFrame(pending)
      pending = requestAnimationFrame(() => {
        pending = null
        const rect = stage.getBoundingClientRect()
        if (rect.width > 1 && rect.height > 1) {
          engine.resize(rect.width, rect.height)
        }
      })
    }

    // Immediate resize on effect run (covers isReady becoming true)
    scheduleResize()

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(scheduleResize)
      : null
    ro?.observe(stage)
    window.addEventListener("resize", scheduleResize, { passive: true })

    return () => {
      if (pending) cancelAnimationFrame(pending)
      ro?.disconnect()
      window.removeEventListener("resize", scheduleResize)
    }
  // Intentionally omit dynamicWidth/Height — the ResizeObserver handles those
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState.mascotVisible, uiState.isMinimized, uiState.isReady])

  // ── Interaction controller ────────────────────────────────────────────────
  useEffect(() => {
    const shell  = shellRef.current
    const stage  = stageRef.current
    const engine = engineRef.current
    if (!shell || !stage || !engine || uiState.mascotVisible === false || !uiState.isReady) return

    interactionRef.current?.destroy()

    const ic = new InteractionController({
      shell, stage, engine, uiController,
      getShellMetrics: () => ({
        ...makeMetrics(dimsRef.current.w, dimsRef.current.h),
        viewportWidth:  window.innerWidth,
        viewportHeight: window.innerHeight,
      }),
      getInteractionConfig: () => {
        const assets = queryClient.getQueryData(["mascot-assets"]) || []
        const currentAsset = assets.find(a => a.fileUrl === uiState.character)
        
        if (currentAsset?.interaction_config) {
          // If character has its own config, override the global one
          return { ...(adminDefaults || {}), interaction_config: currentAsset.interaction_config }
        }
        return adminDefaults || {}
      },
    })
    interactionRef.current = ic
    
    // Trigger welcome interaction when the mascot is shown
    ic.playWelcome()

    return () => {
      if (interactionRef.current === ic) interactionRef.current = null
      ic.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiController, uiState.mascotVisible, uiState.isReady])

  // ── Preload configured audios so they appear in Asset Cache UI ────────────
  useEffect(() => {
    try {
      const configObj = interactionRef.current?.getInteractionConfig()
      if (!configObj?.interaction_config) return
      
      const parsed = JSON.parse(configObj.interaction_config)
      const audioUrls = Object.values(parsed)
        .map(zone => zone.audio)
        .filter(url => typeof url === "string" && url.length > 5)
        
      // Ensure each active audio is locally cached
      audioUrls.forEach(url => {
        AssetCacheManager.getOrDownload(url, "Voice/SFX", "audio").catch(() => {})
      })
    } catch (err) {
      // Ignore parsing errors or missing audios
    }
  }, [adminDefaults?.interaction_config, uiState.character])

  // ── Pause on tab-hide ─────────────────────────────────────────────────────
  useEffect(() => {
    const sync = () =>
      engineRef.current?.setPaused(
        document.visibilityState !== "visible" || uiState.mascotVisible === false,
      )
    sync()
    document.addEventListener("visibilitychange", sync)
    return () => document.removeEventListener("visibilitychange", sync)
  }, [uiState.mascotVisible])

  // ── Admin rollback guard ──────────────────────────────────────────────────
  // Must be AFTER all hooks to comply with React rules-of-hooks.
  // disabled.mascotEnabled = admin hard rollback (always off for everyone).
  // resolved.mascotEnabled = false means admin default is off AND user hasn't opted in.
  if (disabled.mascotEnabled || !resolved.mascotEnabled) return null

  // ── Styles ────────────────────────────────────────────────────────────────
  // Default position: bottom-right corner with proper clearance.
  // This is only used before ensurePosition() fires on mount.
  const positionStyle = uiState.position
    ? { left: `${uiState.position.x}px`, top: `${uiState.position.y}px` }
    : {
        right:  "16px",
        bottom: `${BOTTOM_PADDING}px`,
        left:   "auto",
        top:    "auto",
      }

  const shellStyle = {
    ...positionStyle,
    "--mascot-shell-width":  `${dynamicWidth}px`,
    "--mascot-stage-width":  `${dynamicWidth}px`,
    "--mascot-stage-height": `${dynamicHeight}px`,
    display: uiState.mascotVisible === false ? "none" : undefined,
  }

  // ── Launcher ──────────────────────────────────────────────────────────────
  // Remove the old 'isClosed' button entirely, as it's no longer used.
  // The mascot will just be hidden when mascotVisible is false.
  
  // ── Main mascot ───────────────────────────────────────────────────────────
  return (
    <aside
      ref={shellRef}
      className={[
        "mascot-shell",
        uiState.isHovered   ? "is-hovered"   : "",
        uiState.isDragging  ? "is-dragging"  : "",
        uiState.isMinimized ? "is-minimized" : "",
        uiState.mascotVisible === false ? "mascot-hidden" : "",
      ].filter(Boolean).join(" ")}
      style={shellStyle}
      aria-live="polite"
    >
      {/* 3D stage — no explicit width/height attrs; CSS vars + WebGL handle it */}
      <div ref={stageRef} className="mascot-stage">
        <canvas
          ref={canvasRef}
          className="mascot-canvas"
          aria-label="Interactive 3D mascot"
        />

        {(uiState.isLoading || uiState.error) && (
          <div className="mascot-stage-overlay">
            <div className={`mascot-status-card ${uiState.error ? "is-error" : ""}`}>
              {uiState.error ? (
                <>
                  <strong>VRM model missing</strong>
                  <span>{uiState.error}</span>
                </>
              ) : (
                <>
                  <span className="mascot-spinner" aria-hidden="true" />
                  <span>Loading your assistant…</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className={[
          "mascot-bubble",
          uiState.bubble?.visible ? "is-visible" : "",
          uiState.position?.x < (typeof window !== "undefined" ? window.innerWidth / 2 : 960) ? "bubble-flip-right" : ""
        ].filter(Boolean).join(" ")}
        aria-hidden={!uiState.bubble?.visible}
      >
        {uiState.bubble?.message}
      </div>

      <MascotContextMenu uiState={uiState} uiController={uiController} adminDefaults={adminDefaults} />
    </aside>
  )
}

export default MascotRoot