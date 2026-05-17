import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import coffeeSmokeVertexShader from "./shaders/coffeeSmoke/vertex.glsl";
import coffeeSmokeFragmentShader from "./shaders/coffeeSmoke/fragment.glsl";

/**
 * 基础
 */
// 调试
const gui = new GUI();

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

// 加载器
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

/**
 * 纹理
 */
const bakedTexture = textureLoader.load("/assets/32-coffee-smoke-shader-final/baked.jpg");
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * 材质
 */
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

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
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 8;
camera.position.y = 10;
camera.position.z = 12;
scene.add(camera);

// 控制器
const controls = new OrbitControls(camera, canvas);
controls.target.y = 3;
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
 * 模型
 */
gltfLoader.load(
  "/assets/32-coffee-smoke-shader-final/bakedModel.glb",
  (gltf) => {
    bakedTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const baked = gltf.scene.getObjectByName("baked");
    if (baked) {
      baked.material = bakedMaterial;
    }

    scene.add(gltf.scene);
  },
  undefined,
  (error) => {
    console.error("Failed to load model:", error);
  },
);

/**
 * 烟雾
 */
// 几何体
const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
smokeGeometry.translate(0, 0.5, 0);
smokeGeometry.scale(1.5, 6, 1.5);

// 柏林噪声纹理
const perlinTexture = textureLoader.load("/assets/32-coffee-smoke-shader-final/perlin.png");
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;

// 材质
const smokeMaterial = new THREE.ShaderMaterial({
  vertexShader: coffeeSmokeVertexShader,
  fragmentShader: coffeeSmokeFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uPerlinTexture: new THREE.Uniform(perlinTexture),
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
  // wireframe: true
});

// 网格
const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
smoke.position.y = 1.83;
scene.add(smoke);

/**
 * 动画循环
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // 更新烟雾
  smokeMaterial.uniforms.uTime.value = elapsedTime;

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
