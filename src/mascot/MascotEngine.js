import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { VRMAnimationLoaderPlugin } from "@pixiv/three-vrm-animation";
import AnimationController from "./AnimationController";
import AssetCacheManager from "./AssetCacheManager";

export class MascotEngine {
  constructor(options) {
    this.canvas = options.canvas;
    this.modelUrl = options.modelUrl;
    this.isMobile = options.isMobile ?? false;
    this.sequenceUrls = options.sequenceUrls || [];

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.loader = null;
    this.vrm = null;
    this.shadowDisc = null;
    this.lookTarget = new THREE.Object3D();
    this.animationController = new AnimationController();
    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2();
    this.interactiveObjects = [];
    this.lastTime = null;
    this.focusPoint = new THREE.Vector3(0, 1.05, 0);
    this.restLookTarget = new THREE.Vector3(0, 1.2, 2.2);
    this.currentLookTarget = new THREE.Vector3(0, 1.2, 2.2);
    this.targetLookTarget = new THREE.Vector3(0, 1.2, 2.2);
    this.unprojectedPointer = new THREE.Vector3();
    this.lookDirection = new THREE.Vector3();
    this.boundingBox = new THREE.Box3();
    this.boundingSize = new THREE.Vector3();
    this.boundingCenter = new THREE.Vector3();
    this.frameId = null;
    this.disposed = false;
    this.paused = true;
    this.hasPointer = false;
  }

  setupScene() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(30, 1, 0.01, 30);
    this.camera.position.set(0.08, 1.18, 2.8);
    this.camera.lookAt(this.focusPoint);

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.65);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    const fillLight = new THREE.DirectionalLight(0xcfe8ff, 0.65);

    keyLight.position.set(0.8, 1.9, 1.6);
    fillLight.position.set(-1.1, 0.9, 0.65);

    this.scene.add(
      ambientLight,
      keyLight,
      fillLight,
      this.lookTarget,
    );
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: !this.isMobile,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.isMobile ? 1.25 : 1.8),
    );
  }

  async init() {
    this.setupRenderer();
    this.setupScene();
    await this.loadModel(this.modelUrl);

    const width = this.canvas.clientWidth || 640;
    const height = this.canvas.clientHeight || 640;
    this.resize(width, height);
    this.setPaused(false);
  }

  async loadModel(url) {
    this.loader = new GLTFLoader();
    this.loader.crossOrigin = "anonymous";
    this.loader.register(
      (parser) =>
        new VRMLoaderPlugin(parser, {
          autoUpdateHumanBones: true,
        }),
    );
    this.loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

    // Get local blob URL via cache manager if it's a remote URL
    let localUrl = url;
    if (url && url.startsWith("http")) {
      // We pass generic name since the manager can extract info from URL
      localUrl = await AssetCacheManager.getOrDownload(url, "Character", "character");
    }

    const gltf = await new Promise((resolve, reject) => {
      this.loader.load(localUrl, resolve, undefined, reject);
    });

    if (this.disposed) {
      VRMUtils.deepDispose(gltf.scene);
      return;
    }

    // FIX 1: null-check BEFORE touching vrm at all
    const vrm = gltf.userData.vrm;
    if (!vrm) {
      throw new Error(
        "The file loaded successfully, but no VRM data was found.",
      );
    }

    // ── Remove and dispose the previous model before mounting the new one ──
    // Without this, the old scene stays in Three.js and both models render
    // simultaneously until a full page reload.
    if (this.vrm) {
      this.animationController.dispose();
      this.scene.remove(this.vrm.scene);
      VRMUtils.deepDispose(this.vrm.scene);
      this.interactiveObjects = [];
      this.vrm = null;
    }

    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.combineSkeletons(gltf.scene);

    // FIX 2: rotateVRM0 called exactly once, only for VRM 0.x
    // metaVersion "0" = VRM0, undefined/absent on VRM1 models
    const isVRM0 = vrm.meta?.metaVersion === "0";
    if (isVRM0) {
      VRMUtils.rotateVRM0(vrm);
    }

    // FIX 3: add to scene BEFORE traversing skinned meshes so materials
    // are in a valid compiled state when AnimationController.attach() runs
    this.scene.add(vrm.scene);

    vrm.scene.traverse((object) => {
      if (object.isSkinnedMesh) {
        object.frustumCulled = false;
      }
      if (object.isMesh || object.isSkinnedMesh) {
        this.interactiveObjects.push(object);
      }
    });

    this.fitModel(vrm);

    if (vrm.lookAt) {
      vrm.lookAt.target = this.lookTarget;
    }

    this.vrm = vrm;
    this.animationController.attach(vrm);

    // Load Sequence Animations if available
    if (this.sequenceUrls && this.sequenceUrls.length > 0) {
      this.loadSequence(this.sequenceUrls);
    }
  }

  async loadSequence(urls) {
    try {
      const vrmAnimations = [];
      for (const url of urls) {
        if (!url) continue;
        let localUrl = url;
        if (url.startsWith("http")) {
          localUrl = await AssetCacheManager.getOrDownload(url, "Animation", "animation");
        }
        const animGltf = await new Promise((resolve, reject) => {
          this.loader.load(localUrl, resolve, undefined, reject);
        });
        if (animGltf.userData.vrmAnimations && animGltf.userData.vrmAnimations.length > 0) {
          vrmAnimations.push(animGltf.userData.vrmAnimations[0]);
        }
      }
      if (vrmAnimations.length > 0) {
        this.animationController.loadVRMAs(vrmAnimations);
      } else {
        // Fallback to procedural if sequence is empty or fails
        this.animationController._disposeMixer();
      }
    } catch (err) {
      console.error("Failed to load animation sequence:", err);
    }
  }

  async playAnimationUrl(url) {
    if (!url) return;
    try {
      let localUrl = url;
      if (url.startsWith("http")) {
        localUrl = await AssetCacheManager.getOrDownload(url, "Animation", "animation");
      }
      const animGltf = await new Promise((resolve, reject) => {
        this.loader.load(localUrl, resolve, undefined, reject);
      });
      if (animGltf.userData.vrmAnimations && animGltf.userData.vrmAnimations.length > 0) {
        const vrma = animGltf.userData.vrmAnimations[0];
        // Stop current cycle and play this one immediately
        this.animationController.playOverrideAnimation(vrma);
      }
    } catch (err) {
      console.error("Failed to play custom VRMA:", err);
    }
  }

  fitModel(vrm) {
    // 1. Measure the base model (unscaled, centered)
    vrm.scene.scale.setScalar(1.0);
    vrm.scene.position.set(0, 0, 0);

    this.boundingBox.setFromObject(vrm.scene);
    this.boundingBox.getSize(this.boundingSize);
    this.boundingBox.getCenter(this.boundingCenter);

    const rawHeight = this.boundingSize.y;
    this.baseScaleFactor = rawHeight > 0 ? 1.62 / rawHeight : 1.0;

    // 2. Position so feet are at y=0 and centered horizontally
    vrm.scene.position.x = -this.boundingCenter.x;
    vrm.scene.position.z = -this.boundingCenter.z;
    vrm.scene.position.y = -this.boundingBox.min.y;

    // 3. Apply initial scale and camera positioning
    this.updateMascotScale();

    if (vrm.lookAt) {
      vrm.lookAt.target = this.lookTarget;
    }

    this.vrm = vrm;
    this.animationController.attach(vrm);
  }

  updateMascotScale() {
    if (!this.vrm || !this.camera) return;
    const mult = this.scaleMultiplier || 1.0;

    // 1. Update model scale in 3D space
    this.vrm.scene.scale.setScalar(this.baseScaleFactor * mult);

    // 2. Update camera to fit the new scaled height
    // targetHeight (1.62) is the height we want to frame perfectly.
    // By scaling it with mult, we ensure the framing percentage stays same,
    // while the actual size on screen grows because the canvas grows.
    const targetHeight = 1.62 * mult;
    const fitDistance = Math.max(
      3.0 * mult,
      (targetHeight /
        (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)))) *
        1.4,
    );

    const focusY = targetHeight * 0.5;
    this.focusPoint.set(0, focusY, 0);

    // Maintain a slight offset for a better angle
    this.camera.position.set(0.08, focusY + 0.05, fitDistance + 0.2);
    this.camera.lookAt(this.focusPoint);

    // Update rest targets for look-at logic
    this.restLookTarget.copy(this.camera.position).setY(focusY + 0.1);
    this.currentLookTarget.copy(this.restLookTarget);
    this.targetLookTarget.copy(this.restLookTarget);
    this.lookTarget.position.copy(this.restLookTarget);
  }

  setScaleMultiplier(mult) {
    this.scaleMultiplier = mult;
    this.updateMascotScale();
  }

  resize(width, height) {
    if (!this.renderer || !this.camera || width < 2 || height < 2) return;

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.isMobile ? 1.25 : 1.8),
    );
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setViewportPointer(
    clientX,
    clientY,
    viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight,
  ) {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;

    this.pointerNdc.set(
      (clientX / viewportWidth) * 2 - 1,
      -(clientY / viewportHeight) * 2 + 1,
    );
    this.hasPointer = true;
  }

  clearPointer() {
    this.hasPointer = false;
  }

  updateLookTarget(delta) {
    if (!this.camera || !this.vrm?.lookAt) return;

    if (this.hasPointer) {
      this.unprojectedPointer
        .set(this.pointerNdc.x, this.pointerNdc.y * 0.72, 0.36)
        .unproject(this.camera);
      this.lookDirection
        .copy(this.unprojectedPointer)
        .sub(this.camera.position)
        .normalize();
      this.targetLookTarget
        .copy(this.camera.position)
        .add(this.lookDirection.multiplyScalar(2.6));
      this.targetLookTarget.y = THREE.MathUtils.clamp(
        this.targetLookTarget.y,
        this.focusPoint.y - 0.35,
        this.focusPoint.y + 0.55,
      );
    } else {
      this.targetLookTarget.copy(this.restLookTarget);
    }

    const alpha = 1 - Math.exp(-7 * delta);
    this.currentLookTarget.lerp(this.targetLookTarget, alpha);
    this.lookTarget.position.copy(this.currentLookTarget);
  }

  hitTest(clientX, clientY) {
    if (!this.camera || !this.interactiveObjects.length) return false;

    const rect = this.canvas.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return false;
    }

    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );

    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactiveObjects, true);
    return hits.length > 0;
  }

  setHover(isHovered) {
    this.animationController.setHover(isHovered);
  }

  triggerReaction(type = "wave") {
    this.animationController.triggerReaction(type);
  }

  startLoop() {
    if (this.frameId || this.paused || this.disposed) return;

    const render = () => {
      if (this.paused || this.disposed) {
        this.frameId = null;
        return;
      }

      const now = performance.now();
      const delta = Math.min((now - (this.lastTime ?? now)) / 1000, 1 / 30);
      this.lastTime = now;

      if (this.vrm) {
        this.animationController.update(delta);
        this.updateLookTarget(delta);
        this.vrm.update(delta);
      }

      this.renderer.render(this.scene, this.camera);
      this.frameId = window.requestAnimationFrame(render);
    };

    this.frameId = window.requestAnimationFrame(render);
  }

  setPaused(paused) {
    this.paused = Boolean(paused);

    if (this.paused) {
      if (this.frameId) {
        window.cancelAnimationFrame(this.frameId);
        this.frameId = null;
      }
      return;
    }

    this.startLoop();
  }

  dispose() {
    this.disposed = true;
    this.setPaused(true);
    this.animationController.dispose();

    if (this.vrm) {
      this.scene?.remove(this.vrm.scene);
      VRMUtils.deepDispose(this.vrm.scene);
      this.vrm = null;
    }

    this.interactiveObjects = [];

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.renderLists.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }

    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }

    this.camera = null;
  }
}

export default MascotEngine;
