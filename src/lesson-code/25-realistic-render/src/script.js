import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

/**
 * 加载器
 */
const gltfLoader = new GLTFLoader();
const hdrLoader = new HDRLoader();
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

      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * 环境贴图
 */
// 全局强度
global.envMapIntensity = 1;
gui
  .add(global, "envMapIntensity")
  .min(0)
  .max(10)
  .step(0.001)
  .name("环境贴图强度(envMapIntensity)")
  .onChange(updateAllMaterials);

// HDR（RGBE）等距矩形
hdrLoader.load("/assets/25-realistic-render-final/environmentMaps/0/2k.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  scene.environment = environmentMap;
});

/**
 * 平行光
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 6);
directionalLight.position.set(-4, 6.5, 2.5);
scene.add(directionalLight);

gui.add(directionalLight, "intensity").min(0).max(10).step(0.001).name("灯光强度");
gui.add(directionalLight.position, "x").min(-10).max(10).step(0.001).name("灯光位置 X");
gui.add(directionalLight.position, "y").min(-10).max(10).step(0.001).name("灯光位置 Y");
gui.add(directionalLight.position, "z").min(-10).max(10).step(0.001).name("灯光位置 Z");

// 阴影
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.027;
directionalLight.shadow.bias = -0.004;
directionalLight.shadow.mapSize.set(512, 512);

gui.add(directionalLight, "castShadow").name("投射阴影");
gui
  .add(directionalLight.shadow, "normalBias")
  .min(-0.05)
  .max(0.05)
  .step(0.001)
  .name("法线偏移(normalBias)");
gui.add(directionalLight.shadow, "bias").min(-0.05).max(0.05).step(0.001).name("偏移(bias)");

// 目标
directionalLight.target.position.set(0, 4, 0);
directionalLight.target.updateWorldMatrix();

// // Helper
// const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
// scene.add(directionalLightCameraHelper)

/**
 * 模型
 */
// 头盔
gltfLoader.load(
  "/assets/25-realistic-render-final/models/FlightHelmet/glTF/FlightHelmet.gltf",
  (gltf) => {
    gltf.scene.scale.set(10, 10, 10);
    scene.add(gltf.scene);

    updateAllMaterials();
  },
);

// // Hamburger
// gltfLoader.load(
//     '/assets/25-realistic-render-final/models/hamburger.glb',
//     (gltf) =>
//     {
//         gltf.scene.scale.set(0.4, 0.4, 0.4)
//         gltf.scene.position.set(0, 2.5, 0)
//         scene.add(gltf.scene)

//         updateAllMaterials()
//     }
// )

/**
 * 地板
 */
const floorColorTexture = textureLoader.load(
  "/assets/25-realistic-render-final/textures/wood_cabinet_worn_long/wood_cabinet_worn_long_diff_1k.jpg",
);
const floorNormalTexture = textureLoader.load(
  "/assets/25-realistic-render-final/textures/wood_cabinet_worn_long/wood_cabinet_worn_long_nor_gl_1k.png",
);
const floorAORoughnessMetalnessTexture = textureLoader.load(
  "/assets/25-realistic-render-final/textures/wood_cabinet_worn_long/wood_cabinet_worn_long_arm_1k.jpg",
);

floorColorTexture.colorSpace = THREE.SRGBColorSpace;

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 8),
  new THREE.MeshStandardMaterial({
    map: floorColorTexture,
    normalMap: floorNormalTexture,
    aoMap: floorAORoughnessMetalnessTexture,
    roughnessMap: floorAORoughnessMetalnessTexture,
    metalnessMap: floorAORoughnessMetalnessTexture,
  }),
);
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * 墙壁
 */
const wallColorTexture = textureLoader.load(
  "/assets/25-realistic-render-final/textures/castle_brick_broken_06/castle_brick_broken_06_diff_1k.jpg",
);
const wallNormalTexture = textureLoader.load(
  "/assets/25-realistic-render-final/textures/castle_brick_broken_06/castle_brick_broken_06_nor_gl_1k.png",
);
const wallAORoughnessMetalnessTexture = textureLoader.load(
  "/assets/25-realistic-render-final/textures/castle_brick_broken_06/castle_brick_broken_06_arm_1k.jpg",
);

wallColorTexture.colorSpace = THREE.SRGBColorSpace;

const wall = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 8),
  new THREE.MeshStandardMaterial({
    map: wallColorTexture,
    normalMap: wallNormalTexture,
    aoMap: wallAORoughnessMetalnessTexture,
    roughnessMap: wallAORoughnessMetalnessTexture,
    metalnessMap: wallAORoughnessMetalnessTexture,
  }),
);
wall.position.y = 4;
wall.position.z = -4;
scene.add(wall);

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
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 色调映射
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 3;

gui
  .add(renderer, "toneMapping", {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
  })
  .name("色调映射(toneMapping)");
gui.add(renderer, "toneMappingExposure").min(0).max(10).step(0.001).name("曝光度");

// 阴影
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

/**
 * 动画循环
 */
const tick = () => {
  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
