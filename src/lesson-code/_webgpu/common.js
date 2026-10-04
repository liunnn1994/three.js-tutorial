// 所有课程共用的场景外壳。先阅读第 01 课，再关注每课的 script.js。
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';

export function showError(error) {
  console.error(error);
  const status = document.querySelector('#status');
  status.textContent = `示例未能启动：${error.message}。请检查浏览器控制台，在 localhost / HTTPS 下重试。`;
  status.dataset.error = 'true';
}

export async function createStage({ floor = true, background = '#11131d', camera = [3.8, 2.7, 5], target = [0, 1, 0] } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  const view = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
  view.position.set(...camera);
  // ?backend=webgl 用于检查节点材质的 WebGL 2 回退路径。
  const renderer = new THREE.WebGPURenderer({
    canvas: document.querySelector('canvas'), antialias: true,
    forceWebGL: new URLSearchParams(location.search).get('backend') === 'webgl',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  await renderer.init();
  const status = document.querySelector('#status');
  const gpu = renderer.backend.isWebGPUBackend === true;
  status.textContent = `${gpu ? 'WebGPU' : 'WebGL 2 回退'} · 拖动旋转 / 滚轮缩放`;
  const controls = new OrbitControls(view, renderer.domElement);
  controls.target.set(...target);
  controls.enableDamping = true;
  controls.update();
  const gui = new GUI({ title: '动手试一试', width: 230 });
  if (innerWidth < 600) gui.close();
  scene.add(new THREE.HemisphereLight('#b6c8ff', '#4a302a', 2));
  const light = new THREE.DirectionalLight('#ffe4ca', 4);
  light.position.set(3, 6, 4);
  scene.add(light);
  if (floor) {
    const mat = new THREE.MeshStandardNodeMaterial({ color: '#333c42', roughness: 0.95 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
  }
  const state = { paused: false, seconds: 0, frames: 0 };
  const resources = new Set();
  gui.add(state, 'paused').name('暂停动画');
  let last = performance.now();
  let pipeline = null;
  let update = () => {};
  function resize() {
    view.aspect = innerWidth / innerHeight;
    view.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  addEventListener('resize', resize);
  // 页面隐藏/恢复时重置基准，后台停留时间不计入动画。
  function resetTime() { last = performance.now(); }
  document.addEventListener('visibilitychange', resetTime);
  // 视觉动画使用真实的前台秒数；物理积分在第 19 课单独做固定子步。
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.max((now - last) / 1000, 0);
    last = now;
    if (document.hidden) return;
    try {
      if (!state.paused) { state.seconds += dt; update(state.seconds, dt); }
      controls.update();
      if (pipeline) pipeline.render(); else renderer.render(scene, view);
      state.frames++;
      // 测试工具也可以通过 DOM 确认已经输出了帧，而非只完成模块加载。
      document.body.dataset.frames = String(state.frames);
    } catch (error) {
      renderer.setAnimationLoop(null);
      showError(error);
    }
  });
  addEventListener('pagehide', () => {
    renderer.setAnimationLoop(null);
    removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', resetTime);
    controls.dispose(); gui.destroy();
    scene.traverse((object) => {
      if (object.geometry) resources.add(object.geometry);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((m) => resources.add(m));
    });
    resources.forEach((resource) => resource.dispose());
    resources.clear();
    renderer.dispose();
  }, { once: true });
  return {
    scene, camera: view, renderer, controls, gui, state, gpu,
    animate(fn) { update = fn; },
    postProcessing(value) { pipeline = value; resources.add(value); },
    // 场景遍历只能发现正在使用的 geometry/material，纹理和 pass 要显式登记。
    track(...values) { values.forEach((value) => resources.add(value)); },
    notice(text) { status.textContent = text; },
  };
}

// 自制“节点测试角色”：球形身体、鼻子和两条腿，共用同一个材质。
export function mascot(scene, material) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 48, 32), material);
  body.position.y = 1.45; group.add(body);
  const nose = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.65, 8, 24), material);
  nose.rotation.x = Math.PI / 2.8; nose.position.set(0, 1.05, 0.75); group.add(nose);
  for (const x of [-0.35, 0.35]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.45, 8, 24), material);
    leg.position.set(x, 0.55, 0); group.add(leg);
  }
  scene.add(group); return group;
}

export function seededRandom(seed = 42) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// 不依赖付费 GLB 的铁砧：底座、腰部、台面以及挤出的尖角。
export function anvil(scene, material = new THREE.MeshStandardNodeMaterial({ color: '#7789a8', metalness: 0.65, roughness: 0.35 })) {
  const group = new THREE.Group();
  for (const [w, h, d, y] of [[2.5, 0.35, 1.6, 0.25], [1.3, 0.8, 0.9, 0.8], [2.5, 0.45, 1.2, 1.42]]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, 16, 8, 8), material);
    mesh.position.y = y; group.add(mesh);
  }
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.lineTo(1.5, 0.2); shape.lineTo(0, 0.55); shape.closePath();
  const horn = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.65, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3, steps: 1 }), material);
  horn.position.set(1.2, 1.15, -0.325); group.add(horn);
  const wood = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.6, 12), new THREE.MeshStandardNodeMaterial({ color: '#71402b', roughness: 0.9 }));
  wood.position.y = -0.15; group.add(wood);
  scene.add(group); return group;
}
