import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import GUI from "lil-gui";

/**
 * 加载器
 */
const loadingBarElement = document.querySelector(".loading-bar");

let sceneReady = false;
const loadingManager = new THREE.LoadingManager(
  // 已加载
  () => {
    // 等待一会儿
    window.setTimeout(() => {
      // 动画遮罩
      gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0, delay: 1 });

      // 更新加载条元素
      loadingBarElement.classList.add("ended");
      loadingBarElement.style.transform = "";
    }, 500);

    window.setTimeout(() => {
      sceneReady = true;
    }, 2000);
  },

  // 进度
  (itemUrl, itemsLoaded, itemsTotal) => {
    // 计算进度并更新加载条元素
    const progressRatio = itemsLoaded / itemsTotal;
    loadingBarElement.style.transform = `scaleX(${progressRatio})`;
  },
);
const gltfLoader = new GLTFLoader(loadingManager);
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

/**
 * 基础
 */
// 调试
const debugObject = {};

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

/**
 * 遮罩
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
  // wireframe: true,
  transparent: true,
  uniforms: {
    uAlpha: { value: 1 },
  },
  vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
  fragmentShader: `
        uniform float uAlpha;

        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `,
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

/**
 * 更新所有材质
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      // child.material.envMap = environmentMap
      child.material.envMapIntensity = debugObject.envMapIntensity;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * 环境贴图
 */
const environmentMap = cubeTextureLoader.load([
  "/assets/48-mixing-html-and-webgl-final/textures/environmentMaps/0/px.jpg",
  "/assets/48-mixing-html-and-webgl-final/textures/environmentMaps/0/nx.jpg",
  "/assets/48-mixing-html-and-webgl-final/textures/environmentMaps/0/py.jpg",
  "/assets/48-mixing-html-and-webgl-final/textures/environmentMaps/0/ny.jpg",
  "/assets/48-mixing-html-and-webgl-final/textures/environmentMaps/0/pz.jpg",
  "/assets/48-mixing-html-and-webgl-final/textures/environmentMaps/0/nz.jpg",
]);

environmentMap.colorSpace = THREE.SRGBColorSpace;

scene.background = environmentMap;
scene.environment = environmentMap;

debugObject.envMapIntensity = 2.5;

/**
 * 调试
 */
const gui = new GUI();
gui
  .add(debugObject, "envMapIntensity")
  .min(0)
  .max(5)
  .step(0.1)
  .name("环境贴图强度")
  .onChange(updateAllMaterials);

/**
 * 模型
 */
gltfLoader.load(
  "/assets/48-mixing-html-and-webgl-final/models/DamagedHelmet/glTF/DamagedHelmet.gltf",
  (gltf) => {
    gltf.scene.scale.set(2.5, 2.5, 2.5);
    gltf.scene.rotation.y = Math.PI * 0.5;
    scene.add(gltf.scene);

    updateAllMaterials();
  },
);

/**
 * 兴趣点
 */
const raycaster = new THREE.Raycaster();
const points = [
  {
    position: new THREE.Vector3(1.55, 0.3, -0.6),
    element: document.querySelector(".point-0"),
  },
  {
    position: new THREE.Vector3(0.5, 0.8, -1.6),
    element: document.querySelector(".point-1"),
  },
  {
    position: new THREE.Vector3(1.6, -1.3, -0.7),
    element: document.querySelector(".point-2"),
  },
];

/**
 * 灯光
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 3, -2.25);
scene.add(directionalLight);

/**
 * 尺寸
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * 相机
 */
// 基础相机
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(4, 1, -4);
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
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

gui.add(renderer, "toneMappingExposure").min(0).max(10).step(0.1).name("色调映射曝光度");

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
 * 动画循环
 */
const tick = () => {
  // 更新控制器
  controls.update();

  // 仅在场景就绪时更新粒子
  if (sceneReady) {
    // 遍历每个点
    for (const point of points) {
      // 获取 2D 屏幕位置
      const screenPosition = point.position.clone();
      screenPosition.project(camera);

      // 设置射线投射
      raycaster.setFromCamera(screenPosition, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // 未找到相交
      if (intersects.length === 0) {
        // 显示
        point.element.classList.add("visible");
      }

      // 找到相交
      else {
        // 获取交点距离和点的距离
        const intersectionDistance = intersects[0].distance;
        const pointDistance = point.position.distanceTo(camera.position);

        // 交点比点更近
        if (intersectionDistance < pointDistance) {
          // 隐藏
          point.element.classList.remove("visible");
        }
        // 交点比点更远
        else {
          // 显示
          point.element.classList.add("visible");
        }
      }

      const translateX = screenPosition.x * sizes.width * 0.5;
      const translateY = -screenPosition.y * sizes.height * 0.5;
      point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
    }
  }

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
