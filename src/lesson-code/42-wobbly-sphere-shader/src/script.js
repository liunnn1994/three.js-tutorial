import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import GUI from "lil-gui";
import wobbleVertexShader from "./shaders/wobble/vertex.glsl";
import wobbleFragmentShader from "./shaders/wobble/fragment.glsl";

/**
 * 基础
 */
// 调试
const gui = new GUI({ width: 325 });
const debugObject = {};

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

// 加载器
const hdrLoader = new HDRLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/assets/42-wobbly-sphere-shader-final/draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * 环境贴图
 */
hdrLoader.load("/assets/42-wobbly-sphere-shader-final/urban_alley_01_1k.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  scene.environment = environmentMap;
});

/**
 * 摇晃
 */
// 材质
debugObject.colorA = "#0000ff";
debugObject.colorB = "#ff0000";

const uniforms = {
  uTime: new THREE.Uniform(0),
  uPositionFrequency: new THREE.Uniform(0.5),
  uTimeFrequency: new THREE.Uniform(0.4),
  uStrength: new THREE.Uniform(0.3),
  uWarpPositionFrequency: new THREE.Uniform(0.38),
  uWarpTimeFrequency: new THREE.Uniform(0.12),
  uWarpStrength: new THREE.Uniform(1.7),
  uColorA: new THREE.Uniform(new THREE.Color(debugObject.colorA)),
  uColorB: new THREE.Uniform(new THREE.Color(debugObject.colorB)),
};

const material = new CustomShaderMaterial({
  // CSM（级联阴影贴图）
  baseMaterial: THREE.MeshPhysicalMaterial,
  vertexShader: wobbleVertexShader,
  fragmentShader: wobbleFragmentShader,
  uniforms: uniforms,

  // MeshPhysicalMaterial 材质
  metalness: 0,
  roughness: 0.5,
  color: "#ffffff",
  transmission: 0,
  ior: 1.5,
  thickness: 1.5,
  transparent: true,
  wireframe: false,
});

const depthMaterial = new CustomShaderMaterial({
  // CSM（级联阴影贴图）
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader: wobbleVertexShader,
  uniforms: uniforms,

  // MeshDepthMaterial 材质
  depthPacking: THREE.RGBADepthPacking,
});

// 调试参数
gui.add(uniforms.uPositionFrequency, "value", 0, 2, 0.001).name("位置频率");
gui.add(uniforms.uTimeFrequency, "value", 0, 2, 0.001).name("时间频率");
gui.add(uniforms.uStrength, "value", 0, 2, 0.001).name("强度");
gui.add(uniforms.uWarpPositionFrequency, "value", 0, 2, 0.001).name("扭曲位置频率");
gui.add(uniforms.uWarpTimeFrequency, "value", 0, 2, 0.001).name("扭曲时间频率");
gui.add(uniforms.uWarpStrength, "value", 0, 2, 0.001).name("扭曲强度");
gui
  .addColor(debugObject, "colorA")
  .name("颜色 A")
  .onChange(() => uniforms.uColorA.value.set(debugObject.colorA));
gui
  .addColor(debugObject, "colorB")
  .name("颜色 B")
  .onChange(() => uniforms.uColorB.value.set(debugObject.colorB));
gui.add(material, "metalness", 0, 1, 0.001).name("金属度(metalness)");
gui.add(material, "roughness", 0, 1, 0.001).name("粗糙度(roughness)");
gui.add(material, "transmission", 0, 1, 0.001).name("透射(transmission)");
gui.add(material, "ior", 0, 10, 0.001).name("折射率(IOR)");
gui.add(material, "thickness", 0, 10, 0.001).name("厚度(thickness)");

// 几何体
let geometry = new THREE.IcosahedronGeometry(2.5, 50);
geometry = mergeVertices(geometry);
geometry.computeTangents();

// 网格
const wobble = new THREE.Mesh(geometry, material);
wobble.customDepthMaterial = depthMaterial;
wobble.receiveShadow = true;
wobble.castShadow = true;
scene.add(wobble);

// gltfLoader.load('/assets/42-wobbly-sphere-shader-final/suzanne.glb', (gltf) =>
// {
//     const wobble = gltf.scene.children[0]
//     wobble.receiveShadow = true
//     wobble.castShadow = true
//     wobble.material = material
//     wobble.customDepthMaterial = depthMaterial

//     scene.add(wobble)
// })

/**
 * 平面
 */
const plane = new THREE.Mesh(new THREE.PlaneGeometry(15, 15, 15), new THREE.MeshStandardMaterial());
plane.receiveShadow = true;
plane.rotation.y = Math.PI;
plane.position.y = -5;
plane.position.z = 5;
scene.add(plane);

/**
 * 灯光
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 2, -2.25);
scene.add(directionalLight);

/**
 * 尺寸
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  // 更新尺寸
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // 更新相机
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // 更新渲染器
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * 相机
 */
// 基础相机
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.set(13, -3, -5);
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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * 动画循环
 */
const timer = new THREE.Timer();

const tick = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  // 材质
  uniforms.uTime.value = elapsedTime;

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
