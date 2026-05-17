import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import gsap from "gsap";

/**
 * 基础
 */
// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

/**
 * 物体
 */
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

/**
 * 调试
 */
const gui = new GUI();
const params = {
  color: "#ff0000",
  duration: 1,
  delay: 1,
  targetX: 2,
};

gui
  .addColor(params, "color")
  .name("颜色")
  .onChange(() => {
    material.color.set(params.color);
  });
gui.add(params, "duration").min(0.1).max(5).step(0.1).name("时长");
gui.add(params, "delay").min(0).max(3).step(0.1).name("延迟");
gui.add(params, "targetX").min(-3).max(3).step(0.1).name("目标 X");
gui
  .add(
    {
      replay: () => {
        mesh.position.x = 0;
        gsap.to(mesh.position, {
          duration: params.duration,
          delay: params.delay,
          x: params.targetX,
        });
      },
    },
    "replay",
  )
  .name("重播动画");
gui
  .add(
    {
      reset: () => {
        gsap.killTweensOf(mesh.position);
        mesh.position.x = 0;
        mesh.position.y = 0;
        mesh.rotation.y = 0;
      },
    },
    "reset",
  )
  .name("重置");

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
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
gsap.to(mesh.position, { duration: params.duration, delay: params.delay, x: params.targetX });

const tick = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
