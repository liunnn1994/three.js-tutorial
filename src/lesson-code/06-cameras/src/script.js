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

// 物体
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1, 5, 5, 5),
  new THREE.MeshBasicMaterial({ color: 0xff0000 }),
);
scene.add(mesh);

/**
 * 尺寸
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
 * 相机
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 3;
scene.add(camera);

// 控制器
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * 调试
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
  .name("相机类型")
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
  .name("视野角度(FOV)")
  .onChange(() => {
    camera.fov = params.fov;
    camera.updateProjectionMatrix();
  });
gui
  .addColor(params, "meshColor")
  .name("网格颜色")
  .onChange(() => {
    mesh.material.color.set(params.meshColor);
  });
gui.add(params, "cursorSensitivity").min(0.1).max(3).step(0.1).name("光标灵敏度");

/**
 * 渲染器
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * 光标
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
 * 动画循环
 */
const timer = new THREE.Timer();

const tick = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  controls.update();

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
