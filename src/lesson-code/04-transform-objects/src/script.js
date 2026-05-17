import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

/**
 * 坐标轴辅助器
 */
const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

/**
 * 对象
 */
const group = new THREE.Group();
scene.add(group);

const cube1 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xff0000 }),
);
cube1.position.x = -1.5;
group.add(cube1);

const cube2 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
);
cube2.position.x = 0;
group.add(cube2);

const cube3 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0x0000ff }),
);
cube3.position.x = 1.5;
group.add(cube3);

/**
 * 调试
 */
const gui = new GUI();

gui.add(group.position, "y").min(-3).max(3).step(0.01).name("位置 Y");
gui.add(group.rotation, "x").min(-Math.PI).max(Math.PI).step(0.01).name("旋转 X");
gui.add(group.rotation, "y").min(-Math.PI).max(Math.PI).step(0.01).name("旋转 Y");
gui.add(group.rotation, "z").min(-Math.PI).max(Math.PI).step(0.01).name("旋转 Z");
gui.add(group.scale, "x").min(0.1).max(3).step(0.01).name("缩放 X");
gui.add(group.scale, "y").min(0.1).max(3).step(0.01).name("缩放 Y");
gui.add(group.scale, "z").min(0.1).max(3).step(0.01).name("缩放 Z");

const cube1Folder = gui.addFolder("立方体 1");
cube1Folder.add(cube1.position, "x").min(-3).max(3).step(0.01).name("位置 X");
cube1Folder.addColor(cube1.material, "color").name("颜色");

const cube2Folder = gui.addFolder("立方体 2");
cube2Folder.add(cube2.position, "x").min(-3).max(3).step(0.01).name("位置 X");
cube2Folder.addColor(cube2.material, "color").name("颜色");

const cube3Folder = gui.addFolder("立方体 3");
cube3Folder.add(cube3.position, "x").min(-3).max(3).step(0.01).name("位置 X");
cube3Folder.addColor(cube3.material, "color").name("颜色");

gui.add(axesHelper, "visible").name("坐标轴辅助器");

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
camera.position.z = 5;
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
const tick = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
