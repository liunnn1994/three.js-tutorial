import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GUI from "lil-gui";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { DotScreenPass } from "three/examples/jsm/postprocessing/DotScreenPass.js";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";

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
 * 加载器
 */
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
const textureLoader = new THREE.TextureLoader();

/**
 * 更新所有材质
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      child.material.envMapIntensity = 2.5;
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
  "/assets/45-post-processing-final/textures/environmentMaps/0/px.jpg",
  "/assets/45-post-processing-final/textures/environmentMaps/0/nx.jpg",
  "/assets/45-post-processing-final/textures/environmentMaps/0/py.jpg",
  "/assets/45-post-processing-final/textures/environmentMaps/0/ny.jpg",
  "/assets/45-post-processing-final/textures/environmentMaps/0/pz.jpg",
  "/assets/45-post-processing-final/textures/environmentMaps/0/nz.jpg",
]);
environmentMap.colorSpace = THREE.SRGBColorSpace;

scene.background = environmentMap;
scene.environment = environmentMap;

/**
 * 模型
 */
gltfLoader.load(
  "/assets/45-post-processing-final/models/DamagedHelmet/glTF/DamagedHelmet.gltf",
  (gltf) => {
    gltf.scene.scale.set(2, 2, 2);
    gltf.scene.rotation.y = Math.PI * 0.5;
    scene.add(gltf.scene);

    updateAllMaterials();
  },
);

/**
 * 灯光
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
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

  // 更新效果合成器
  effectComposer.setSize(sizes.width, sizes.height);
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * 后处理
 */
const renderTarget = new THREE.WebGLRenderTarget(800, 600, {
  samples: 2,
});

// 效果合成器
const effectComposer = new EffectComposer(renderer, renderTarget);
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
effectComposer.setSize(sizes.width, sizes.height);

// 渲染通道
const renderPass = new RenderPass(scene, camera);
effectComposer.addPass(renderPass);

// 点阵屏幕通道
const dotScreenPass = new DotScreenPass();
dotScreenPass.enabled = false;
effectComposer.addPass(dotScreenPass);

// 故障通道
const glitchPass = new GlitchPass();
glitchPass.goWild = true;
glitchPass.enabled = false;
effectComposer.addPass(glitchPass);

// RGB 偏移通道
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.enabled = false;
effectComposer.addPass(rgbShiftPass);

// 伽马校正通道（旧方式，已替换为 OutputPass）
// const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
// effectComposer.addPass(gammaCorrectionPass);

// OutputPass — 色彩空间转换（替代 GammaCorrectionShader，必须放在管线末尾）
const outputPass = new OutputPass();
effectComposer.addPass(outputPass);

// SSAO — 屏幕空间环境光遮蔽（在角落和缝隙处添加柔和阴影）
const ssaoPass = new SSAOPass(scene, camera, sizes.width, sizes.height);
ssaoPass.kernelRadius = 16;
ssaoPass.minDistance = 0.005;
ssaoPass.maxDistance = 0.1;
ssaoPass.enabled = false;
effectComposer.addPass(ssaoPass);

gui.add(ssaoPass, "enabled").name("SSAO 启用");
gui.add(ssaoPass, "kernelRadius").min(1).max(32).step(0.1).name("SSAO 半径");
gui.add(ssaoPass, "minDistance").min(0).max(0.05).step(0.001).name("SSAO 最小距离");
gui.add(ssaoPass, "maxDistance").min(0).max(1).step(0.01).name("SSAO 最大距离");

// 抗锯齿通道
if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) {
  const smaaPass = new SMAAPass();
  effectComposer.addPass(smaaPass);

  console.log("Using SMAA");
}

// 虚幻泛光通道
const unrealBloomPass = new UnrealBloomPass();
unrealBloomPass.enabled = false;
effectComposer.addPass(unrealBloomPass);

unrealBloomPass.strength = 0.3;
unrealBloomPass.radius = 1;
unrealBloomPass.threshold = 0.6;

gui.add(unrealBloomPass, "enabled").name("启用");
gui.add(unrealBloomPass, "strength").min(0).max(2).step(0.001).name("强度");
gui.add(unrealBloomPass, "radius").min(0).max(2).step(0.001).name("半径");
gui.add(unrealBloomPass, "threshold").min(0).max(1).step(0.001).name("阈值");

// 锡通道
const TintShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTint: { value: null },
  },
  vertexShader: `
        varying vec2 vUv;

        void main()
        {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vUv = uv;
        }
    `,
  fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec3 uTint;

        varying vec2 vUv;

        void main()
        {
            vec4 color = texture2D(tDiffuse, vUv);
            color.rgb += uTint;

            gl_FragColor = color;
        }
    `,
};

const tintPass = new ShaderPass(TintShader);
tintPass.material.uniforms.uTint.value = new THREE.Vector3();
effectComposer.addPass(tintPass);

gui.add(tintPass.material.uniforms.uTint.value, "x").min(-1).max(1).step(0.001).name("红色偏移");
gui.add(tintPass.material.uniforms.uTint.value, "y").min(-1).max(1).step(0.001).name("绿色偏移");
gui.add(tintPass.material.uniforms.uTint.value, "z").min(-1).max(1).step(0.001).name("蓝色偏移");

// 置换通道
const DisplacementShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: null },
    uNormalMap: { value: null },
  },
  vertexShader: `
        varying vec2 vUv;

        void main()
        {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vUv = uv;
        }
    `,
  fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform sampler2D uNormalMap;

        varying vec2 vUv;

        void main()
        {
            vec3 normalColor = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
            vec2 newUv = vUv + normalColor.xy * 0.1;
            vec4 color = texture2D(tDiffuse, newUv);

            vec3 lightDirection = normalize(vec3(- 1.0, 1.0, 0.0));
            float lightness = clamp(dot(normalColor, lightDirection), 0.0, 1.0);
            color.rgb += lightness * 2.0;

            gl_FragColor = color;
        }
    `,
};

const displacementPass = new ShaderPass(DisplacementShader);
displacementPass.material.uniforms.uTime.value = 0;
displacementPass.material.uniforms.uNormalMap.value = textureLoader.load(
  "/assets/45-post-processing-final/textures/interfaceNormalMap.png",
);
effectComposer.addPass(displacementPass);

/**
 * 动画循环
 */
const timer = new THREE.Timer();

const tick = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  // 更新通道
  displacementPass.material.uniforms.uTime.value = elapsedTime;

  // 更新控制器
  controls.update();

  // 渲染
  // renderer.render(scene, camera)
  effectComposer.render();

  // 在下一帧再次调用 tick
  window.requestAnimationFrame(tick);
};

tick();
