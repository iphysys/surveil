import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";
import { BACKGROUND_HEX } from "./palette";

// Bloom params per DEMO_SPEC.md §5 (Sprint 7 amendment — raised so
// wireframes visibly glow).
const BLOOM_STRENGTH = 1.4;
const BLOOM_RADIUS = 0.6;
const BLOOM_THRESHOLD = 0.1;

// Vignette per DEMO_SPEC.md §5b: darken corners by ~25%. VignetteShader's
// `offset` controls the spatial falloff, `darkness` how black the target
// is — these values solve to ~25% corner darkening for a bright corner
// pixel (texel≈1); against the already near-black background the visible
// effect is naturally smaller, which is expected.
const VIGNETTE_OFFSET = 0.85;
const VIGNETTE_DARKNESS = 0.7;

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  render(): void;
}

export function createScene(container: HTMLElement): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND_HEX);

  const width = container.clientWidth;
  const height = container.clientHeight;

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(width, height),
      BLOOM_STRENGTH,
      BLOOM_RADIUS,
      BLOOM_THRESHOLD,
    ),
  );
  composer.addPass(new OutputPass());

  const vignettePass = new ShaderPass(VignetteShader);
  vignettePass.uniforms.offset.value = VIGNETTE_OFFSET;
  vignettePass.uniforms.darkness.value = VIGNETTE_DARKNESS;
  composer.addPass(vignettePass);

  new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const w = entry.contentRect.width;
    const h = entry.contentRect.height;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }).observe(container);

  return {
    scene,
    camera,
    renderer,
    render() {
      composer.render();
    },
  };
}
