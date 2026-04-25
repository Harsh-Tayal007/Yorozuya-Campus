import * as THREE from "three"
import { VRMExpressionPresetName, VRMHumanBoneName } from "@pixiv/three-vrm"
import { createVRMAnimationClip } from "@pixiv/three-vrm-animation"

const damp = (current, target, smoothing, delta) => {
  const t = 1 - Math.exp(-smoothing * delta)
  return current + (target - current) * t
}

const lerp = (start, end, alpha) => start + (end - start) * alpha

// ── Pose Library ─────────────────────────────────────────────────────────────
const POSES = {
  idle_default: {
    [VRMHumanBoneName.LeftUpperArm]:  { x:  0,    y:  0,    z:  1.3  },
    [VRMHumanBoneName.RightUpperArm]: { x:  0,    y:  0,    z: -1.3  },
    [VRMHumanBoneName.LeftLowerArm]:  { x:  0.15, y:  0,    z:  0    },
    [VRMHumanBoneName.RightLowerArm]: { x:  0.15, y:  0,    z:  0    },
    [VRMHumanBoneName.Spine]:         { x:  0,    y:  0,    z:  0    },
    [VRMHumanBoneName.Chest]:         { x:  0,    y:  0,    z:  0    },
    [VRMHumanBoneName.Neck]:          { x:  0,    y:  0,    z:  0    },
    [VRMHumanBoneName.Head]:          { x:  0,    y:  0,    z:  0    },
    [VRMHumanBoneName.RightShoulder]: { x:  0,    y:  0,    z:  0    },
  },
  thinking: {
    [VRMHumanBoneName.LeftUpperArm]:  { x:  0,    y:  0,    z:  1.3  },
    [VRMHumanBoneName.RightUpperArm]: { x:  0.85, y:  0.1,  z: -0.4  },
    [VRMHumanBoneName.RightLowerArm]: { x:  1.05, y:  0.3,  z:  0    },
    [VRMHumanBoneName.LeftLowerArm]:  { x:  0.15, y:  0,    z:  0    },
    [VRMHumanBoneName.Head]:          { x:  0.1,  y:  0.22, z:  0.12 },
    [VRMHumanBoneName.Neck]:          { x:  0.06, y:  0.14, z:  0.08 },
    [VRMHumanBoneName.Spine]:         { x:  0.06, y:  0.06, z:  0    },
    [VRMHumanBoneName.Chest]:         { x:  0.04, y:  0.06, z:  0    },
    [VRMHumanBoneName.RightShoulder]: { x:  0,    y:  0,    z:  0.1  },
  },
  victory: {
    [VRMHumanBoneName.LeftUpperArm]:  { x:  0.35, y:  0,    z: -0.6  },
    [VRMHumanBoneName.RightUpperArm]: { x:  0.35, y:  0,    z:  0.6  },
    [VRMHumanBoneName.LeftLowerArm]:  { x:  0.4,  y: -0.2,  z: -0.12 },
    [VRMHumanBoneName.RightLowerArm]: { x:  0.4,  y:  0.2,  z:  0.12 },
    [VRMHumanBoneName.Head]:          { x: -0.12, y:  0,    z:  0    },
    [VRMHumanBoneName.Neck]:          { x: -0.07, y:  0,    z:  0    },
    [VRMHumanBoneName.Spine]:         { x: -0.1,  y:  0,    z:  0    },
    [VRMHumanBoneName.Chest]:         { x: -0.12, y:  0,    z:  0    },
    [VRMHumanBoneName.RightShoulder]: { x:  0,    y:  0,    z:  0.08 },
  },
  stretch: {
    [VRMHumanBoneName.LeftUpperArm]:  { x: -0.3,  y: -0.25, z:  0.95 },
    [VRMHumanBoneName.RightUpperArm]: { x: -0.3,  y:  0.25, z: -0.95 },
    [VRMHumanBoneName.LeftLowerArm]:  { x: -0.1,  y:  0,    z:  0    },
    [VRMHumanBoneName.RightLowerArm]: { x: -0.1,  y:  0,    z:  0    },
    [VRMHumanBoneName.Spine]:         { x: -0.2,  y:  0,    z:  0    },
    [VRMHumanBoneName.Chest]:         { x: -0.24, y:  0,    z:  0    },
    [VRMHumanBoneName.Head]:          { x:  0.12, y:  0,    z:  0    },
    [VRMHumanBoneName.Neck]:          { x:  0.08, y:  0,    z:  0    },
    [VRMHumanBoneName.RightShoulder]: { x:  0,    y:  0.12, z: -0.06 },
  },
  point_up: {
    [VRMHumanBoneName.LeftUpperArm]:  { x:  0,    y:  0,    z:  1.3  },
    [VRMHumanBoneName.RightUpperArm]: { x:  0.25, y:  0,    z:  0.55 },
    [VRMHumanBoneName.RightLowerArm]: { x: -0.28, y:  0,    z: -0.9  },
    [VRMHumanBoneName.LeftLowerArm]:  { x:  0.15, y:  0,    z:  0    },
    [VRMHumanBoneName.Head]:          { x: -0.14, y: -0.2,  z:  0    },
    [VRMHumanBoneName.Neck]:          { x: -0.09, y: -0.13, z:  0    },
    [VRMHumanBoneName.Spine]:         { x:  0.06, y: -0.1,  z:  0    },
    [VRMHumanBoneName.Chest]:         { x:  0.06, y: -0.1,  z:  0    },
    [VRMHumanBoneName.RightShoulder]: { x:  0,    y: -0.1,  z:  0.12 },
  },
  arms_crossed: {
    [VRMHumanBoneName.LeftUpperArm]:  { x:  0.55, y:  0,    z:  0.55 },
    [VRMHumanBoneName.RightUpperArm]: { x:  0.55, y:  0,    z: -0.55 },
    [VRMHumanBoneName.LeftLowerArm]:  { x:  1.15, y:  0.55, z:  0.1  },
    [VRMHumanBoneName.RightLowerArm]: { x:  1.15, y: -0.55, z: -0.1  },
    [VRMHumanBoneName.Head]:          { x:  0.08, y:  0,    z:  0    },
    [VRMHumanBoneName.Neck]:          { x:  0.04, y:  0,    z:  0    },
    [VRMHumanBoneName.Spine]:         { x:  0.07, y:  0,    z:  0    },
    [VRMHumanBoneName.Chest]:         { x:  0.07, y:  0,    z:  0    },
    [VRMHumanBoneName.RightShoulder]: { x:  0,    y:  0,    z: -0.1  },
  },
}

// Weighted pool — idle appears more often so it feels natural
const POSE_POOL = [
  "idle_default", "idle_default",
  "thinking", "stretch", "point_up", "arms_crossed", "victory",
]

const TRACKED_BONES = [
  VRMHumanBoneName.Spine,
  VRMHumanBoneName.Chest,
  VRMHumanBoneName.Neck,
  VRMHumanBoneName.Head,
  VRMHumanBoneName.RightShoulder,
  VRMHumanBoneName.RightUpperArm,
  VRMHumanBoneName.RightLowerArm,
  VRMHumanBoneName.LeftUpperArm,
  VRMHumanBoneName.LeftLowerArm,
]

export class AnimationController {
  constructor() {
    this.vrm = null
    this.time = 0
    this.hoverWeight = 0
    this.targetHoverWeight = 0
    this.blinkWeight = 0
    this.blinkElapsed = 0
    this.blinkCooldown = this._nextBlinkCooldown()
    this.reaction = null
    this.baseScenePosition = new THREE.Vector3()
    this.bones = new Map()
    this.baseQuaternions = new Map()
    this.euler = new THREE.Euler()
    this.offsetQuaternion = new THREE.Quaternion()

    // Pose system
    this.currentPoseName = "idle_default"
    this.targetPoseName  = "idle_default"
    this.poseBlendAlpha  = 1
    this.poseBlendSpeed  = 0.45
    this.poseTimer       = this._nextPoseInterval()

    // VRMA animation
    this.mixer = null
    this.vrmaClips = []
    this.currentVrmaIndex = 0
    this.vrmaTimer = 60
    this.currentAction = null
  }

  _nextBlinkCooldown() { return 2.4 + Math.random() * 2.2 }
  _nextPoseInterval()  { return 8 + Math.random() * 12 }

  // ── Public API ──────────────────────────────────────────────────────────────

  loadVRMAs(vrmAnimations) {
    if (!this.vrm || vrmAnimations.length === 0) return

    // Dispose any existing mixer cleanly before creating a new one
    this._disposeMixer()

    this.vrmaClips = vrmAnimations.map((anim) => createVRMAnimationClip(anim, this.vrm))
    this.mixer = new THREE.AnimationMixer(this.vrm.scene)
    this._playVrmaIndex(0)
  }

  playOverrideAnimation(vrmaAnimation) {
    if (!this.vrm || !vrmaAnimation) return

    const clip = createVRMAnimationClip(vrmaAnimation, this.vrm)

    if (!this.mixer) {
      this.mixer = new THREE.AnimationMixer(this.vrm.scene)
    }

    const newAction = this.mixer.clipAction(clip)
    if (this.currentAction) {
      newAction.reset().play()
      newAction.crossFadeFrom(this.currentAction, 0.6, true)
    } else {
      newAction.play()
    }

    this.currentAction = newAction
    this.vrmaTimer = Math.max(clip.duration, 4)
  }

  attach(vrm) {
    this._resetState(vrm)
  }

  dispose() {
    if (this.vrm?.expressionManager) {
      this.vrm.expressionManager.resetValues()
      this.vrm.expressionManager.update()
    }
    this._disposeMixer()
    this.vrm = null
    this.bones.clear()
    this.baseQuaternions.clear()
  }

  setHover(isHovered) {
    this.targetHoverWeight = isHovered ? 1 : 0
  }

  triggerReaction(type = "wave") {
    this.reaction = { type, elapsed: 0, duration: 1.2 }
  }

  update(delta) {
    if (!this.vrm) return

    this.time += delta
    this.hoverWeight = damp(this.hoverWeight, this.targetHoverWeight, 7, delta)
    this._updateBlink(delta)

    if (this.mixer) {
      // VRMA mode — tick mixer, cycle when clip finishes
      this.vrmaTimer -= delta
      if (this.vrmaTimer <= 0) {
        this._playVrmaIndex(this.currentVrmaIndex + 1)
      }
      this.mixer.update(delta)

      // In VRMA mode only apply hover float — mixer handles all bones
      const hoverLift = this.hoverWeight * 0.012
      this.vrm.scene.position.set(
        this.baseScenePosition.x,
        this.baseScenePosition.y + hoverLift,
        this.baseScenePosition.z,
      )
    } else {
      // Procedural mode
      this._updatePoseScheduler(delta)
      this._applyProceduralPose(delta)
    }

    this._updateExpressions()
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  _resetState(vrm) {
    // Fully dispose previous state first
    this.dispose()

    this.vrm = vrm
    this.time = 0
    this.hoverWeight = 0
    this.targetHoverWeight = 0
    this.blinkWeight = 0
    this.blinkElapsed = 0
    this.blinkCooldown = this._nextBlinkCooldown()
    this.reaction = null
    this.baseScenePosition.copy(vrm.scene.position)
    this.currentPoseName = "idle_default"
    this.targetPoseName  = "idle_default"
    this.poseBlendAlpha  = 1
    this.poseTimer       = this._nextPoseInterval()

    TRACKED_BONES.forEach((boneName) => {
      const bone = vrm.humanoid.getNormalizedBoneNode(boneName)
      if (!bone) return
      this.bones.set(boneName, bone)
      this.baseQuaternions.set(boneName, bone.quaternion.clone())
    })

    vrm.expressionManager?.resetValues()
  }

  _disposeMixer() {
    if (this.mixer) {
      this.mixer.stopAllAction()
      this.mixer.uncacheRoot(this.mixer.getRoot())
      this.mixer = null
    }
    this.vrmaClips = []
    this.currentAction = null
    this.currentVrmaIndex = 0
    this.vrmaTimer = 60
  }

  _playVrmaIndex(index) {
    if (!this.mixer || this.vrmaClips.length === 0) return

    this.currentVrmaIndex = index % this.vrmaClips.length
    const clip = this.vrmaClips[this.currentVrmaIndex]
    const newAction = this.mixer.clipAction(clip)

    if (this.currentAction && this.currentAction !== newAction) {
      newAction.reset().play()
      newAction.crossFadeFrom(this.currentAction, 0.8, true)
    } else {
      newAction.reset().play()
    }

    this.currentAction = newAction
    this.vrmaTimer = Math.max(clip.duration, 4)
  }

  _pickNextPose() {
    const candidates = POSE_POOL.filter((p) => p !== this.currentPoseName)
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  _updatePoseScheduler(delta) {
    if (this.reaction) return

    this.poseTimer -= delta
    if (this.poseTimer <= 0) {
      this.currentPoseName = this.targetPoseName
      this.targetPoseName  = this._pickNextPose()
      this.poseBlendAlpha  = 0
      this.poseTimer       = this._nextPoseInterval()
    }
    if (this.poseBlendAlpha < 1) {
      this.poseBlendAlpha = Math.min(1, this.poseBlendAlpha + this.poseBlendSpeed * delta)
    }
  }

  _getBlendedOffset(boneName) {
    const from = POSES[this.currentPoseName]?.[boneName] ?? { x: 0, y: 0, z: 0 }
    const to   = POSES[this.targetPoseName]?.[boneName]  ?? { x: 0, y: 0, z: 0 }
    const a = this.poseBlendAlpha
    return { x: lerp(from.x, to.x, a), y: lerp(from.y, to.y, a), z: lerp(from.z, to.z, a) }
  }

  _updateBlink(delta) {
    if (this.blinkCooldown > 0) {
      this.blinkCooldown -= delta
      this.blinkWeight = 0
      return
    }
    this.blinkElapsed += delta
    const duration = 0.15
    const phase = THREE.MathUtils.clamp(this.blinkElapsed / duration, 0, 1)
    if (phase < 0.45) {
      this.blinkWeight = THREE.MathUtils.smootherstep(phase / 0.45, 0, 1)
    } else {
      this.blinkWeight = 1 - THREE.MathUtils.smootherstep((phase - 0.45) / 0.55, 0, 1)
    }
    if (this.blinkElapsed >= duration) {
      this.blinkElapsed = 0
      this.blinkWeight = 0
      this.blinkCooldown =
        Math.random() < 0.16 ? 0.1 : this._nextBlinkCooldown()
    }
  }

  _getReactionEnvelope(delta) {
    if (!this.reaction) return { envelope: 0, wave: 0 }
    this.reaction.elapsed += delta
    const progress = THREE.MathUtils.clamp(
      this.reaction.elapsed / this.reaction.duration, 0, 1,
    )
    const envelope = Math.sin(progress * Math.PI)
    const wave = Math.sin(progress * Math.PI * 5)
    if (progress >= 1) this.reaction = null
    return { envelope, wave }
  }

  _applyBoneOffset(boneName, rx = 0, ry = 0, rz = 0) {
    const bone = this.bones.get(boneName)
    const baseQ = this.baseQuaternions.get(boneName)
    if (!bone || !baseQ) return
    this.euler.set(rx, ry, rz, "XYZ")
    this.offsetQuaternion.setFromEuler(this.euler)
    bone.quaternion.copy(baseQ).multiply(this.offsetQuaternion)
  }

  _applyProceduralPose(delta) {
    const breath    = Math.sin(this.time * 1.8) * 0.5 + 0.5
    const idleYaw   = Math.sin(this.time * 0.65) * 0.045
    const idlePitch = Math.cos(this.time * 0.42) * 0.02
    const hoverTurn = this.hoverWeight * 0.11
    const hoverLift = this.hoverWeight * 0.012
    const { envelope, wave } = this._getReactionEnvelope(delta)

    const sp = this._getBlendedOffset(VRMHumanBoneName.Spine)
    const ch = this._getBlendedOffset(VRMHumanBoneName.Chest)
    const nk = this._getBlendedOffset(VRMHumanBoneName.Neck)
    const hd = this._getBlendedOffset(VRMHumanBoneName.Head)
    const rs = this._getBlendedOffset(VRMHumanBoneName.RightShoulder)
    const ru = this._getBlendedOffset(VRMHumanBoneName.RightUpperArm)
    const rl = this._getBlendedOffset(VRMHumanBoneName.RightLowerArm)
    const lu = this._getBlendedOffset(VRMHumanBoneName.LeftUpperArm)
    const ll = this._getBlendedOffset(VRMHumanBoneName.LeftLowerArm)

    this.vrm.scene.position.set(
      this.baseScenePosition.x,
      this.baseScenePosition.y + breath * 0.012 + envelope * 0.01 + hoverLift,
      this.baseScenePosition.z,
    )

    this._applyBoneOffset(VRMHumanBoneName.Spine,
      sp.x + (-0.012 + breath * 0.018) + envelope * 0.025, sp.y, sp.z)
    this._applyBoneOffset(VRMHumanBoneName.Chest,
      ch.x + (breath * 0.026 - envelope * 0.028), ch.y + envelope * 0.04, ch.z)
    this._applyBoneOffset(VRMHumanBoneName.Neck,
      nk.x + (idlePitch - hoverLift), nk.y + (idleYaw * 0.55 + hoverTurn * 0.45), nk.z)
    this._applyBoneOffset(VRMHumanBoneName.Head,
      hd.x + (idlePitch * 0.75 - hoverLift * 0.5), hd.y + (idleYaw + hoverTurn), hd.z)

    if (envelope > 0.01) {
      // Reaction overrides arm pose
      this._applyBoneOffset(VRMHumanBoneName.RightShoulder,
        envelope * 0.08, envelope * 0.08, -envelope * 0.22)
      this._applyBoneOffset(VRMHumanBoneName.RightUpperArm,
        envelope * 0.48, 0, -envelope * 1.0 + wave * 0.16 * envelope)
      this._applyBoneOffset(VRMHumanBoneName.RightLowerArm,
        envelope * 0.12, 0, -envelope * 0.34 - wave * 0.14 * envelope)
      this._applyBoneOffset(VRMHumanBoneName.LeftUpperArm,
        lu.x + envelope * 0.06, lu.y, lu.z + envelope * 0.08)
      this._applyBoneOffset(VRMHumanBoneName.LeftLowerArm, ll.x, ll.y, ll.z)
    } else {
      // Blended pose drives arms
      this._applyBoneOffset(VRMHumanBoneName.RightShoulder, rs.x, rs.y, rs.z)
      this._applyBoneOffset(VRMHumanBoneName.RightUpperArm,  ru.x, ru.y, ru.z)
      this._applyBoneOffset(VRMHumanBoneName.RightLowerArm,  rl.x, rl.y, rl.z)
      this._applyBoneOffset(VRMHumanBoneName.LeftUpperArm,   lu.x, lu.y, lu.z)
      this._applyBoneOffset(VRMHumanBoneName.LeftLowerArm,   ll.x, ll.y, ll.z)
    }
  }

  _updateExpressions() {
    if (!this.vrm?.expressionManager) return
    // smileWeight — reaction envelope drives the happy expression
    const reactionProgress = this.reaction
      ? THREE.MathUtils.clamp(this.reaction.elapsed / this.reaction.duration, 0, 1)
      : 0
    const smileWeight = lerp(this.hoverWeight * 0.08, 0.34, Math.sin(reactionProgress * Math.PI))

    this.vrm.expressionManager.setValue(VRMExpressionPresetName.Blink,   this.blinkWeight)
    this.vrm.expressionManager.setValue(VRMExpressionPresetName.Happy,   THREE.MathUtils.clamp(smileWeight, 0, 0.45))
    this.vrm.expressionManager.setValue(VRMExpressionPresetName.Relaxed, THREE.MathUtils.clamp(0.02 + this.hoverWeight * 0.04, 0, 0.08))
  }
}

export default AnimationController