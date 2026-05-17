import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import GUI from "lil-gui";
import slicedVertexShader from "./shaders/sliced/vertex.glsl";
import slicedFragmentShader from "./shaders/sliced/fragment.glsl";

/**
 * 基础
 */
// 调试
const gui = new GUI({ width: 325 });
const debugObject = {};

// 画布
const canvas = document.querySelector("canvas.webgl");

// 场景
const scene = new THREE.Scene();

// 加载器
const rgbeLoader = new RGBELoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/assets/43-sliced-model-shader-final/draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * 环境贴图
 */
rgbeLoader.load(
  "/assets/43-sliced-model-shader-final/aerodynamics_workshop.hdr",
  (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping;

    scene.background = environmentMap;
    scene.backgroundBlurriness = 0.5;
    scene.environment = environmentMap;
  },
);

/**
 * 切片模型
 */
// 材质
const uniforms = {
  uSliceStart: new THREE.Uniform(1.75),
  uSliceArc: new THREE.Uniform(1.25),
};

gui.add(uniforms.uSliceStart, "value", -Math.PI, Math.PI, 0.001).name("切片起始角");
gui.add(uniforms.uSliceArc, "value", 0, Math.PI * 2, 0.001).name("切片弧度");

const patchMap = {
  csm_Slice: {
    "#include <colorspace_fragment>": `
            #include <colorspace_fragment>

            if(!gl_FrontFacing)
                gl_FragColor = vec4(0.75, 0.15, 0.3, 1.0);
        `,
  },
};

const material = new THREE.MeshStandardMaterial({
  metalness: 0.5,
  roughness: 0.25,
  envMapIntensity: 0.5,
  color: "#858080",
});

const slicedMaterial = new CustomShaderMaterial({
  // CSM（级联阴影贴图）
  baseMaterial: THREE.MeshStandardMaterial,
  vertexShader: slicedVertexShader,
  fragmentShader: slicedFragmentShader,
  uniforms: uniforms,
  patchMap: patchMap,
  silent: true,

  // MeshStandardMaterial 材质
  metalness: 0.5,
  roughness: 0.25,
  envMapIntensity: 0.5,
  color: "#858080",
  side: THREE.DoubleSide,
});

const slicedDepthMaterial = new CustomShaderMaterial({
  // CSM（级联阴影贴图）
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader: slicedVertexShader,
  fragmentShader: slicedFragmentShader,
  uniforms: uniforms,
  patchMap: patchMap,
  silent: true,

  // MeshDepthMaterial 材质
  depthPacking: THREE.RGBADepthPacking,
});

// 模型
let model = null;
gltfLoader.load("/assets/43-sliced-model-shader-final/gears.glb", (gltf) => {
  model = gltf.scene;

  model.traverse((child) => {
    if (child.isMesh) {
      if (child.name === "outerHull") {
        child.material = slicedMaterial;
        child.customDepthMaterial = slicedDepthMaterial;
      } else {
        child.material = material;
      }

      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);
});

/**
 * 平面
 */
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 10),
  new THREE.MeshStandardMaterial({ color: "#aaaaaa" }),
);
plane.receiveShadow = true;
plane.position.x = -4;
plane.position.y = -3;
plane.position.z = -4;
plane.lookAt(new THREE.Vector3(0, 0, 0));
scene.add(plane);

/**
 * 灯光
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 4);
directionalLight.position.set(6.25, 3, 4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.normalBias = 0.05;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.right = 8;
directionalLight.shadow.camera.bottom = -8;
directionalLight.shadow.camera.left = -8;
scene.add(directionalLight);

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
camera.position.set(-5, 5, 12);
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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * 动画循环
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // 更新模型
  if (model) model.rotation.y = elapsedTime * 0.1;

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
