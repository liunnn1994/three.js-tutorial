import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// /**
//  * Spector JS
//  */
// const SPECTOR = require('spectorjs')
// const spector = new SPECTOR.Spector()
// spector.displayUI()

/**
 * 基础
 */
// 调试
const gui = new GUI({
  width: 400,
});

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

/**
 * 加载器
 */
// 纹理加载器
const textureLoader = new THREE.TextureLoader();

// Draco 加载器
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF 加载器
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * 纹理
 */
const bakedTexture = textureLoader.load(
  "/assets/51-importing-and-optimizing-the-scene-final/baked.jpg",
);
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * 材质
 */
// 烘焙材质
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

// 传送门光源材质
const portalLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

// 灯柱光源材质
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });

/**
 * 模型
 */
gltfLoader.load("/assets/51-importing-and-optimizing-the-scene-final/portal.glb", (gltf) => {
  const bakedMesh = gltf.scene.children.find((child) => child.name === "baked");
  const portalLightMesh = gltf.scene.children.find((child) => child.name === "portalLight");
  const poleLightAMesh = gltf.scene.children.find((child) => child.name === "poleLightA");
  const poleLightBMesh = gltf.scene.children.find((child) => child.name === "poleLightB");

  bakedMesh.material = bakedMaterial;
  portalLightMesh.material = portalLightMaterial;
  poleLightAMesh.material = poleLightMaterial;
  poleLightBMesh.material = poleLightMaterial;

  scene.add(gltf.scene);
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
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// 控制器
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * 渲染器
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * 动画循环
 */
const timer = new THREE.Timer();

const tick = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
