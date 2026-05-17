import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * 基础
 */
// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

/**
 * 调试
 */
const gui = new GUI();
const params = {
  count: 50,
  size: 4,
  wireframe: true,
  color: "#ff0000",
};

/**
 * 物体
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

gui.add(params, "count").min(1).max(500).step(1).name("三角形数量").onChange(createGeometry);
gui.add(params, "size").min(1).max(10).step(0.5).name("分散大小").onChange(createGeometry);
gui.add(material, "wireframe").name("线框模式");
gui
  .addColor(params, "color")
  .name("颜色")
  .onChange(() => {
    material.color.set(params.color);
  });

/**
 * 尺寸
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // 更新尺寸
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // 更新相机
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // 更新渲染器
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * 相机
 */
// 基础相机
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 3;
scene.add(camera);

// 控制器
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * 渲染器
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * 动画循环
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
