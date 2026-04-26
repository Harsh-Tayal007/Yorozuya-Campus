const STORAGE_KEY = "uz_mascot_prefs_v1"

const DEFAULT_STATE = {
  isClosed: false,
  isMinimized: false,
  isDragging: false,
  isHovered: false,
  isLoading: true,
  isReady: false,
  error: "",
  position: null,
  bubble: {
    message: "",
    visible: false,
  },
  mascotVisible: true,
  sfxEnabled: true,
  character: "/mascot/assistant.vrm",
  mascotScale: 1.0,
  contextMenuOpen: false,
  contextMenuPosition: { x: 0, y: 0 },
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export class UIController {
  constructor(options = {}) {
    this.storageKey = options.storageKey ?? STORAGE_KEY
    this.listeners = new Set()
    this.speechTimer = null
    this.state = {
      ...DEFAULT_STATE,
      ...this.loadStoredPrefs(),
      // Always reset volatile runtime state regardless of stored prefs
      isDragging: false,
      isHovered: false,
      isLoading: true,
      isReady: false,
      error: "",
      bubble: { ...DEFAULT_STATE.bubble },
      contextMenuOpen: false,
      contextMenuPosition: { x: 0, y: 0 },
    }
  }

  loadStoredPrefs() {
    if (typeof window === "undefined") return {}

    try {
      const raw = window.localStorage.getItem(this.storageKey)
      if (!raw) return {}

      const parsed = JSON.parse(raw)
      return {
        isClosed: Boolean(parsed.isClosed),
        isMinimized: Boolean(parsed.isMinimized),
        mascotVisible: parsed.mascotVisible !== false,
        sfxEnabled: parsed.sfxEnabled !== false,
        character:
          typeof parsed.character === "string"
            ? parsed.character === "assistant.vrm"
              ? "/mascot/assistant.vrm"
              : parsed.character
            : "/mascot/assistant.vrm",
        position:
          parsed.position &&
          Number.isFinite(parsed.position.x) &&
          Number.isFinite(parsed.position.y)
            ? { x: parsed.position.x, y: parsed.position.y }
            : null,
        mascotScale:
          typeof parsed.mascotScale === "number"
            ? clamp(parsed.mascotScale, 0.5, 1.6)
            : 1.0,
        sequenceUrls: Array.isArray(parsed.sequenceUrls) ? parsed.sequenceUrls : [],
      }
    } catch {
      return {}
    }
  }

  /** Public — called by InteractionController after drag ends */
  persistPrefs() {
    if (typeof window === "undefined") return

    try {
      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          isClosed: this.state.isClosed,
          isMinimized: this.state.isMinimized,
          mascotVisible: this.state.mascotVisible,
          sfxEnabled: this.state.sfxEnabled,
          character: this.state.character,
          position: this.state.position,
          mascotScale: this.state.mascotScale,
          sequenceUrls: this.state.sequenceUrls,
        }),
      )
    } catch {
      // Ignore — mascot continues working for the session
    }
  }

  snapshot() {
    return {
      ...this.state,
      position: this.state.position ? { ...this.state.position } : null,
      bubble: { ...this.state.bubble },
    }
  }

  emit() {
    const nextState = this.snapshot()
    this.listeners.forEach((listener) => listener(nextState))
  }

  getState() {
    return this.snapshot()
  }

  subscribe(listener) {
    this.listeners.add(listener)
    listener(this.snapshot())
    return () => this.listeners.delete(listener)
  }

  setLoading(isLoading) {
    this.state.isLoading = Boolean(isLoading)
    this.emit()
  }

  setReady(isReady) {
    this.state.isReady = Boolean(isReady)
    if (isReady) {
      this.state.isLoading = false
      this.state.error = ""
    }
    this.emit()
  }

  setError(error) {
    this.state.error = error ?? ""
    if (error) {
      this.state.isLoading = false
      this.state.isReady = false
    }
    this.emit()
  }

  setHovered(isHovered) {
    this.state.isHovered = Boolean(isHovered)
    this.emit()
  }

  setDragging(isDragging) {
    this.state.isDragging = Boolean(isDragging)
    this.emit()
  }

  setMinimized(isMinimized) {
    this.state.isMinimized = Boolean(isMinimized)
    if (isMinimized) this.hideBubble()
    this.persistPrefs()
    this.emit()
  }

  toggleMinimized() {
    this.setMinimized(!this.state.isMinimized)
  }

  setClosed(isClosed) {
    this.state.isClosed = Boolean(isClosed)
    this.state.isDragging = false
    if (isClosed) this.hideBubble()
    this.persistPrefs()
    this.emit()
  }

  reopen() {
    this.state.isClosed = false
    this.state.isMinimized = false
    this.persistPrefs()
    this.emit()
  }

  hideBubble() {
    if (this.speechTimer) {
      window.clearTimeout(this.speechTimer)
      this.speechTimer = null
    }
    this.state.bubble = { message: "", visible: false }
  }

  speak(message, options = {}) {
    const trimmed = String(message ?? "").trim()
    if (!trimmed || this.state.isClosed) return

    const duration = options.duration ?? 2800

    if (this.speechTimer) {
      window.clearTimeout(this.speechTimer)
      this.speechTimer = null
    }

    this.state.bubble = { message: trimmed, visible: true }
    this.emit()

    if (duration > 0 && typeof window !== "undefined") {
      this.speechTimer = window.setTimeout(() => {
        this.hideBubble()
        this.emit()
      }, duration)
    }
  }

  clampPosition(position, metrics = {}) {
    if (!position) return null

    const viewportWidth = metrics.viewportWidth ?? window.innerWidth
    const viewportHeight = metrics.viewportHeight ?? window.innerHeight
    const padding = metrics.padding ?? 16
    const bottomPadding = metrics.bottomPadding ?? 88
    const width = metrics.width ?? 0
    const height = metrics.height ?? 0

    return {
      x: Math.round(
        clamp(position.x, padding, Math.max(padding, viewportWidth - width - padding)),
      ),
      y: Math.round(
        clamp(position.y, padding, Math.max(padding, viewportHeight - height - bottomPadding)),
      ),
    }
  }

  snapToEdge(metrics = {}) {
    if (!this.state.position) return

    const viewportWidth = metrics.viewportWidth ?? window.innerWidth
    const viewportHeight = metrics.viewportHeight ?? window.innerHeight
    const width = metrics.width ?? 1600
    const height = metrics.height ?? 1600
    const padding = metrics.padding ?? -(width / 2) + 50
    const bottomPadding = metrics.bottomPadding ?? -(height / 2) + 50

    const minX = padding
    const maxX = Math.max(padding, viewportWidth - width - padding)
    const maxY = Math.max(padding, viewportHeight - height - bottomPadding)

    const distLeft = this.state.position.x - minX
    const distRight = maxX - this.state.position.x
    const distBottom = maxY - this.state.position.y

    const SNAP_THRESHOLD = 150 // pixels

    let newX = this.state.position.x
    let newY = this.state.position.y

    // Magnetic snap to left/right
    if (distLeft < SNAP_THRESHOLD && distLeft < distRight) {
      newX = minX
    } else if (distRight < SNAP_THRESHOLD) {
      newX = maxX
    }

    // Magnetic snap to bottom
    if (distBottom < SNAP_THRESHOLD) {
      newY = maxY
    }

    if (newX !== this.state.position.x || newY !== this.state.position.y) {
      this.state.position = { x: newX, y: newY }
      this.persistPrefs()
      this.emit()
    }
  }

  ensurePosition(metrics = {}) {
    if (this.state.position) {
      const clamped = this.clampPosition(this.state.position, metrics)
      if (
        clamped.x !== this.state.position.x ||
        clamped.y !== this.state.position.y
      ) {
        this.state.position = clamped
        this.persistPrefs()
        this.emit()
      }
      return
    }

    const viewportWidth = metrics.viewportWidth ?? window.innerWidth
    const viewportHeight = metrics.viewportHeight ?? window.innerHeight
    const padding = metrics.padding ?? 16
    const bottomPadding = metrics.bottomPadding ?? 88
    const width = metrics.width ?? 300
    const height = metrics.height ?? 480

    this.state.position = this.clampPosition(
      {
        x: viewportWidth - width - padding,
        y: viewportHeight - height - bottomPadding,
      },
      metrics,
    )

    this.persistPrefs()
    this.emit()
  }

  setPosition(position, options = {}) {
    if (!position) return

    const nextPosition = options.metrics
      ? this.clampPosition(position, options.metrics)
      : { x: Math.round(position.x), y: Math.round(position.y) }

    const prev = this.state.position
    if (prev && prev.x === nextPosition.x && prev.y === nextPosition.y) return

    this.state.position = nextPosition

    if (options.persist) {
      this.persistPrefs()
    }

    this.emit()
  }

  // ── Phase 2 pref methods ───────────────────────────────────────────────────

  setMascotVisible(visible) {
    this.state.mascotVisible = Boolean(visible)
    this.persistPrefs()
    this.emit()
  }

  toggleMascotVisible() {
    this.setMascotVisible(!this.state.mascotVisible)
  }

  setSfxEnabled(enabled) {
    this.state.sfxEnabled = Boolean(enabled)
    this.persistPrefs()
    this.emit()
  }

  setCharacter(filename) {
    if (typeof filename !== "string" || !filename) return
    this.state.character = filename
    this.persistPrefs()
    this.emit()
  }

  openContextMenu(x, y) {
    // Clamp menu position to viewport so it never renders off-screen
    const menuW = 260
    const menuH = 320
    this.state.contextMenuOpen = true
    this.state.contextMenuPosition = {
      x: clamp(x, 4, window.innerWidth - menuW - 4),
      y: clamp(y, 4, window.innerHeight - menuH - 4),
    }
    this.emit()
  }

  closeContextMenu() {
    this.state.contextMenuOpen = false
    this.emit()
  }

  setMascotScale(scale) {
    this.state.mascotScale = clamp(scale, 0.5, 1.6)
    this.persistPrefs()
    this.emit()
  }

  adjustMascotScale(delta) {
    this.setMascotScale(this.state.mascotScale + delta)
  }

  destroy() {
    this.hideBubble()
    this.listeners.clear()
  }
}

export default UIController