import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

/**
 * 调试
 */
const gui = new GUI();

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
const textureLoader = new THREE.TextureLoader();

const doorColorTexture = textureLoader.load("/assets/11-materials-final/textures/door/color.jpg");
const doorAlphaTexture = textureLoader.load("/assets/11-materials-final/textures/door/alpha.jpg");
const doorAmbientOcclusionTexture = textureLoader.load(
  "/assets/11-materials-final/textures/door/ambientOcclusion.jpg",
);
const doorHeightTexture = textureLoader.load("/assets/11-materials-final/textures/door/height.jpg");
const doorNormalTexture = textureLoader.load("/assets/11-materials-final/textures/door/normal.jpg");
const doorMetalnessTexture = textureLoader.load(
  "/assets/11-materials-final/textures/door/metalness.jpg",
);
const doorRoughnessTexture = textureLoader.load(
  "/assets/11-materials-final/textures/door/roughness.jpg",
);
const matcapTexture = textureLoader.load("/assets/11-materials-final/textures/matcaps/8.png");
const gradientTexture = textureLoader.load("/assets/11-materials-final/textures/gradients/5.jpg");

doorColorTexture.colorSpace = THREE.SRGBColorSpace;
matcapTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * 环境贴图
 */
const hdrLoader = new HDRLoader();
hdrLoader.load("/assets/11-materials-final/textures/environmentMap/2k.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  scene.environment = environmentMap;
});

/**
 * 额外演示参数
 */
const extraParams = {
  showMultiMaterial: false,
  showLineDemo: false,
  showDashedLine: false,
};

/**
 * MeshPhysicalMaterial（主材质）
 */
const material = new THREE.MeshPhysicalMaterial();
material.metalness = 0;
material.roughness = 0.15;
material.transmission = 1;
material.ior = 1.5;
material.thickness = 0.5;

gui.add(material, "metalness").min(0).max(1).step(0.0001).name("金属度(metalness)");
gui.add(material, "roughness").min(0).max(1).step(0.0001).name("粗糙度(roughness)");
gui.add(material, "transmission").min(0).max(1).step(0.0001).name("透射(transmission)");
gui.add(material, "ior").min(1).max(10).step(0.0001).name("折射率(IOR)");
gui.add(material, "thickness").min(0).max(1).step(0.0001).name("厚度(thickness)");

/**
 * 主场景对象
 */
const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 64), material);
sphere.position.x = -1.5;

const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 100, 100), material);

const torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.2, 64, 128), material);
torus.position.x = 1.5;

scene.add(sphere, plane, torus);

/**
 * 多材质组合演示
 * BoxGeometry 有 6 个面（组），每个面可以使用不同的材质
 */
const multiMaterials = [
  new THREE.MeshStandardMaterial({ color: 0xff0000 }), // 右面 (+X)
  new THREE.MeshStandardMaterial({ color: 0x00ff00 }), // 左面 (-X)
  new THREE.MeshStandardMaterial({ color: 0x0000ff }), // 顶面 (+Y)
  new THREE.MeshStandardMaterial({ color: 0xffff00 }), // 底面 (-Y)
  new THREE.MeshStandardMaterial({ color: 0xff00ff }), // 前面 (+Z)
  new THREE.MeshStandardMaterial({ color: 0x00ffff }), // 后面 (-Z)
];
const multiMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), multiMaterials);
multiMesh.position.set(0, 2.5, 0);
multiMesh.visible = false;
scene.add(multiMesh);

/**
 * 线条材质演示
 * Line（实线折线）+ LineDashedMaterial（虚线）
 */
// 实线五角星
const starPoints = [];
for (let i = 0; i < 5; i++) {
  const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
  const innerAngle = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
  starPoints.push(new THREE.Vector3(Math.cos(outerAngle) * 1.2, Math.sin(outerAngle) * 1.2, 0));
  starPoints.push(new THREE.Vector3(Math.cos(innerAngle) * 0.5, Math.sin(innerAngle) * 0.5, 0));
}
const starGeo = new THREE.BufferGeometry().setFromPoints(starPoints);
const solidLineMat = new THREE.LineBasicMaterial({ color: 0x00ffcc });
const solidLine = new THREE.LineLoop(starGeo, solidLineMat);
solidLine.position.set(-2.5, -2.5, 0);
solidLine.visible = false;
scene.add(solidLine);

// 虚线矩形
const rectPoints = [
  new THREE.Vector3(-1.2, -0.8, 0),
  new THREE.Vector3(1.2, -0.8, 0),
  new THREE.Vector3(1.2, 0.8, 0),
  new THREE.Vector3(-1.2, 0.8, 0),
];
const rectGeo = new THREE.BufferGeometry().setFromPoints(rectPoints);
const dashedMat = new THREE.LineDashedMaterial({
  color: 0xff8800,
  dashSize: 0.2,
  gapSize: 0.1,
  scale: 1,
});
const dashedLine = new THREE.LineLoop(rectGeo, dashedMat);
dashedLine.computeLineDistances(); // 虚线必须调用！
dashedLine.position.set(2.5, -2.5, 0);
dashedLine.visible = false;
scene.add(dashedLine);

// 线条标签
function createLabel(text) {
  const canvas2d = document.createElement("canvas");
  const fontSize = 36;
  canvas2d.width = 1024;
  canvas2d.height = 80;
  const ctx = canvas2d.getContext("2d");
  ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas2d.width / 2, canvas2d.height / 2);

  const texture = new THREE.CanvasTexture(canvas2d);
  texture.colorSpace = THREE.SRGBColorSpace;
  const labelGeo = new THREE.PlaneGeometry(3, 0.25);
  const labelMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  return new THREE.Mesh(labelGeo, labelMat);
}

const solidLabel = createLabel("LineBasicMaterial（实线）");
solidLabel.position.set(-2.5, -3.8, 0);
solidLabel.visible = false;
scene.add(solidLabel);

const dashedLabel = createLabel("LineDashedMaterial（虚线）");
dashedLabel.position.set(2.5, -3.8, 0);
dashedLabel.visible = false;
scene.add(dashedLabel);

const multiLabel = createLabel("多材质组合（6 面 6 色）");
multiLabel.position.set(0, 3.6, 0);
multiLabel.visible = false;
scene.add(multiLabel);

/**
 * 额外演示切换
 */
const extraFolder = gui.addFolder("额外演示");
extraFolder
  .add(extraParams, "showMultiMaterial")
  .name("多材质组合")
  .onChange((val) => {
    multiMesh.visible = val;
    multiLabel.visible = val;
  });
extraFolder
  .add(extraParams, "showLineDemo")
  .name("线条材质")
  .onChange((val) => {
    solidLine.visible = val;
    dashedLine.visible = val;
    solidLabel.visible = val;
    dashedLabel.visible = val;
  });
extraFolder.open();

/**
 * 尺寸
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * 相机
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(1, 1, 5);
scene.add(camera);

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
const timer = new THREE.Timer();

const tick = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  // 旋转主对象
  sphere.rotation.y = 0.1 * elapsedTime;
  plane.rotation.y = 0.1 * elapsedTime;
  torus.rotation.y = 0.1 * elapsedTime;
  sphere.rotation.x = -0.15 * elapsedTime;
  plane.rotation.x = -0.15 * elapsedTime;
  torus.rotation.x = -0.15 * elapsedTime;

  // 旋转多材质立方体
  multiMesh.rotation.y = 0.5 * elapsedTime;
  multiMesh.rotation.x = 0.3 * elapsedTime;

  // 旋转线条
  solidLine.rotation.z = 0.2 * elapsedTime;
  dashedLine.rotation.z = -0.2 * elapsedTime;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
