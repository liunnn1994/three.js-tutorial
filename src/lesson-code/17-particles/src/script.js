import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * 基础
 */
// 调试
const gui = new GUI();
const params = {
  size: 0.1,
  sizeAttenuation: true,
  count: 50000,
  color: "#ff88cc",
  blending: "AdditiveBlending",
  depthWrite: false,
  animSpeed: 1,
  regenerate: () => {
    const newPositions = new Float32Array(params.count * 3);
    const newColors = new Float32Array(params.count * 3);
    for (let i = 0; i < params.count * 3; i++) {
      newPositions[i] = (Math.random() - 0.5) * 10;
      newColors[i] = Math.random();
    }
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(newPositions, 3));
    particlesGeometry.setAttribute("color", new THREE.BufferAttribute(newColors, 3));
    particlesGeometry.attributes.position.needsUpdate = true;
    particlesGeometry.attributes.color.needsUpdate = true;
  },
};

gui
  .add(params, "size")
  .min(0.01)
  .max(0.5)
  .step(0.01)
  .name("粒子大小")
  .onChange(() => {
    particlesMaterial.size = params.size;
  });
gui
  .add(params, "sizeAttenuation")
  .name("大小衰减(Size Attenuation)")
  .onChange(() => {
    particlesMaterial.sizeAttenuation = params.sizeAttenuation;
  });
gui.add(params, "count").min(1000).max(200000).step(1000).name("粒子数量");
gui.add(params, "regenerate").name("重新生成粒子");
gui
  .addColor(params, "color")
  .name("颜色")
  .onChange(() => {
    particlesMaterial.color.set(params.color);
  });
gui
  .add(params, "blending", {
    AdditiveBlending: THREE.AdditiveBlending,
    NormalBlending: THREE.NormalBlending,
  })
  .name("混合模式")
  .onChange(() => {
    particlesMaterial.blending = params.blending;
    particlesMaterial.needsUpdate = true;
  });
gui
  .add(params, "depthWrite")
  .name("深度写入")
  .onChange(() => {
    particlesMaterial.depthWrite = params.depthWrite;
  });
gui.add(params, "animSpeed").min(0).max(5).step(0.1).name("动画速度");

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

/**
 * 纹理
 */
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load("/assets/17-particles-final/textures/particles/1.png");

/**
 * 粒子
 */
// 几何体
const particlesGeometry = new THREE.BufferGeometry();
const count = 50000;

const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 10;
  colors[i] = Math.random();
}

particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

// 材质
const particlesMaterial = new THREE.PointsMaterial();

particlesMaterial.size = 0.1;
particlesMaterial.sizeAttenuation = true;

particlesMaterial.color = new THREE.Color("#ff88cc");

particlesMaterial.transparent = true;
particlesMaterial.alphaMap = particleTexture;
// particlesMaterial.alphaTest = 0.01
// particlesMaterial.depthTest = false
particlesMaterial.depthWrite = false;
particlesMaterial.blending = THREE.AdditiveBlending;

particlesMaterial.vertexColors = true;

// 粒子点
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

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
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // 更新粒子
  for (let i = 0; i < count; i++) {
    let i3 = i * 3;

    const x = particlesGeometry.attributes.position.array[i3];
    particlesGeometry.attributes.position.array[i3 + 1] = Math.sin(
      elapsedTime * params.animSpeed + x,
    );
  }
  particlesGeometry.attributes.position.needsUpdate = true;

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
