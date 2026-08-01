import * as THREE from "three";
import { IDLE_ACCENT_HEX } from "./palette";

// Two wireframe shells, thin/low-opacity strokes, slow independent
// rotation — per DEMO_SPEC.md §5, not tied to detection state.
export interface WireframeSpheres {
  group: THREE.Group;
  update(deltaSeconds: number): void;
}

function makeShell(radius: number, opacity: number): THREE.LineSegments {
  const geometry = new THREE.WireframeGeometry(
    new THREE.SphereGeometry(radius, 24, 16),
  );
  const material = new THREE.LineBasicMaterial({
    color: IDLE_ACCENT_HEX,
    transparent: true,
    opacity,
  });
  return new THREE.LineSegments(geometry, material);
}

export function createWireframeSpheres(): WireframeSpheres {
  const inner = makeShell(2.0, 0.25);
  const outer = makeShell(2.6, 0.15);

  const group = new THREE.Group();
  group.add(inner, outer);

  function update(deltaSeconds: number): void {
    inner.rotation.y += deltaSeconds * 0.05;
    inner.rotation.x += deltaSeconds * 0.02;
    outer.rotation.y -= deltaSeconds * 0.03;
    outer.rotation.x += deltaSeconds * 0.015;
  }

  return { group, update };
}
