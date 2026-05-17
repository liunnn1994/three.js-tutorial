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
group.scale.y = 2;
group.rotation.y = 0.2;
scene.add(group);

const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

const cube1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
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
const params = {
  cube1Color: "#ff0000",
  cube2Color: "#00ff00",
  cube3Color: "#0000ff",
  groupVisible: true,
  axesVisible: true,
};

gui
  .addColor(params, "cube1Color")
  .name("立方体 1 颜色")
  .onChange(() => {
    material.color.set(params.cube1Color);
  });
gui
  .addColor(params, "cube2Color")
  .name("立方体 2 颜色")
  .onChange(() => {
    cube2.material.color.set(params.cube2Color);
  });
gui
  .addColor(params, "cube3Color")
  .name("立方体 3 颜色")
  .onChange(() => {
    cube3.material.color.set(params.cube3Color);
  });
gui
  .add(params, "groupVisible")
  .name("分组可见")
  .onChange(() => {
    group.visible = params.groupVisible;
  });
gui
  .add(params, "axesVisible")
  .name("坐标轴辅助器")
  .onChange(() => {
    axesHelper.visible = params.axesVisible;
  });

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
const tick = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
