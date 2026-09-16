import * as THREE from "./vendor/three.module.js";

const BASE_OPACITY = 0.1;
const ACTIVITY_GAIN = 0.85;

export class NeuralViewport {
  constructor(canvas, statusEl = null) {
    this.canvas = canvas;
    this.statusEl = statusEl;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.materials = null;
    this.meshes = null;
    this.available = false;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      this.renderer.setSize(canvas.width, canvas.height, false);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        38,
        canvas.width / canvas.height,
        0.1,
        1000
      );
      this.camera.position.set(0, 0, 8.5);

      this.materials = {
        optic: this.makeMaterial(0x00f0ff),
        central: this.makeMaterial(0xff00aa),
        descending: this.makeMaterial(0x00ff66),
      };

      this.meshes = this.makeScaffoldMeshes();
      for (const mesh of Object.values(this.meshes)) this.scene.add(mesh);

      this.available = true;
      this.setStatus("SCAFFOLD · THREE.JS");
      this.render();
    } catch (error) {
      console.warn("NeuralViewport unavailable:", error);
      this.setStatus("NEURAL VIEW UNAVAILABLE");
    }
  }

  makeMaterial(color) {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: BASE_OPACITY,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      wireframe: true,
    });
  }

  makeScaffoldMeshes() {
    // Deliberately schematic placeholders used only to validate the isolated
    // Three.js rendering path. They are replaced by MaleCNS-derived meshes
    // before Phase 2A is marked scientifically complete.
    const opticGeometry = new THREE.SphereGeometry(1.25, 16, 10);
    const centralGeometry = new THREE.SphereGeometry(1.55, 18, 12);
    const descendingGeometry = new THREE.CapsuleGeometry(0.32, 2.7, 8, 12);

    const opticLeft = new THREE.Mesh(opticGeometry, this.materials.optic);
    opticLeft.scale.set(0.55, 1.0, 0.8);
    opticLeft.position.x = -2.05;

    const opticRight = opticLeft.clone();
    opticRight.position.x = 2.05;

    const opticGroup = new THREE.Group();
    opticGroup.add(opticLeft, opticRight);

    const central = new THREE.Mesh(centralGeometry, this.materials.central);
    central.scale.set(1.25, 0.82, 0.72);

    const descending = new THREE.Mesh(
      descendingGeometry,
      this.materials.descending
    );
    descending.rotation.z = Math.PI;
    descending.position.y = -2.3;

    return { optic: opticGroup, central, descending };
  }

  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  update(macroActivity) {
    if (!this.available || !macroActivity) return;
    for (const key of ["optic", "central", "descending"]) {
      const value = Number.isFinite(macroActivity[key])
        ? Math.max(0, Math.min(1, macroActivity[key]))
        : 0;
      this.materials[key].opacity = BASE_OPACITY + value * ACTIVITY_GAIN;
    }
    this.setStatus("LIVE MACRO ACTIVITY");
  }

  render(macroActivity = null) {
    if (!this.available) return;
    if (macroActivity) this.update(macroActivity);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (!this.available) return;
    for (const mesh of Object.values(this.meshes || {})) {
      mesh.traverse?.((node) => node.geometry?.dispose?.());
    }
    for (const material of Object.values(this.materials || {}))
      material.dispose();
    this.renderer.dispose();
    this.available = false;
  }
}
