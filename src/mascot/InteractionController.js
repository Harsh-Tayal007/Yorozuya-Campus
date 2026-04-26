const CLICK_DISTANCE_MOUSE = 8   // slightly tighter — reduces accidental drags
const CLICK_DISTANCE_TOUCH = 16
const HOVER_SPEECH_COOLDOWN = 12000

// Delay (ms) to wait for the hide/goodbye animation to finish before closing
const GOODBYE_ANIM_DURATION = 2600

export class InteractionController {
  constructor(options) {
    this.shell = options.shell
    this.stage = options.stage
    this.engine = options.engine
    this.uiController = options.uiController
    this.getShellMetrics = options.getShellMetrics
    // Returns the current adminDefaults so interaction URLs are always fresh
    this.getInteractionConfig = options.getInteractionConfig || (() => ({}))
    this.hovered = false
    this.dragSession = null
    this.tapCount = 0
    this.lastHoverSpeechAt = 0
    this._goodbyeTimer = null

    // Bind all handlers once so removeEventListener works correctly
    this._onWindowPointerDown = this._onWindowPointerDown.bind(this)
    this._onWindowPointerMove = this._onWindowPointerMove.bind(this)
    this._onWindowPointerUp = this._onWindowPointerUp.bind(this)
    this._onWindowPointerCancel = this._onWindowPointerCancel.bind(this)
    this._onContextMenu = this._onContextMenu.bind(this)
    this._onWheel = this._onWheel.bind(this)
    this._onHideRequest = this._onHideRequest.bind(this)

    // Use capture phase to intercept events before the underlying DOM gets them
    window.addEventListener("pointerdown", this._onWindowPointerDown, { capture: true })
    window.addEventListener("pointermove", this._onWindowPointerMove, { capture: true, passive: false })
    window.addEventListener("pointerup", this._onWindowPointerUp, { capture: true })
    window.addEventListener("pointercancel", this._onWindowPointerCancel, { capture: true })
    window.addEventListener("contextmenu", this._onContextMenu, { capture: true })
    window.addEventListener("wheel", this._onWheel, { capture: true, passive: false })
    window.addEventListener("mascot-hide-request", this._onHideRequest)
  }

  destroy() {
    window.removeEventListener("pointerdown", this._onWindowPointerDown, { capture: true })
    window.removeEventListener("pointermove", this._onWindowPointerMove, { capture: true })
    window.removeEventListener("pointerup", this._onWindowPointerUp, { capture: true })
    window.removeEventListener("pointercancel", this._onWindowPointerCancel, { capture: true })
    window.removeEventListener("contextmenu", this._onContextMenu, { capture: true })
    window.removeEventListener("wheel", this._onWheel, { capture: true })
    window.removeEventListener("mascot-hide-request", this._onHideRequest)

    if (this._goodbyeTimer) { clearTimeout(this._goodbyeTimer); this._goodbyeTimer = null }

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

  _onWindowPointerDown(event) {
    // Only primary button on mouse; any touch
    if (event.pointerType === "mouse" && event.button !== 0) return
    const state = this.uiController.getState()
    if (state.contextMenuOpen) return

    // Precise pixel-perfect hit test against the 3D mascot mesh
    const zone = this.engine.hitTest(event.clientX, event.clientY)
    if (!zone) return

    // HIT! We intercept this event so underlying website isn't clicked.
    event.stopPropagation()
    // event.preventDefault() // Optional, but can interfere with touch scrolling if not careful.
    // Actually we want to prevent default to stop scrolling if touching mascot.
    if (event.cancelable) event.preventDefault()

    const origin = state.position ?? { x: window.innerWidth - 300, y: window.innerHeight - 300 }

    this.dragSession = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      dragging: false,
    }
  }

  _onWindowPointerMove(event) {
    const state = this.uiController.getState()
    if (state.contextMenuOpen) return

    this.engine.setViewportPointer(event.clientX, event.clientY)

    if (this.dragSession && this.dragSession.pointerId === event.pointerId) {
      // Intercept while dragging
      event.stopPropagation()
      if (event.cancelable) event.preventDefault()

      const deltaX = event.clientX - this.dragSession.startX
      const deltaY = event.clientY - this.dragSession.startY
      const threshold = this.dragSession.pointerType === "touch" ? CLICK_DISTANCE_TOUCH : CLICK_DISTANCE_MOUSE

      if (!this.dragSession.dragging && Math.hypot(deltaX, deltaY) >= threshold) {
        this.dragSession.dragging = true
        this.uiController.setDragging(true)
        this.hovered = false
        this.engine.setHover(false)
        this.uiController.setHovered(false)
      }

      if (this.dragSession.dragging) {
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
      return
    }

    // Not dragging, just hover tracking
    const zone = this.engine.hitTest(event.clientX, event.clientY)
    const isHit = zone !== null
    if (isHit !== this.hovered) {
      this.hovered = isHit
      this.engine.setHover(isHit)
      this.uiController.setHovered(isHit)
      if (isHit) this._maybeSpeakHover()
    }
  }

  _onWindowPointerUp(event) {
    if (!this.dragSession || this.dragSession.pointerId !== event.pointerId) return

    event.stopPropagation()
    if (event.cancelable) event.preventDefault()

    const { dragging, pointerType } = this.dragSession
    this.dragSession = null
    this.uiController.setDragging(false)

    if (dragging) {
      this.uiController.persistPrefs()
      
      const shellMetrics = this.getShellMetrics()
      this.uiController.snapToEdge({
        ...shellMetrics,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      })
      
      return
    }

    // Tap/click interaction
    const isTouch = pointerType === "touch"
    const zone = this.engine.hitTest(event.clientX, event.clientY)
    const isHit = zone !== null

    this.engine.setHover(isHit)
    this.uiController.setHovered(isHit)

    if (!isHit) return

    if (isTouch) {
      // Touch: generic wave fallback
      this.engine.triggerReaction("wave")
      this.uiController.speak(this._getTapReply(), { duration: 2400 })
      return
    }

    // Mouse click — play the zone-specific interaction animation
    this._playZoneAnimation(zone)
  }

  /**
   * Looks up the admin-configured animation URL for a hit zone and plays it.
   * Falls back to a generic wave reaction if no URL is configured.
   */
  _playZoneAnimation(zone) {
    const config  = this.getInteractionConfig()
    const zoneKey = `interaction_${zone}` // e.g. interaction_head
    const url     = config[zoneKey]

    // Zone-specific speech
    const speechMap = {
      head:   "Hey! That tickles!",
      chest:  "Wah!",
      belly:  "Stop it~",
      crotch: "H-HOW DARE YOU!",
      legs:   "Woah!",
    }
    this.uiController.speak(speechMap[zone] ?? this._getTapReply(), { duration: 2400 })

    if (url) {
      window.dispatchEvent(new CustomEvent("mascot-play-vrma", { detail: { url } }))
    } else {
      // Graceful fallback to built-in wave
      this.engine.triggerReaction("wave")
    }
  }

  /**
   * Handles mascot-hide-request events dispatched by MascotRoot.
   * Plays the goodbye animation then dispatches mascot-hide-confirm after a delay.
   */
  _onHideRequest() {
    const config   = this.getInteractionConfig()
    const hideUrl  = config.interaction_hide

    if (hideUrl) {
      window.dispatchEvent(new CustomEvent("mascot-play-vrma", { detail: { url: hideUrl } }))
    } else {
      this.engine.triggerReaction("wave")
    }

    this.uiController.speak("Goodbye! See you soon!", { duration: 2200 })

    // Wait for animation to finish, then confirm the hide
    if (this._goodbyeTimer) clearTimeout(this._goodbyeTimer)
    this._goodbyeTimer = setTimeout(() => {
      this._goodbyeTimer = null
      window.dispatchEvent(new CustomEvent("mascot-hide-confirm"))
    }, GOODBYE_ANIM_DURATION)
  }

  _onWindowPointerCancel(event) {
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
    const delta = event.deltaY > 0 ? -0.05 : 0.05
    this.uiController.adjustMascotScale(delta)
  }
}

export default InteractionController