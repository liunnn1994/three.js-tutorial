import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import GUI from "lil-gui";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";
import gpgpuParticlesShader from "./shaders/gpgpu/particles.glsl";

/**
 * 基础
 */
// 调试
const gui = new GUI({ width: 340 });
const debugObject = {};

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

// 加载器
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/assets/41-gpgpu-flow-field-particles-shaders-final/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

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

  // 材质
  particles.material.uniforms.uResolution.value.set(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio,
  );

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
camera.position.set(4.5, 4, 11);
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
renderer.setPixelRatio(sizes.pixelRatio);

debugObject.clearColor = "#29191f";
renderer.setClearColor(debugObject.clearColor);

/**
 * 加载模型
 */
const gltf = await gltfLoader.loadAsync(
  "/assets/41-gpgpu-flow-field-particles-shaders-final/model.glb",
);

/**
 * 基础几何体
 */
const baseGeometry = {};
baseGeometry.instance = gltf.scene.children[0].geometry;
baseGeometry.count = baseGeometry.instance.attributes.position.count;

/**
 * GPU 计算
 */
// 设置
const gpgpu = {};
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count));
gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer);

// 基础粒子
const baseParticlesTexture = gpgpu.computation.createTexture();

for (let i = 0; i < baseGeometry.count; i++) {
  const i3 = i * 3;
  const i4 = i * 4;

  // 基于几何体的位置
  baseParticlesTexture.image.data[i4 + 0] = baseGeometry.instance.attributes.position.array[i3 + 0];
  baseParticlesTexture.image.data[i4 + 1] = baseGeometry.instance.attributes.position.array[i3 + 1];
  baseParticlesTexture.image.data[i4 + 2] = baseGeometry.instance.attributes.position.array[i3 + 2];
  baseParticlesTexture.image.data[i4 + 3] = Math.random();
}

// 粒子变量
gpgpu.particlesVariable = gpgpu.computation.addVariable(
  "uParticles",
  gpgpuParticlesShader,
  baseParticlesTexture,
);
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [gpgpu.particlesVariable]);

// Uniform 变量
gpgpu.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0);
gpgpu.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0);
gpgpu.particlesVariable.material.uniforms.uBase = new THREE.Uniform(baseParticlesTexture);
gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence = new THREE.Uniform(0.5);
gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength = new THREE.Uniform(2);
gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency = new THREE.Uniform(0.5);

// 初始化
gpgpu.computation.init();

// 调试
gpgpu.debug = new THREE.Mesh(
  new THREE.PlaneGeometry(3, 3),
  new THREE.MeshBasicMaterial({
    map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture,
  }),
);
gpgpu.debug.position.x = 3;
gpgpu.debug.visible = false;
scene.add(gpgpu.debug);

/**
 * 粒子
 */
const particles = {};

// 几何体
const particlesUvArray = new Float32Array(baseGeometry.count * 2);
const sizesArray = new Float32Array(baseGeometry.count);

for (let y = 0; y < gpgpu.size; y++) {
  for (let x = 0; x < gpgpu.size; x++) {
    const i = y * gpgpu.size + x;
    const i2 = i * 2;

    // UV 坐标
    const uvX = (x + 0.5) / gpgpu.size;
    const uvY = (y + 0.5) / gpgpu.size;

    particlesUvArray[i2 + 0] = uvX;
    particlesUvArray[i2 + 1] = uvY;

    // 大小
    sizesArray[i] = Math.random();
  }
}

particles.geometry = new THREE.BufferGeometry();
particles.geometry.setDrawRange(0, baseGeometry.count);
particles.geometry.setAttribute("aParticlesUv", new THREE.BufferAttribute(particlesUvArray, 2));
particles.geometry.setAttribute("aColor", baseGeometry.instance.attributes.color);
particles.geometry.setAttribute("aSize", new THREE.BufferAttribute(sizesArray, 1));

// 材质
particles.material = new THREE.ShaderMaterial({
  vertexShader: particlesVertexShader,
  fragmentShader: particlesFragmentShader,
  uniforms: {
    uSize: new THREE.Uniform(0.07),
    uResolution: new THREE.Uniform(
      new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio),
    ),
    uParticlesTexture: new THREE.Uniform(),
  },
});

// 粒子点
particles.points = new THREE.Points(particles.geometry, particles.material);
scene.add(particles.points);

/**
 * 调试参数
 */
gui
  .addColor(debugObject, "clearColor")
  .name("背景颜色")
  .onChange(() => {
    renderer.setClearColor(debugObject.clearColor);
  });
gui.add(particles.material.uniforms.uSize, "value").min(0).max(1).step(0.001).name("粒子大小");
gui
  .add(gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("流场影响力");
gui
  .add(gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength, "value")
  .min(0)
  .max(10)
  .step(0.001)
  .name("流场强度");
gui
  .add(gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("流场频率");

/**
 * 动画循环
 */
const timer = new THREE.Timer();
let previousTime = 0;

const tick = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // 更新控制器
  controls.update();

  // GPGPU 更新
  gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime;
  gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime;
  gpgpu.computation.compute();
  particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(
    gpgpu.particlesVariable,
  ).texture;

  // 渲染普通场景
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
