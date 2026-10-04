import * as THREE from 'three/webgpu';
import { uv, positionLocal, texture, uniform, vec2, vec3, smoothstep, sin } from 'three/tsl';
import { createStage, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage({ camera: [4, 2.6, 5], target: [0, 1.7, 0] });
  const cupMaterial = new THREE.MeshStandardNodeMaterial({ color: '#29242b', roughness: 0.35 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.5, 1, 48, 1, true), cupMaterial);
  cup.position.y = 0.5; cup.material.side = THREE.DoubleSide; app.scene.add(cup);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.09, 12, 32), cupMaterial);
  handle.position.set(0.72, 0.55, 0); app.scene.add(handle);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.61, 48), new THREE.MeshStandardNodeMaterial({ color: '#3b1c09', roughness: 0.23 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.91; app.scene.add(coffee);
  // 与已有 GLSL 咖啡课共用本地噪声纹理。它是数据，保持 NoColorSpace。
  const noise = await new THREE.TextureLoader().loadAsync('/assets/32-coffee-smoke-shader-final/perlin.png');
  noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
  const clock = uniform(0), strength = uniform(0.32);
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const sampleUV = vec2(uv().x.mul(1.8), uv().y.mul(1.2).sub(clock.mul(0.18)));
  const density = texture(noise, sampleUV).r;
  const side = smoothstep(0, 0.2, uv().x).mul(smoothstep(0, 0.2, uv().x.oneMinus()));
  const height = smoothstep(0, 0.12, uv().y).mul(smoothstep(0, 0.55, uv().y.oneMinus()));
  material.colorNode = vec3(0.8, 0.78, 0.75);
  material.opacityNode = smoothstep(0.25, 0.85, density).mul(side).mul(height).mul(strength);
  const bend = sin(positionLocal.y.mul(2).sub(clock)).mul(uv().y.pow(2)).mul(0.45);
  material.positionNode = positionLocal.add(vec3(bend, 0, bend.mul(0.4)));
  const smoke = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.6, 32, 64), material);
  smoke.position.y = 2.75; app.scene.add(smoke);
  app.gui.add(strength, 'value', 0, 1, 0.01).name('烟雾浓度');
  app.animate((seconds) => { clock.value = seconds; });
  app.track(noise);
}
main().catch(showError);
