import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { GroundedSkybox as GroundProjectedSkybox } from "three/examples/jsm/objects/GroundedSkybox.js";

/**
 * 加载器
 */
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
const hdrLoader = new HDRLoader();
const exrLoader = new EXRLoader();
const textureLoader = new THREE.TextureLoader();

/**
 * 基础
 */
// 调试
const gui = new GUI();
const global = {};

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

/**
 * 更新所有材质
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (child.isMesh && child.material.isMeshStandardMaterial) {
      child.material.envMapIntensity = global.envMapIntensity;
    }
  });
};

/**
 * 环境贴图
 */
scene.backgroundBlurriness = 0;
scene.backgroundIntensity = 1;

gui.add(scene, "backgroundBlurriness").min(0).max(1).step(0.001).name("背景模糊度");
gui.add(scene, "backgroundIntensity").min(0).max(10).step(0.001).name("背景强度");

// 全局强度
global.envMapIntensity = 1;
gui
  .add(global, "envMapIntensity")
  .min(0)
  .max(10)
  .step(0.001)
  .name("环境贴图强度(envMapIntensity)")
  .onChange(updateAllMaterials);

// // LDR cube texture
// const environmentMap = cubeTextureLoader.load([
//     '/assets/24-environment-map-final/environmentMaps/2/px.png',
//     '/assets/24-environment-map-final/environmentMaps/2/nx.png',
//     '/assets/24-environment-map-final/environmentMaps/2/py.png',
//     '/assets/24-environment-map-final/environmentMaps/2/ny.png',
//     '/assets/24-environment-map-final/environmentMaps/2/pz.png',
//     '/assets/24-environment-map-final/environmentMaps/2/nz.png'
// ])

// scene.environment = environmentMap
// scene.background = environmentMap

// // HDR（RGBE）等距矩形
// hdrLoader.load('/assets/24-environment-map-final/environmentMaps/blender-2k.hdr', (environmentMap) =>
// {
//     environmentMap.mapping = THREE.EquirectangularReflectionMapping

//     // scene.background = environmentMap
//     scene.environment = environmentMap
// })

// // HDR (EXR) equirectangular
// exrLoader.load('/assets/24-environment-map-final/environmentMaps/nvidiaCanvas-4k.exr', (environmentMap) =>
// {
//     environmentMap.mapping = THREE.EquirectangularReflectionMapping

//     scene.background = environmentMap
//     scene.environment = environmentMap
// })

// // LDR equirectangular
// const environmentMap = textureLoader.load('/assets/24-environment-map-final/environmentMaps/blockadesLabsSkybox/anime_art_style_japan_streets_with_cherry_blossom_.jpg')
// environmentMap.mapping = THREE.EquirectangularReflectionMapping
// environmentMap.colorSpace = THREE.SRGBColorSpace
// scene.background = environmentMap
// scene.environment = environmentMap

// // Ground projected skybox
// hdrLoader.load('/assets/24-environment-map-final/environmentMaps/2/2k.hdr', (environmentMap) =>
// {
//     environmentMap.mapping = THREE.EquirectangularReflectionMapping
//     scene.environment = environmentMap

//     const skybox = new GroundProjectedSkybox(environmentMap)
//     skybox.radius = 120
//     skybox.height = 11
//     skybox.scale.setScalar(50)
//     scene.add(skybox)

//     gui.add(skybox, 'radius', 1, 200, 0.1).name('skyboxRadius')
//     gui.add(skybox, 'height', 1, 100, 0.1).name('skyboxHeight')
// })

/**
 * 实时环境贴图
 */
// 基础环境贴图
const environmentMap = textureLoader.load(
  "/assets/24-environment-map-final/environmentMaps/blockadesLabsSkybox/interior_views_cozy_wood_cabin_with_cauldron_and_p.jpg",
);
environmentMap.mapping = THREE.EquirectangularReflectionMapping;
environmentMap.colorSpace = THREE.SRGBColorSpace;

scene.background = environmentMap;

// 神圣甜甜圈
const holyDonut = new THREE.Mesh(
  new THREE.TorusGeometry(8, 0.5),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 4, 2) }),
);
holyDonut.layers.enable(1);
holyDonut.position.y = 3.5;
scene.add(holyDonut);

// 立方体渲染目标
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
  type: THREE.FloatType,
});

scene.environment = cubeRenderTarget.texture;

// 立方体相机
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
cubeCamera.layers.set(1);

/**
 * 环面纽结
 */
const torusKnot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
  new THREE.MeshStandardMaterial({ roughness: 0, metalness: 1, color: 0xaaaaaa }),
);
torusKnot.position.x = -4;
torusKnot.position.y = 4;
scene.add(torusKnot);

/**
 * 模型
 */
gltfLoader.load(
  "/assets/24-environment-map-final/models/FlightHelmet/glTF/FlightHelmet.gltf",
  (gltf) => {
    gltf.scene.scale.set(10, 10, 10);
    scene.add(gltf.scene);

    updateAllMaterials();
  },
);

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
camera.position.set(4, 5, 4);
scene.add(camera);

// 控制器
const controls = new OrbitControls(camera, canvas);
controls.target.y = 3.5;
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
const timer = new THREE.Timer();
const tick = () => {
  // 时间
  timer.update();
  const elapsedTime = timer.getElapsed();

  // 实时环境贴图
  if (holyDonut) {
    holyDonut.rotation.x = Math.sin(elapsedTime) * 2;

    cubeCamera.update(renderer, scene);
  }

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
