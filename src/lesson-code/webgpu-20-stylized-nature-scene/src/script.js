import * as THREE from 'three/webgpu';
import { positionLocal, positionWorld, attribute, uniform, sin, cos, vec3, mix, color, smoothstep } from 'three/tsl';
import { createStage, anvil, seededRandom, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage({ floor: false, background: '#392633', camera: [7, 5, 8], target: [0, 0.7, 0] });
  const clock = uniform(0), wind = uniform(0.18);
  const terrainHeight = (p) => sin(p.x.mul(0.65)).mul(cos(p.z.mul(0.5))).mul(0.35);
  const riverDistance = positionWorld.x.sub(sin(positionWorld.z.mul(0.7)).mul(1.3)).abs();
  const grassMask = smoothstep(0.65, 0.9, riverDistance);
  const groundMaterial = new THREE.MeshStandardNodeMaterial({ roughness: 1 });
  groundMaterial.positionNode = positionLocal.add(vec3(0, terrainHeight(positionLocal), 0));
  groundMaterial.colorNode = mix(color('#bc8096'), color('#518238'), grassMask);
  const geometry = new THREE.PlaneGeometry(10, 10, 128, 128); geometry.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(geometry, groundMaterial); app.scene.add(ground);
  const riverMaterial = new THREE.MeshStandardNodeMaterial({ color: '#8ac0cc', roughness: 0.2, metalness: 0.25 });
  riverMaterial.colorNode = mix(color('#285969'), color('#d1e9ea'), sin(positionWorld.z.mul(10).add(clock)).mul(0.5).add(0.5));
  const river = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), riverMaterial); river.rotation.x = -Math.PI / 2; river.position.y = -0.3; app.scene.add(river);
  // 让河道真正低于两岸，而非在地面上贴一条颜色。
  groundMaterial.positionNode = positionLocal.add(vec3(0, terrainHeight(positionLocal).sub(grassMask.oneMinus().mul(0.55)), 0));
  const random = seededRandom(20), points = [];
  for (let i = 0; i < 7000; i++) {
    const x = (random() - 0.5) * 9.8, z = (random() - 0.5) * 9.8;
    if (Math.abs(x - Math.sin(z * 0.7) * 1.3) < 1) continue;
    if (Math.hypot(x - 2, z) < 1.7) continue;
    points.push([x, Math.sin(x * 0.65) * Math.cos(z * 0.5) * 0.35, z]);
  }
  const blade = new THREE.PlaneGeometry(0.045, 0.5, 1, 4); blade.translate(0, 0.25, 0);
  const phases = new Float32Array(points.length); for (let i = 0; i < phases.length; i++) phases[i] = random() * 6.28;
  blade.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
  const phase = attribute('aPhase', 'float');
  const grassMaterial = new THREE.MeshStandardNodeMaterial({ side: THREE.DoubleSide, roughness: 1 });
  const tip = positionLocal.y.div(0.5);
  grassMaterial.positionNode = positionLocal.add(vec3(sin(clock.mul(2).add(phase)).mul(tip.pow(2)).mul(wind), 0, 0));
  grassMaterial.colorNode = mix(color('#274a1e'), color('#b2c96b'), tip);
  const grass = new THREE.InstancedMesh(blade, grassMaterial, points.length), transform = new THREE.Object3D();
  points.forEach((point, i) => { transform.position.set(...point); transform.rotation.y = phases[i]; transform.scale.setScalar(0.6 + random() * 0.8); transform.updateMatrix(); grass.setMatrixAt(i, transform.matrix); });
  grass.instanceMatrix.needsUpdate = true; grass.frustumCulled = false; app.scene.add(grass);
  const model = anvil(app.scene); model.position.set(2, 0.25, 0); model.scale.setScalar(0.7);
  app.gui.add(wind, 'value', 0, 0.5, 0.01).name('草叶风力');
  app.animate((seconds) => { clock.value = seconds; });
}
main().catch(showError);
