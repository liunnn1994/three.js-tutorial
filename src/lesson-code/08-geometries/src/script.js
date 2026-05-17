import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Debug
 */
const gui = new GUI();
const params = {
  count: 50,
  size: 4,
  wireframe: true,
  color: "#ff0000",
};

/**
 * Object
 */
let geometry, mesh;

function createGeometry() {
  if (mesh) scene.remove(mesh);
  geometry = new THREE.BufferGeometry();
  const positionsArray = new Float32Array(params.count * 3 * 3);
  for (let i = 0; i < params.count * 3 * 3; i++) {
    positionsArray[i] = (Math.random() - 0.5) * params.size;
  }
  const positionsAttribute = new THREE.BufferAttribute(positionsArray, 3);
  geometry.setAttribute("position", positionsAttribute);
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });

createGeometry();

gui.add(params, "count").min(1).max(500).step(1).name("Triangle Count").onChange(createGeometry);
gui.add(params, "size").min(1).max(10).step(0.5).name("Spread Size").onChange(createGeometry);
gui.add(material, "wireframe").name("Wireframe");
gui
  .addColor(params, "color")
  .name("Color")
  .onChange(() => {
    material.color.set(params.color);
  });

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
