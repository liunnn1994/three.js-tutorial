import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * 基础
 */
// 调试
const gui = new GUI();

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

/**
 * 纹理
 */
const textureLoader = new THREE.TextureLoader();

const doorColorTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/door/color.jpg",
);
doorColorTexture.colorSpace = THREE.SRGBColorSpace;
const doorAlphaTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/door/alpha.jpg",
);
const doorAmbientOcclusionTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/door/ambientOcclusion.jpg",
);
const doorHeightTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/door/height.jpg",
);
const doorNormalTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/door/normal.jpg",
);
const doorMetalnessTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/door/metalness.jpg",
);
const doorRoughnessTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/door/roughness.jpg",
);

const bricksColorTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/bricks/color.jpg",
);
bricksColorTexture.colorSpace = THREE.SRGBColorSpace;
const bricksAmbientOcclusionTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/bricks/ambientOcclusion.jpg",
);
const bricksNormalTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/bricks/normal.jpg",
);
const bricksRoughnessTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/bricks/roughness.jpg",
);

const grassColorTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/grass/color.jpg",
);
grassColorTexture.colorSpace = THREE.SRGBColorSpace;
const grassAmbientOcclusionTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/grass/ambientOcclusion.jpg",
);
const grassNormalTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/grass/normal.jpg",
);
const grassRoughnessTexture = textureLoader.load(
  "/assets/16-haunted-house-final/textures/grass/roughness.jpg",
);

grassColorTexture.repeat.set(8, 8);
grassAmbientOcclusionTexture.repeat.set(8, 8);
grassNormalTexture.repeat.set(8, 8);
grassRoughnessTexture.repeat.set(8, 8);

grassColorTexture.wrapS = THREE.RepeatWrapping;
grassAmbientOcclusionTexture.wrapS = THREE.RepeatWrapping;
grassNormalTexture.wrapS = THREE.RepeatWrapping;
grassRoughnessTexture.wrapS = THREE.RepeatWrapping;

grassColorTexture.wrapT = THREE.RepeatWrapping;
grassAmbientOcclusionTexture.wrapT = THREE.RepeatWrapping;
grassNormalTexture.wrapT = THREE.RepeatWrapping;
grassRoughnessTexture.wrapT = THREE.RepeatWrapping;

/**
 * 房屋
 */
// 房屋容器
const house = new THREE.Group();
scene.add(house);

// 墙壁
const walls = new THREE.Mesh(
  new THREE.BoxGeometry(4, 2.5, 4),
  new THREE.MeshStandardMaterial({
    map: bricksColorTexture,
    aoMap: bricksAmbientOcclusionTexture,
    normalMap: bricksNormalTexture,
    roughnessMap: bricksRoughnessTexture,
  }),
);
walls.position.y = 1.25;
house.add(walls);

// 屋顶
const roof = new THREE.Mesh(
  new THREE.ConeGeometry(3.5, 1, 4),
  new THREE.MeshStandardMaterial({ color: "#b35f45" }),
);
roof.rotation.y = Math.PI * 0.25;
roof.position.y = 2.5 + 0.5;
house.add(roof);

// 门
const door = new THREE.Mesh(
  new THREE.PlaneGeometry(2.2, 2.2, 100, 100),
  new THREE.MeshStandardMaterial({
    map: doorColorTexture,
    transparent: true,
    alphaMap: doorAlphaTexture,
    aoMap: doorAmbientOcclusionTexture,
    displacementMap: doorHeightTexture,
    displacementScale: 0.1,
    normalMap: doorNormalTexture,
    metalnessMap: doorMetalnessTexture,
    roughnessMap: doorRoughnessTexture,
  }),
);
door.position.y = 1;
door.position.z = 2 + 0.01;
house.add(door);

// 灌木
const bushGeometry = new THREE.SphereGeometry(1, 16, 16);
const bushMaterial = new THREE.MeshStandardMaterial({ color: "#89c854" });

const bush1 = new THREE.Mesh(bushGeometry, bushMaterial);
bush1.scale.set(0.5, 0.5, 0.5);
bush1.position.set(0.8, 0.2, 2.2);

const bush2 = new THREE.Mesh(bushGeometry, bushMaterial);
bush2.scale.set(0.25, 0.25, 0.25);
bush2.position.set(1.4, 0.1, 2.1);

const bush3 = new THREE.Mesh(bushGeometry, bushMaterial);
bush3.scale.set(0.4, 0.4, 0.4);
bush3.position.set(-0.8, 0.1, 2.2);

const bush4 = new THREE.Mesh(bushGeometry, bushMaterial);
bush4.scale.set(0.15, 0.15, 0.15);
bush4.position.set(-1, 0.05, 2.6);

house.add(bush1, bush2, bush3, bush4);

// 墓碑
const graves = new THREE.Group();
scene.add(graves);

const graveGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.2);
const graveMaterial = new THREE.MeshStandardMaterial({ color: "#b2b6b1" });

for (let i = 0; i < 50; i++) {
  const angle = Math.random() * Math.PI * 2; // 随机角度
  const radius = 3 + Math.random() * 6; // 随机半径
  const x = Math.cos(angle) * radius; // 使用余弦获取 x 位置
  const z = Math.sin(angle) * radius; // 使用正弦获取 z 位置

  // 创建网格
  const grave = new THREE.Mesh(graveGeometry, graveMaterial);
  grave.castShadow = true;

  // 位置
  grave.position.set(x, 0.3, z);

  // 旋转
  grave.rotation.z = (Math.random() - 0.5) * 0.4;
  grave.rotation.y = (Math.random() - 0.5) * 0.4;

  // 添加到墓碑容器
  graves.add(grave);
}

// 地板
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({
    map: grassColorTexture,
    aoMap: grassAmbientOcclusionTexture,
    normalMap: grassNormalTexture,
    roughnessMap: grassRoughnessTexture,
  }),
);
floor.rotation.x = -Math.PI * 0.5;
floor.position.y = 0;
scene.add(floor);

/**
 * 灯光
 */
// 环境光
const ambientLight = new THREE.AmbientLight("#b9d5ff", 0.12);
gui.add(ambientLight, "intensity").min(0).max(1).step(0.001).name("环境光强度");
scene.add(ambientLight);

// 平行光
const moonLight = new THREE.DirectionalLight("#b9d5ff", 0.26);
moonLight.position.set(4, 5, -2);
gui.add(moonLight, "intensity").min(0).max(1).step(0.001).name("月光强度");
gui.add(moonLight.position, "x").min(-5).max(5).step(0.001).name("位置 X");
gui.add(moonLight.position, "y").min(-5).max(5).step(0.001).name("位置 Y");
gui.add(moonLight.position, "z").min(-5).max(5).step(0.001).name("位置 Z");
scene.add(moonLight);

// 门灯
const doorLight = new THREE.PointLight("#ff7d46", 3, 7);
doorLight.position.set(0, 2.2, 2.7);
house.add(doorLight);

/**
 * 雾
 */
const fog = new THREE.Fog("#262837", 1, 15);
scene.fog = fog;

/**
 * 幽灵
 */
const ghost1 = new THREE.PointLight("#ff00ff", 6, 3);
scene.add(ghost1);

const ghost2 = new THREE.PointLight("#00ffff", 6, 3);
scene.add(ghost2);

const ghost3 = new THREE.PointLight("#ffff00", 6, 3);
scene.add(ghost3);

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
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 5;
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
renderer.setClearColor("#262837");
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * 阴影
 */
renderer.shadowMap.enabled = true;

moonLight.castShadow = true;
doorLight.castShadow = true;
ghost1.castShadow = true;
ghost2.castShadow = true;
ghost3.castShadow = true;

walls.castShadow = true;
bush1.castShadow = true;
bush2.castShadow = true;
bush3.castShadow = true;
bush4.castShadow = true;

floor.receiveShadow = true;

moonLight.shadow.mapSize.width = 256;
moonLight.shadow.mapSize.height = 256;
moonLight.shadow.camera.far = 15;

doorLight.shadow.mapSize.width = 256;
doorLight.shadow.mapSize.height = 256;
doorLight.shadow.camera.far = 7;

ghost1.shadow.mapSize.width = 256;
ghost1.shadow.mapSize.height = 256;
ghost1.shadow.camera.far = 7;

ghost2.shadow.mapSize.width = 256;
ghost2.shadow.mapSize.height = 256;
ghost2.shadow.camera.far = 7;

ghost3.shadow.mapSize.width = 256;
ghost3.shadow.mapSize.height = 256;
ghost3.shadow.camera.far = 7;

renderer.shadowMap.type = THREE.PCFShadowMap;

/**
 * 动画循环
 */
const timer = new THREE.Timer();

const tick = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  // 幽灵
  const ghost1Angle = elapsedTime * 0.5;
  ghost1.position.x = Math.cos(ghost1Angle) * 4;
  ghost1.position.z = Math.sin(ghost1Angle) * 4;
  ghost1.position.y = Math.sin(elapsedTime * 3);

  const ghost2Angle = -elapsedTime * 0.32;
  ghost2.position.x = Math.cos(ghost2Angle) * 5;
  ghost2.position.z = Math.sin(ghost2Angle) * 5;
  ghost2.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5);

  const ghost3Angle = -elapsedTime * 0.18;
  ghost3.position.x = Math.cos(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.32));
  ghost3.position.z = Math.sin(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.5));
  ghost3.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5);

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
