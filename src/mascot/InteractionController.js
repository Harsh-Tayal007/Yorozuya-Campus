const CLICK_DISTANCE_MOUSE = 8   // slightly tighter — reduces accidental drags
const CLICK_DISTANCE_TOUCH = 16
const HOVER_SPEECH_COOLDOWN = 12000

export class InteractionController {
  constructor(options) {
    this.shell = options.shell
    this.stage = options.stage
    this.engine = options.engine
    this.uiController = options.uiController
    this.getShellMetrics = options.getShellMetrics
    this.hovered = false
    this.dragSession = null
    this.tapCount = 0
    this.lastHoverSpeechAt = 0

    // Bind all handlers once so removeEventListener works correctly
    this._onShellPointerDown = this._onShellPointerDown.bind(this)
    this._onWindowPointerMove = this._onWindowPointerMove.bind(this)
    this._onWindowPointerUp = this._onWindowPointerUp.bind(this)
    this._onStagePointerMove = this._onStagePointerMove.bind(this)
    this._onStagePointerLeave = this._onStagePointerLeave.bind(this)
    this._onPointerCancel = this._onPointerCancel.bind(this)
    this._onContextMenu = this._onContextMenu.bind(this)
    this._onWheel = this._onWheel.bind(this)

    this.shell.addEventListener("pointerdown", this._onShellPointerDown)
    this.stage.addEventListener("pointermove", this._onStagePointerMove)
    this.stage.addEventListener("pointerleave", this._onStagePointerLeave)
    this.stage.addEventListener("contextmenu", this._onContextMenu)
    this.stage.addEventListener("wheel", this._onWheel, { passive: false })
    window.addEventListener("pointermove", this._onWindowPointerMove, { passive: true })
    window.addEventListener("pointerup", this._onWindowPointerUp)
    window.addEventListener("pointercancel", this._onPointerCancel)
  }

  destroy() {
    this.shell.removeEventListener("pointerdown", this._onShellPointerDown)
    this.stage.removeEventListener("pointermove", this._onStagePointerMove)
    this.stage.removeEventListener("pointerleave", this._onStagePointerLeave)
    this.stage.removeEventListener("contextmenu", this._onContextMenu)
    this.stage.removeEventListener("wheel", this._onWheel)
    window.removeEventListener("pointermove", this._onWindowPointerMove)
    window.removeEventListener("pointerup", this._onWindowPointerUp)
    window.removeEventListener("pointercancel", this._onPointerCancel)

    // Reset any lingering state
    this.engine?.setHover(false)
    this.uiController?.setHovered(false)
    this.uiController?.setDragging(false)
    this.dragSession = null
    this.hovered = false
  }

  _getTapReply() {
    const replies = ["Hey!", "Need help?", "Welcome back!", "What's up?"]
    const reply = replies[this.tapCount % replies.length]
    this.tapCount += 1
    return reply
  }

  _maybeSpeakHover() {
    const now = Date.now()
    if (now - this.lastHoverSpeechAt < HOVER_SPEECH_COOLDOWN) return
    this.lastHoverSpeechAt = now
    this.uiController.speak("Need help?", { duration: 2200 })
  }

  _onShellPointerDown(event) {
    // Only primary button on mouse; any touch
    if (event.pointerType === "mouse" && event.button !== 0) return
    // Don't steal events from UI overlays (close btn, context menu)
    if (event.target.closest("[data-mascot-ignore-interaction='true']")) return

    const state = this.uiController.getState()
    // Don't start a drag session if context menu is open — let the overlay close it
    if (state.contextMenuOpen) return

    const origin = state.position ?? { x: 16, y: 16 }

    this.dragSession = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      dragging: false,
    }

    // Capture pointer on the shell for reliable drag tracking across boundaries
    try {
      this.shell.setPointerCapture(event.pointerId)
    } catch {
      // Safari may throw if already captured
    }
  }

  _onWindowPointerMove(event) {
    const state = this.uiController.getState()
    if (state.contextMenuOpen) return

    // Always update look-at so the character tracks the cursor
    this.engine.setViewportPointer(event.clientX, event.clientY)

    if (!this.dragSession || this.dragSession.pointerId !== event.pointerId) return

    const deltaX = event.clientX - this.dragSession.startX
    const deltaY = event.clientY - this.dragSession.startY
    const threshold =
      this.dragSession.pointerType === "touch"
        ? CLICK_DISTANCE_TOUCH
        : CLICK_DISTANCE_MOUSE

    if (!this.dragSession.dragging && Math.hypot(deltaX, deltaY) >= threshold) {
      this.dragSession.dragging = true
      this.uiController.setDragging(true)
      // Clear hover while dragging
      this.hovered = false
      this.engine.setHover(false)
      this.uiController.setHovered(false)
    }

    if (!this.dragSession.dragging) return

    const shellMetrics = this.getShellMetrics()
    const nextPosition = this.uiController.clampPosition(
      {
        x: this.dragSession.originX + deltaX,
        y: this.dragSession.originY + deltaY,
      },
      {
        ...shellMetrics,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      },
    )

    this.uiController.setPosition(nextPosition)
  }

  _onWindowPointerUp(event) {
    if (!this.dragSession || this.dragSession.pointerId !== event.pointerId) return

    const { dragging, pointerType } = this.dragSession
    this.dragSession = null
    this.uiController.setDragging(false)

    // Only persist when the user actually dragged — not on every click
    if (dragging) {
      this.uiController.persistPrefs()
      return
    }

    // Click / tap — fire interaction
    const isTouch = pointerType === "touch"

    if (isTouch) {
      // Touch: hit-test is unreliable on small canvas targets, always fire
      this.engine.triggerReaction("wave")
      this.uiController.speak(this._getTapReply(), { duration: 2400 })
      return
    }

    const hit = this.engine.hitTest(event.clientX, event.clientY)
    this.engine.setHover(hit)
    this.uiController.setHovered(hit)

    if (!hit) return

    this.engine.triggerReaction("wave")
    this.uiController.speak(this._getTapReply(), { duration: 2400 })
  }

  _onStagePointerMove(event) {
    if (this.uiController.getState().contextMenuOpen) return
    // Skip during drag — avoids false hover detections
    if (this.dragSession?.dragging) return

    const hit = this.engine.hitTest(event.clientX, event.clientY)

    if (hit !== this.hovered) {
      this.hovered = hit
      this.engine.setHover(hit)
      this.uiController.setHovered(hit)

      if (hit) this._maybeSpeakHover()
    }
  }

  _onStagePointerLeave(event) {
    // relatedTarget null = pointer left the window entirely
    if (event.relatedTarget === null) {
      this.engine.clearPointer()
    }
    this.hovered = false
    this.engine.setHover(false)
    this.uiController.setHovered(false)
  }

  _onPointerCancel(event) {
    if (this.dragSession?.pointerId === event.pointerId) {
      this.dragSession = null
      this.uiController.setDragging(false)
    }
    this.hovered = false
    this.engine.clearPointer()
    this.engine.setHover(false)
    this.uiController.setHovered(false)
  }

  _onContextMenu(event) {
    if (!this.hovered) return
    event.preventDefault()
    event.stopPropagation()
    this.uiController.openContextMenu(event.clientX, event.clientY)
  }

  _onWheel(event) {
    if (!this.hovered) return
    if (this.uiController.getState().contextMenuOpen) return
    event.preventDefault()
    event.stopPropagation()
    // deltaY > 0 → scroll down → shrink; < 0 → grow
    const delta = event.deltaY > 0 ? -0.05 : 0.05
    this.uiController.adjustMascotScale(delta)
  }
}

export default InteractionController