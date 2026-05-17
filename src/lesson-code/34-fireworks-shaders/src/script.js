import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import gsap from "gsap";
import { Sky } from "three/addons/objects/Sky.js";
import fireworkVertexShader from "./shaders/firework/vertex.glsl";
import fireworkFragmentShader from "./shaders/firework/fragment.glsl";

/**
 * 基础
 */
// 调试
const gui = new GUI({ width: 340 });

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

// 加载器
const textureLoader = new THREE.TextureLoader();

/**
 * 尺寸
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};
sizes.resolution = new THREE.Vector2(
  sizes.width * sizes.pixelRatio,
  sizes.height * sizes.pixelRatio,
);

window.addEventListener("resize", () => {
  // 更新尺寸
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);
  sizes.resolution.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio);

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
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100);
camera.position.set(1.5, 0, 6);
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

/**
 * 烟花
 */
const textures = [
  textureLoader.load("/assets/34-fireworks-shaders-final/particles/1.png"),
  textureLoader.load("/assets/34-fireworks-shaders-final/particles/2.png"),
  textureLoader.load("/assets/34-fireworks-shaders-final/particles/3.png"),
  textureLoader.load("/assets/34-fireworks-shaders-final/particles/4.png"),
  textureLoader.load("/assets/34-fireworks-shaders-final/particles/5.png"),
  textureLoader.load("/assets/34-fireworks-shaders-final/particles/6.png"),
  textureLoader.load("/assets/34-fireworks-shaders-final/particles/7.png"),
  textureLoader.load("/assets/34-fireworks-shaders-final/particles/8.png"),
];

const createFirework = (count, position, size, texture, radius, color) => {
  // 几何体
  const positionsArray = new Float32Array(count * 3);
  const sizesArray = new Float32Array(count);
  const timeMultipliersArray = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    const spherical = new THREE.Spherical(
      radius * (0.75 + Math.random() * 0.25),
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2,
    );
    const position = new THREE.Vector3();
    position.setFromSpherical(spherical);

    positionsArray[i3] = position.x;
    positionsArray[i3 + 1] = position.y;
    positionsArray[i3 + 2] = position.z;

    sizesArray[i] = Math.random();

    timeMultipliersArray[i] = 1 + Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positionsArray, 3));
  geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizesArray, 1));
  geometry.setAttribute(
    "aTimeMultiplier",
    new THREE.Float32BufferAttribute(timeMultipliersArray, 1),
  );

  // 材质
  texture.flipY = false;
  const material = new THREE.ShaderMaterial({
    vertexShader: fireworkVertexShader,
    fragmentShader: fireworkFragmentShader,
    uniforms: {
      uSize: new THREE.Uniform(size),
      uResolution: new THREE.Uniform(sizes.resolution),
      uTexture: new THREE.Uniform(texture),
      uColor: new THREE.Uniform(color),
      uProgress: new THREE.Uniform(0),
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  // 粒子点
  const firework = new THREE.Points(geometry, material);
  firework.position.copy(position);
  scene.add(firework);

  // 销毁
  const destroy = () => {
    scene.remove(firework);
    geometry.dispose();
    material.dispose();
  };

  // 动画
  gsap.to(material.uniforms.uProgress, {
    value: 1,
    ease: "linear",
    duration: 3,
    onComplete: destroy,
  });
};

const createRandomFirework = () => {
  const count = Math.round(400 + Math.random() * 1000);
  const position = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    Math.random(),
    (Math.random() - 0.5) * 2,
  );
  const size = 0.1 + Math.random() * 0.1;
  const texture = textures[Math.floor(Math.random() * textures.length)];
  const radius = 0.5 + Math.random();
  const color = new THREE.Color();
  color.setHSL(Math.random(), 1, 0.7);
  createFirework(count, position, size, texture, radius, color);
};

createRandomFirework();

window.addEventListener("click", createRandomFirework);

/**
 * 天空
 */
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const sun = new THREE.Vector3();

const skyParameters = {
  turbidity: 10,
  rayleigh: 3,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.95,
  elevation: -2.2,
  azimuth: 180,
  exposure: renderer.toneMappingExposure,
};

const updateSky = () => {
  const uniforms = sky.material.uniforms;
  uniforms["turbidity"].value = skyParameters.turbidity;
  uniforms["rayleigh"].value = skyParameters.rayleigh;
  uniforms["mieCoefficient"].value = skyParameters.mieCoefficient;
  uniforms["mieDirectionalG"].value = skyParameters.mieDirectionalG;

  const phi = THREE.MathUtils.degToRad(90 - skyParameters.elevation);
  const theta = THREE.MathUtils.degToRad(skyParameters.azimuth);

  sun.setFromSphericalCoords(1, phi, theta);

  uniforms["sunPosition"].value.copy(sun);

  renderer.toneMappingExposure = skyParameters.exposure;
  renderer.render(scene, camera);
};

gui.add(skyParameters, "turbidity", 0.0, 20.0, 0.1).name("浑浊度(turbidity)").onChange(updateSky);
gui.add(skyParameters, "rayleigh", 0.0, 4, 0.001).name("瑞利散射(rayleigh)").onChange(updateSky);
gui
  .add(skyParameters, "mieCoefficient", 0.0, 0.1, 0.001)
  .name("米氏系数(mieCoefficient)")
  .onChange(updateSky);
gui
  .add(skyParameters, "mieDirectionalG", 0.0, 1, 0.001)
  .name("米氏方向性(mieDirectionalG)")
  .onChange(updateSky);
gui.add(skyParameters, "elevation", -3, 10, 0.01).name("仰角(elevation)").onChange(updateSky);
gui.add(skyParameters, "azimuth", -180, 180, 0.1).name("方位角(azimuth)").onChange(updateSky);
gui.add(skyParameters, "exposure", 0, 1, 0.0001).name("曝光度(exposure)").onChange(updateSky);

updateSky();

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
