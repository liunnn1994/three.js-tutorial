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
 * 调试
 */
const gui = new GUI();
const params = {
  demo: "随机三角形",
  count: 50,
  size: 4,
  wireframe: true,
  color: "#ff0000",
  edgeThreshold: 15,
  lineClosed: false,
  instanceCount: 500,
  instanceSize: 4,
};

const demos = ["随机三角形", "边缘线 EdgesGeometry", "线条 Line/LineLoop", "实例化 InstancedMesh"];

// 用于存储当前演示的对象，方便清理
let currentObjects = [];

// 清理当前演示
function clearCurrentDemo() {
  currentObjects.forEach((obj) => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
  currentObjects = [];
}

/**
 * 演示 1：随机三角形（BufferGeometry 自定义几何体）
 */
function createRandomTriangles() {
  clearCurrentDemo();

  const geometry = new THREE.BufferGeometry();
  const positionsArray = new Float32Array(params.count * 3 * 3);
  for (let i = 0; i < params.count * 3 * 3; i++) {
    positionsArray[i] = (Math.random() - 0.5) * params.size;
  }
  const positionsAttribute = new THREE.BufferAttribute(positionsArray, 3);
  geometry.setAttribute("position", positionsAttribute);

  const material = new THREE.MeshBasicMaterial({
    color: params.color,
    wireframe: params.wireframe,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  currentObjects.push(mesh);
}

/**
 * 演示 2：EdgesGeometry — 边缘线 vs wireframe 对比
 */
function createEdgesDemo() {
  clearCurrentDemo();

  const boxGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);

  // 左边：wireframe 模式（显示所有三角形边，包括对角线）
  const wireframeMat = new THREE.MeshBasicMaterial({
    color: 0xff4444,
    wireframe: true,
  });
  const wireframeMesh = new THREE.Mesh(boxGeo, wireframeMat);
  wireframeMesh.position.x = -1.5;
  wireframeMesh.position.y = 0.5;
  scene.add(wireframeMesh);
  currentObjects.push(wireframeMesh);

  // 左边标签 — 用一个小文字平面
  const labelGeo1 = createLabel("wireframe: true");
  labelGeo1.position.set(-1.5, -0.6, 0);
  scene.add(labelGeo1);
  currentObjects.push(labelGeo1);

  // 右边：EdgesGeometry（只显示硬边，干净利落）
  const edges = new THREE.EdgesGeometry(boxGeo, params.edgeThreshold);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 1 });
  const edgeMesh = new THREE.LineSegments(edges, edgeMat);
  edgeMesh.position.x = 1.5;
  edgeMesh.position.y = 0.5;
  scene.add(edgeMesh);
  currentObjects.push(edgeMesh);

  // 右边半透明实体，方便看到边缘线在哪个面上
  const solidMat = new THREE.MeshBasicMaterial({
    color: 0x223344,
    transparent: true,
    opacity: 0.3,
  });
  const solidMesh = new THREE.Mesh(boxGeo.clone(), solidMat);
  solidMesh.position.x = 1.5;
  solidMesh.position.y = 0.5;
  scene.add(solidMesh);
  currentObjects.push(solidMesh);

  const labelGeo2 = createLabel("EdgesGeometry");
  labelGeo2.position.set(1.5, -0.6, 0);
  scene.add(labelGeo2);
  currentObjects.push(labelGeo2);
}

/**
 * 演示 3：线条 Line / LineLoop / LineSegments
 */
function createLineDemo() {
  clearCurrentDemo();

  // 定义一组顶点
  const points = [
    new THREE.Vector3(-1, -1, 0),
    new THREE.Vector3(1, -1, 0),
    new THREE.Vector3(1, 1, 0),
    new THREE.Vector3(-1, 1, 0),
  ];

  // Line — 折线（不闭合）
  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffcc });
  const line = new THREE.Line(lineGeo, lineMat);
  line.position.x = -2.5;
  line.position.y = 0.5;
  scene.add(line);
  currentObjects.push(line);

  const label1 = createLabel("Line（折线）");
  label1.position.set(-2.5, -1.2, 0);
  scene.add(label1);
  currentObjects.push(label1);

  // LineLoop — 闭合折线（自动连接首尾）
  const loopGeo = new THREE.BufferGeometry().setFromPoints(points);
  const loopMat = new THREE.LineBasicMaterial({ color: 0xffaa00 });
  const loop = new THREE.LineLoop(loopGeo, loopMat);
  loop.position.y = 0.5;
  scene.add(loop);
  currentObjects.push(loop);

  const label2 = createLabel("LineLoop（闭合）");
  label2.position.set(0, -1.2, 0);
  scene.add(label2);
  currentObjects.push(label2);

  // LineSegments — 独立线段（每两个点一段）
  const segPoints = [
    new THREE.Vector3(-1, -1, 0),
    new THREE.Vector3(1, 1, 0), // 第一段
    new THREE.Vector3(-1, 1, 0),
    new THREE.Vector3(1, -1, 0), // 第二段
  ];
  const segGeo = new THREE.BufferGeometry().setFromPoints(segPoints);
  const segMat = new THREE.LineBasicMaterial({ color: 0xff44ff });
  const segments = new THREE.LineSegments(segGeo, segMat);
  segments.position.x = 2.5;
  segments.position.y = 0.5;
  scene.add(segments);
  currentObjects.push(segments);

  const label3 = createLabel("LineSegments（独立线段）");
  label3.position.set(2.5, -1.2, 0);
  scene.add(label3);
  currentObjects.push(label3);
}

/**
 * 演示 4：InstancedMesh — 实例化网格
 */
function createInstancedDemo() {
  clearCurrentDemo();

  const instancedGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const instancedMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
  const count = params.instanceCount;
  const instancedMesh = new THREE.InstancedMesh(instancedGeo, instancedMat, count);

  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    dummy.position.set(
      (Math.random() - 0.5) * params.instanceSize,
      (Math.random() - 0.5) * params.instanceSize,
      (Math.random() - 0.5) * params.instanceSize,
    );
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    dummy.scale.setScalar(0.3 + Math.random() * 0.7);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);

    // 给每个实例随机颜色
    instancedMesh.setColorAt(i, new THREE.Color().setHSL(Math.random(), 0.8, 0.6));
  }
  instancedMesh.instanceMatrix.needsUpdate = true;
  instancedMesh.instanceColor.needsUpdate = true;

  scene.add(instancedMesh);
  currentObjects.push(instancedMesh);

  // 添加信息标签
  const label = createLabel(`${count} 个方块 — 只有 1 个 draw call！`);
  label.position.set(0, -2, 0);
  scene.add(label);
  currentObjects.push(label);
}

/**
 * 辅助函数：创建文字标签
 */
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

/**
 * 根据当前选择创建演示
 */
function createDemo() {
  switch (params.demo) {
    case "随机三角形":
      createRandomTriangles();
      break;
    case "边缘线 EdgesGeometry":
      createEdgesDemo();
      break;
    case "线条 Line/LineLoop":
      createLineDemo();
      break;
    case "实例化 InstancedMesh":
      createInstancedDemo();
      break;
  }
}

// GUI 控制
const demoFolder = gui.addFolder("演示模式");
demoFolder.add(params, "demo", demos).name("切换演示").onChange(createDemo);
demoFolder.open();

// 演示 1 的参数
const triangleFolder = gui.addFolder("随机三角形参数");
triangleFolder
  .add(params, "count")
  .min(1)
  .max(500)
  .step(1)
  .name("三角形数量")
  .onChange(() => {
    if (params.demo === "随机三角形") createRandomTriangles();
  });
triangleFolder
  .add(params, "size")
  .min(1)
  .max(10)
  .step(0.5)
  .name("分散大小")
  .onChange(() => {
    if (params.demo === "随机三角形") createRandomTriangles();
  });
triangleFolder
  .add(params, "wireframe")
  .name("线框模式")
  .onChange(() => {
    if (params.demo === "随机三角形") createRandomTriangles();
  });
triangleFolder
  .addColor(params, "color")
  .name("颜色")
  .onChange(() => {
    if (params.demo === "随机三角形") createRandomTriangles();
  });

// 演示 2 的参数
const edgeFolder = gui.addFolder("边缘线参数");
edgeFolder
  .add(params, "edgeThreshold")
  .min(1)
  .max(180)
  .step(1)
  .name("角度阈值")
  .onChange(() => {
    if (params.demo === "边缘线 EdgesGeometry") createEdgesDemo();
  });

// 演示 4 的参数
const instanceFolder = gui.addFolder("实例化参数");
instanceFolder
  .add(params, "instanceCount")
  .min(10)
  .max(5000)
  .step(10)
  .name("实例数量")
  .onChange(() => {
    if (params.demo === "实例化 InstancedMesh") createInstancedDemo();
  });
instanceFolder
  .add(params, "instanceSize")
  .min(1)
  .max(10)
  .step(0.5)
  .name("分散大小")
  .onChange(() => {
    if (params.demo === "实例化 InstancedMesh") createInstancedDemo();
  });

// 初始化
createDemo();

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
camera.position.set(0, 1, 5);
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

  // 让当前演示的对象缓慢旋转
  currentObjects.forEach((obj) => {
    if (obj.isMesh || obj.isLineSegments || obj.isLine || obj.isLineLoop) {
      obj.rotation.y = elapsedTime * 0.3;
    }
  });

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
