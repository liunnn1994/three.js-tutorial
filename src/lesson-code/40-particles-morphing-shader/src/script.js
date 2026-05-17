import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import GUI from "lil-gui";
import gsap from "gsap";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";

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
dracoLoader.setDecoderPath("/assets/40-particles-morphing-shader-final/draco/");
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
  if (particles)
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
camera.position.set(0, 0, 8 * 2);
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

debugObject.clearColor = "#160920";
gui
  .addColor(debugObject, "clearColor")
  .onChange(() => {
    renderer.setClearColor(debugObject.clearColor);
  })
  .name("背景颜色");
renderer.setClearColor(debugObject.clearColor);

/**
 * 粒子
 */
let particles = null;

gltfLoader.load("/assets/40-particles-morphing-shader-final/models.glb", (gltf) => {
  particles = {};
  particles.index = 0;

  // 位置数据
  const positions = gltf.scene.children.map((child) => child.geometry.attributes.position);

  particles.maxCount = 0;
  for (const position of positions) {
    if (position.count > particles.maxCount) particles.maxCount = position.count;
  }

  particles.positions = [];
  for (const position of positions) {
    const originalArray = position.array;
    const newArray = new Float32Array(particles.maxCount * 3);

    for (let i = 0; i < particles.maxCount; i++) {
      const i3 = i * 3;

      if (i3 < originalArray.length) {
        newArray[i3 + 0] = originalArray[i3 + 0];
        newArray[i3 + 1] = originalArray[i3 + 1];
        newArray[i3 + 2] = originalArray[i3 + 2];
      } else {
        const randomIndex = Math.floor(position.count * Math.random()) * 3;
        newArray[i3 + 0] = originalArray[randomIndex + 0];
        newArray[i3 + 1] = originalArray[randomIndex + 1];
        newArray[i3 + 2] = originalArray[randomIndex + 2];
      }
    }

    particles.positions.push(new THREE.Float32BufferAttribute(newArray, 3));
  }

  // 几何体
  const sizesArray = new Float32Array(particles.maxCount);

  for (let i = 0; i < particles.maxCount; i++) sizesArray[i] = Math.random();

  particles.geometry = new THREE.BufferGeometry();
  particles.geometry.setAttribute("position", particles.positions[particles.index]);
  particles.geometry.setAttribute("aPositionTarget", particles.positions[3]);
  particles.geometry.setAttribute("aSize", new THREE.BufferAttribute(sizesArray, 1));

  // 材质
  particles.colorA = "#ff7300";
  particles.colorB = "#0091ff";

  particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms: {
      uSize: new THREE.Uniform(0.4),
      uResolution: new THREE.Uniform(
        new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio),
      ),
      uProgress: new THREE.Uniform(0),
      uColorA: new THREE.Uniform(new THREE.Color(particles.colorA)),
      uColorB: new THREE.Uniform(new THREE.Color(particles.colorB)),
    },
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // 粒子点
  particles.points = new THREE.Points(particles.geometry, particles.material);
  particles.points.frustumCulled = false;
  scene.add(particles.points);

  // 方法
  particles.morph = (index) => {
    // 更新属性
    particles.geometry.attributes.position = particles.positions[particles.index];
    particles.geometry.attributes.aPositionTarget = particles.positions[index];

    // 动画化 uProgress
    gsap.fromTo(
      particles.material.uniforms.uProgress,
      { value: 0 },
      { value: 1, duration: 3, ease: "linear" },
    );

    // 更新属性
    particles.index = index;
  };

  // 调试参数
  gui
    .addColor(particles, "colorA")
    .name("颜色 A")
    .onChange(() => {
      particles.material.uniforms.uColorA.value.set(particles.colorA);
    });
  gui
    .addColor(particles, "colorB")
    .name("颜色 B")
    .onChange(() => {
      particles.material.uniforms.uColorB.value.set(particles.colorB);
    });
  gui
    .add(particles.material.uniforms.uProgress, "value")
    .min(0)
    .max(1)
    .step(0.001)
    .name("变形进度")
    .listen();

  particles.morph0 = () => {
    particles.morph(0);
  };
  particles.morph1 = () => {
    particles.morph(1);
  };
  particles.morph2 = () => {
    particles.morph(2);
  };
  particles.morph3 = () => {
    particles.morph(3);
  };

  gui.add(particles, "morph0").name("变形到形状 0");
  gui.add(particles, "morph1").name("变形到形状 1");
  gui.add(particles, "morph2").name("变形到形状 2");
  gui.add(particles, "morph3").name("变形到形状 3");
});

/**
 * 动画循环
 */
const tick = () => {
  // 更新控制器
  controls.update();

  // 渲染普通场景
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
