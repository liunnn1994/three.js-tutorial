import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * 基础
 */
// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

/**
 * 纹理
 */
const loadingManager = new THREE.LoadingManager();
loadingManager.onStart = () => {
  console.log("loadingManager: loading started");
};
loadingManager.onLoad = () => {
  console.log("loadingManager: loading finished");
};
loadingManager.onProgress = () => {
  console.log("loadingManager: loading progressing");
};
loadingManager.onError = () => {
  console.log("loadingManager: loading error");
};

const textureLoader = new THREE.TextureLoader(loadingManager);

// const colorTexture = textureLoader.load('/assets/10-textures-final/textures/checkerboard-1024x1024.png')
// const colorTexture = textureLoader.load('/assets/10-textures-final/textures/checkerboard-2x2.png')
const colorTexture = textureLoader.load(
  "/assets/10-textures-final/textures/minecraft.png",
  () => {
    console.log("textureLoader: loading finished");
  },
  () => {
    console.log("textureLoader: loading progressing");
  },
  () => {
    console.log("textureLoader: loading error");
  },
);
colorTexture.colorSpace = THREE.SRGBColorSpace;
colorTexture.wrapS = THREE.MirroredRepeatWrapping;
colorTexture.wrapT = THREE.MirroredRepeatWrapping;
colorTexture.generateMipmaps = false;
colorTexture.minFilter = THREE.NearestFilter;
colorTexture.magFilter = THREE.NearestFilter;

/**
 * 调试
 */
const gui = new GUI();
const params = {
  repeatX: 2,
  repeatY: 2,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  wrapS: "MirroredRepeatWrapping",
  wrapT: "MirroredRepeatWrapping",
  minFilter: "NearestFilter",
  magFilter: "NearestFilter",
};

const wrapModes = {
  RepeatWrapping: THREE.RepeatWrapping,
  ClampToEdgeWrapping: THREE.ClampToEdgeWrapping,
  MirroredRepeatWrapping: THREE.MirroredRepeatWrapping,
};
const filterModes = { NearestFilter: THREE.NearestFilter, LinearFilter: THREE.LinearFilter };

function updateTexture() {
  colorTexture.repeat.x = params.repeatX;
  colorTexture.repeat.y = params.repeatY;
  colorTexture.offset.x = params.offsetX;
  colorTexture.offset.y = params.offsetY;
  colorTexture.rotation = params.rotation;
  colorTexture.center.x = 0.5;
  colorTexture.center.y = 0.5;
  colorTexture.wrapS = wrapModes[params.wrapS];
  colorTexture.wrapT = wrapModes[params.wrapT];
  colorTexture.minFilter = filterModes[params.minFilter];
  colorTexture.magFilter = filterModes[params.magFilter];
  colorTexture.needsUpdate = true;
}

const textureFolder = gui.addFolder("纹理属性");
textureFolder.add(params, "repeatX").min(1).max(10).step(1).name("重复 X").onChange(updateTexture);
textureFolder.add(params, "repeatY").min(1).max(10).step(1).name("重复 Y").onChange(updateTexture);
textureFolder
  .add(params, "offsetX")
  .min(-1)
  .max(1)
  .step(0.05)
  .name("偏移 X")
  .onChange(updateTexture);
textureFolder
  .add(params, "offsetY")
  .min(-1)
  .max(1)
  .step(0.05)
  .name("偏移 Y")
  .onChange(updateTexture);
textureFolder
  .add(params, "rotation")
  .min(0)
  .max(Math.PI * 2)
  .step(0.01)
  .name("旋转")
  .onChange(updateTexture);
textureFolder
  .add(params, "wrapS", Object.keys(wrapModes))
  .name("包裹方式 S")
  .onChange(updateTexture);
textureFolder
  .add(params, "wrapT", Object.keys(wrapModes))
  .name("包裹方式 T")
  .onChange(updateTexture);
textureFolder
  .add(params, "minFilter", Object.keys(filterModes))
  .name("缩小过滤")
  .onChange(updateTexture);
textureFolder
  .add(params, "magFilter", Object.keys(filterModes))
  .name("放大过滤")
  .onChange(updateTexture);

updateTexture();

const alphaTexture = textureLoader.load("/assets/10-textures-final/textures/door/alpha.jpg");
const heightTexture = textureLoader.load("/assets/10-textures-final/textures/door/height.jpg");
const normalTexture = textureLoader.load("/assets/10-textures-final/textures/door/normal.jpg");
const ambientOcclusionTexture = textureLoader.load(
  "/assets/10-textures-final/textures/door/ambientOcclusion.jpg",
);
const metalnessTexture = textureLoader.load(
  "/assets/10-textures-final/textures/door/metalness.jpg",
);
const roughnessTexture = textureLoader.load(
  "/assets/10-textures-final/textures/door/roughness.jpg",
);

/**
 * 物体
 */
const geometry = new THREE.BoxGeometry(1, 1, 1);
console.log(geometry.attributes);
const material = new THREE.MeshBasicMaterial({ map: colorTexture });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

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
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 1;
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

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
