import AssetCacheManager from "./AssetCacheManager.js"

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
    this._currentAudio = null

    // Bind all handlers once so removeEventListener works correctly
    this._onWindowPointerDown = this._onWindowPointerDown.bind(this)
    this._onWindowPointerMove = this._onWindowPointerMove.bind(this)
    this._onWindowPointerUp = this._onWindowPointerUp.bind(this)
    this._onWindowPointerCancel = this._onWindowPointerCancel.bind(this)
    this._onContextMenu = this._onContextMenu.bind(this)
    this._onWheel = this._onWheel.bind(this)
    this._onHideRequest = this._onHideRequest.bind(this)
    this._onTestInteraction = this._onTestInteraction.bind(this)

    // Use capture phase to intercept events before the underlying DOM gets them
    window.addEventListener("pointerdown", this._onWindowPointerDown, { capture: true })
    window.addEventListener("pointermove", this._onWindowPointerMove, { capture: true, passive: false })
    window.addEventListener("pointerup", this._onWindowPointerUp, { capture: true })
    window.addEventListener("pointercancel", this._onWindowPointerCancel, { capture: true })
    window.addEventListener("contextmenu", this._onContextMenu, { capture: true })
    window.addEventListener("wheel", this._onWheel, { capture: true, passive: false })
    window.addEventListener("mascot-hide-request", this._onHideRequest)
    window.addEventListener("mascot-test-interaction", this._onTestInteraction)
  }

  destroy() {
    window.removeEventListener("pointerdown", this._onWindowPointerDown, { capture: true })
    window.removeEventListener("pointermove", this._onWindowPointerMove, { capture: true })
    window.removeEventListener("pointerup", this._onWindowPointerUp, { capture: true })
    window.removeEventListener("pointercancel", this._onWindowPointerCancel, { capture: true })
    window.removeEventListener("contextmenu", this._onContextMenu, { capture: true })
    window.removeEventListener("wheel", this._onWheel, { capture: true })
    window.removeEventListener("mascot-hide-request", this._onHideRequest)
    window.removeEventListener("mascot-test-interaction", this._onTestInteraction)

    if (this._goodbyeTimer) { clearTimeout(this._goodbyeTimer); this._goodbyeTimer = null }
    if (this._currentAudio) {
      this._currentAudio.pause()
      this._currentAudio = null
    }

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
   * Stops any currently playing audio/TTS, then plays the new audio (if provided)
   * or uses browser TTS as a fallback if SFX is enabled.
   */
  _playAudioOrTTS(audioUrl, text, onEnd = null) {
    // 1. Stop previous
    if (this._currentOnEnd) {
      this._currentOnEnd()
      this._currentOnEnd = null
    }
    if (this._currentAudio) {
      this._currentAudio.pause()
      this._currentAudio = null
    }
    window.speechSynthesis.cancel()

    const state = this.uiController.getState()
    const willPlayAudio = state.sfxEnabled && (audioUrl || text)

    // 2. Display text
    if (text) {
      // If we are about to play audio, we tell speak() not to auto-hide (duration: 0)
      this.uiController.speak(text, { duration: willPlayAudio ? 0 : 2400 })
    }

    // 3. Play sound if SFX is enabled
    if (!state.sfxEnabled) {
      if (onEnd) setTimeout(onEnd, 2400)
      return
    }

    const hideBubbleNow = () => {
      this.uiController.hideBubble()
      this.uiController.emit()
      
      const callback = this._currentOnEnd
      this._currentOnEnd = null
      
      if (callback) {
        // Wait for the 250ms CSS fade-out animation to finish before invoking onEnd
        setTimeout(callback, 260)
      }
    }
    this._currentOnEnd = onEnd

    if (audioUrl) {
      // Play specific file immediately using browser's HTTP cache
      this._currentAudio = new Audio(audioUrl)
      this._currentAudio.volume = state.sfxVolume ?? 1.0

      this._currentAudio.addEventListener("ended", hideBubbleNow)
      this._currentAudio.addEventListener("error", () => {
        setTimeout(hideBubbleNow, 2400)
      })

      this._currentAudio.play().catch(e => {
        console.warn("Mascot audio play blocked:", e)
        setTimeout(hideBubbleNow, 2400)
      })
      
      // Asynchronously ensure it's cached so it appears in DashboardSettings
      AssetCacheManager.getOrDownload(audioUrl, "Voice/SFX", "audio").catch(() => {})
    } else if (text) {
      // Fallback to TTS
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.1
      utterance.pitch = 1.2 // slightly higher pitch for anime feel
      utterance.volume = state.sfxVolume ?? 1.0
      
      utterance.onend = hideBubbleNow
      utterance.onerror = () => setTimeout(hideBubbleNow, 2400)

      window.speechSynthesis.speak(utterance)
    }
  }

  /**
   * Tests an interaction from the Admin UI directly
   */
  _onTestInteraction(e) {
    const { animation, audio, text } = e.detail || {}
    if (animation) {
      window.dispatchEvent(new CustomEvent("mascot-play-vrma", { detail: { url: animation } }))
    }
    this._playAudioOrTTS(audio, text)
  }

  /**
   * Plays the welcome interaction when the mascot first appears
   */
  playWelcome() {
    this._playZoneAnimation("welcome")
  }

  /**
   * Looks up the admin-configured interaction config for a hit zone and plays it.
   */
  _playZoneAnimation(zone) {
    const config = this.getInteractionConfig()
    
    // Default legacy mapping if JSON is not populated yet
    const legacySpeechMap = {
      head:   "Hey! That tickles!",
      chest:  "Wah!",
      belly:  "Stop it~",
      crotch: "H-HOW DARE YOU!",
      legs:   "Woah!",
      welcome: "Hello! Need any help?",
    }

    let url = config[`interaction_${zone}`]
    let audio = null
    let text = legacySpeechMap[zone] ?? this._getTapReply()

    // Try parsing the new JSON structure
    if (config.interaction_config) {
      try {
        const parsed = JSON.parse(config.interaction_config)
        const zoneData = parsed[zone]
        if (zoneData) {
          url = zoneData.animation
          audio = zoneData.audio
          text = zoneData.text || text // Keep fallback text if none in JSON
        }
      } catch (e) {
        console.error("Failed to parse interaction_config JSON", e)
      }
    }

    this._playAudioOrTTS(audio, text)

    if (url) {
      window.dispatchEvent(new CustomEvent("mascot-play-vrma", { detail: { url } }))
    } else {
      this.engine.triggerReaction("wave")
    }
  }

  /**
   * Handles mascot-hide-request events dispatched by MascotRoot.
   * Plays the goodbye animation then dispatches mascot-hide-confirm after a delay.
   */
  _onHideRequest = (e) => {
    const isPermanent = e?.detail?.permanent || false
    const config = this.getInteractionConfig()
    let hideUrl = config.interaction_hide
    let audio = null
    let text = "Goodbye! See you soon!"

    if (config.interaction_config) {
      try {
        const parsed = JSON.parse(config.interaction_config)
        if (parsed.hide) {
          hideUrl = parsed.hide.animation
          audio = parsed.hide.audio
          text = parsed.hide.text || text
        }
      } catch (e) {}
    }

    let audioFinished = false
    let animFinished = false

    const maybeConfirmHide = () => {
      if (audioFinished && animFinished) {
        if (this._goodbyeTimer) { clearTimeout(this._goodbyeTimer); this._goodbyeTimer = null }
        window.dispatchEvent(new CustomEvent("mascot-hide-confirm", { detail: { permanent: isPermanent } }))
      }
    }

    const onAudioEnd = () => {
      audioFinished = true
      maybeConfirmHide()
    }

    this._playAudioOrTTS(audio, text, onAudioEnd)

    if (hideUrl) {
      window.dispatchEvent(new CustomEvent("mascot-play-vrma", { detail: { url: hideUrl } }))
    } else {
      this.engine.triggerReaction("wave")
    }

    // Wait for the 2600ms waving animation to finish
    setTimeout(() => {
      animFinished = true
      maybeConfirmHide()
    }, 2600)

    // Safety fallback: if audio fails to report end, force confirm after 10s
    this._goodbyeTimer = setTimeout(() => {
      audioFinished = true
      animFinished = true
      maybeConfirmHide()
    }, 10000)
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