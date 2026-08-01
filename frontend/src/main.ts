import * as THREE from "three";
import "./style.css";
import { createScene } from "./scene";
import { createWireframeSpheres } from "./wireframeSpheres";
import { createGlowBlob } from "./glowBlob";
import { createRadarSweep } from "./radarSweep";
import { createPulseRings } from "./pulseRings";
import { createHud, updateHud } from "./hud";
import { pollEvents } from "./api";
import type { DetectionEvent } from "./types";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div id="scene-container"></div>
  <div id="hud-root"></div>
`;

const { scene, camera, renderer } = createScene(
  document.querySelector<HTMLDivElement>("#scene-container")!,
);

const wireframes = createWireframeSpheres();
scene.add(wireframes.group);

const radarSweep = createRadarSweep();
scene.add(radarSweep.mesh);

const pulseRings = createPulseRings();
scene.add(pulseRings.group);

const blob = createGlowBlob();
scene.add(blob.points);

createHud(document.querySelector<HTMLDivElement>("#hud-root")!);

let latestEvent: DetectionEvent | null = null;
pollEvents((event) => {
  latestEvent = event;
  updateHud(event);
});

const timer = new THREE.Timer();
function animate(): void {
  requestAnimationFrame(animate);
  timer.update();
  const delta = timer.getDelta();
  const status = latestEvent?.status ?? "idle";

  wireframes.update(delta);
  radarSweep.update(delta, status);
  pulseRings.update(delta, status);
  blob.update(delta, latestEvent);

  renderer.render(scene, camera);
}
animate();
