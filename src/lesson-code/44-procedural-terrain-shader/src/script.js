import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { SUBTRACTION, Evaluator, Brush } from "three-bvh-csg";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import GUI from "lil-gui";
import terrainVertexShader from "./shaders/terrain/vertex.glsl";
import terrainFragmentShader from "./shaders/terrain/fragment.glsl";

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

/**
 * 环境贴图
 */
hdrLoader.load(
  "/assets/44-procedural-terrain-shader-final/spruit_sunrise.hdr",
  (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping;

    scene.background = environmentMap;
    scene.backgroundBlurriness = 0.5;
    scene.environment = environmentMap;
  },
);

/**
 * 地形
 */
// 几何体
const geometry = new THREE.PlaneGeometry(10, 10, 500, 500);
geometry.deleteAttribute("uv");
geometry.deleteAttribute("normal");
geometry.rotateX(-Math.PI * 0.5);

// 材质
debugObject.colorWaterDeep = "#002b3d";
debugObject.colorWaterSurface = "#66a8ff";
debugObject.colorSand = "#ffe894";
debugObject.colorGrass = "#85d534";
debugObject.colorSnow = "#ffffff";
debugObject.colorRock = "#bfbd8d";

const uniforms = {
  uTime: new THREE.Uniform(0),
  uPositionFrequency: new THREE.Uniform(0.2),
  uStrength: new THREE.Uniform(2.0),
  uWarpFrequency: new THREE.Uniform(5),
  uWarpStrength: new THREE.Uniform(0.5),
  uColorWaterDeep: new THREE.Uniform(new THREE.Color(debugObject.colorWaterDeep)),
  uColorWaterSurface: new THREE.Uniform(new THREE.Color(debugObject.colorWaterSurface)),
  uColorSand: new THREE.Uniform(new THREE.Color(debugObject.colorSand)),
  uColorGrass: new THREE.Uniform(new THREE.Color(debugObject.colorGrass)),
  uColorSnow: new THREE.Uniform(new THREE.Color(debugObject.colorSnow)),
  uColorRock: new THREE.Uniform(new THREE.Color(debugObject.colorRock)),
};

gui.add(uniforms.uPositionFrequency, "value", 0, 1, 0.001).name("位置频率");
gui.add(uniforms.uStrength, "value", 0, 10, 0.001).name("强度");
gui.add(uniforms.uWarpFrequency, "value", 0, 10, 0.001).name("扭曲频率");
gui.add(uniforms.uWarpStrength, "value", 0, 1, 0.001).name("扭曲强度");
gui
  .addColor(debugObject, "colorWaterDeep")
  .name("深水颜色")
  .onChange(() => uniforms.uColorWaterDeep.value.set(debugObject.colorWaterDeep));
gui
  .addColor(debugObject, "colorWaterSurface")
  .name("浅水颜色")
  .onChange(() => uniforms.uColorWaterSurface.value.set(debugObject.colorWaterSurface));
gui
  .addColor(debugObject, "colorSand")
  .name("沙子颜色")
  .onChange(() => uniforms.uColorSand.value.set(debugObject.colorSand));
gui
  .addColor(debugObject, "colorGrass")
  .name("草地颜色")
  .onChange(() => uniforms.uColorGrass.value.set(debugObject.colorGrass));
gui
  .addColor(debugObject, "colorSnow")
  .name("雪的颜色")
  .onChange(() => uniforms.uColorSnow.value.set(debugObject.colorSnow));
gui
  .addColor(debugObject, "colorRock")
  .name("岩石颜色")
  .onChange(() => uniforms.uColorRock.value.set(debugObject.colorRock));

const material = new CustomShaderMaterial({
  // CSM（级联阴影贴图）
  baseMaterial: THREE.MeshStandardMaterial,
  vertexShader: terrainVertexShader,
  fragmentShader: terrainFragmentShader,
  uniforms: uniforms,

  // MeshPhysicalMaterial 材质
  metalness: 0,
  roughness: 0.5,
  color: "#85d534",
});

const depthMaterial = new CustomShaderMaterial({
  // CSM（级联阴影贴图）
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader: terrainVertexShader,
  uniforms: uniforms,

  // MeshDepthMaterial 材质
  depthPacking: THREE.RGBADepthPacking,
});

// 网格
const terrain = new THREE.Mesh(geometry, material);
terrain.customDepthMaterial = depthMaterial;
terrain.receiveShadow = true;
terrain.castShadow = true;
scene.add(terrain);

/**
 * 板
 */
// 刷子
const boardFill = new Brush(new THREE.BoxGeometry(11, 2, 11));
const boardHole = new Brush(new THREE.BoxGeometry(10, 2.1, 10));
// boardHole.position.y = 0.2
// boardHole.updateMatrixWorld()

// 评估
const evaluator = new Evaluator();
const board = evaluator.evaluate(boardFill, boardHole, SUBTRACTION);
board.geometry.clearGroups();
board.material = new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 0, roughness: 0.3 });
board.castShadow = true;
board.receiveShadow = true;
scene.add(board);

/**
 * 水面
 */
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 1, 1),
  new THREE.MeshPhysicalMaterial({
    transmission: 1,
    roughness: 0.3,
  }),
);
water.rotation.x = -Math.PI * 0.5;
water.position.y = -0.1;
scene.add(water);

/**
 * 灯光
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 2);
directionalLight.position.set(6.25, 3, 4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.right = 8;
directionalLight.shadow.camera.bottom = -8;
directionalLight.shadow.camera.left = -8;
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
camera.position.set(-10, 6, -2);
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

  // Uniform 变量
  uniforms.uTime.value = elapsedTime;

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
