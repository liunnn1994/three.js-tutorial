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

// Object
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1, 5, 5, 5),
  new THREE.MeshBasicMaterial({ color: 0xff0000 }),
);
scene.add(mesh);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Debug
 */
const gui = new GUI();
const params = {
  cameraType: "perspective",
  fov: 75,
  meshColor: "#ff0000",
  cursorSensitivity: 1,
};

gui
  .add(params, "cameraType", { perspective: "perspective", orthographic: "orthographic" })
  .name("Camera Type")
  .onChange((value) => {
    if (value === "orthographic") {
      const aspectRatio = sizes.width / sizes.height;
      camera.left = -1 * aspectRatio;
      camera.right = 1 * aspectRatio;
      camera.top = 1;
      camera.bottom = -1;
    } else {
      camera.left = undefined;
      camera.right = undefined;
      camera.top = undefined;
      camera.bottom = undefined;
    }
    camera.updateProjectionMatrix();
  });
gui
  .add(params, "fov")
  .min(10)
  .max(120)
  .step(1)
  .name("FOV")
  .onChange(() => {
    camera.fov = params.fov;
    camera.updateProjectionMatrix();
  });
gui
  .addColor(params, "meshColor")
  .name("Mesh Color")
  .onChange(() => {
    mesh.material.color.set(params.meshColor);
  });
gui.add(params, "cursorSensitivity").min(0.1).max(3).step(0.1).name("Cursor Sensitivity");

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Cursor
 */
const cursor = {
  x: 0,
  y: 0,
};

window.addEventListener("mousemove", (event) => {
  cursor.x = (event.clientX / sizes.width - 0.5) * params.cursorSensitivity;
  cursor.y = -(event.clientY / sizes.height - 0.5) * params.cursorSensitivity;
});

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  controls.update();

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
