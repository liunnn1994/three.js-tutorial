import * as THREE from 'three/webgpu';
import { attribute, positionLocal, vec3, sin, uniform, mix, color } from 'three/tsl';
import { createStage, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage({ camera: [6, 4, 8] });
  const count = 225, clock = uniform(0), amplitude = uniform(0.45);
  const geometry = new THREE.BoxGeometry(0.35, 1, 0.35, 1, 8, 1);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) phases[i] = i / count * Math.PI * 8;
  geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
  const phase = attribute('aPhase', 'float');
  const height = sin(phase.add(clock)).mul(amplitude).add(1.2);
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.4 });
  material.positionNode = vec3(positionLocal.x, positionLocal.y.add(0.5).mul(height), positionLocal.z);
  material.colorNode = mix(color('#8a9dff'), color('#ffc999'), sin(phase).mul(0.5).add(0.5));
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const transform = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    transform.position.set((i % 15 - 7) * 0.48, 0, (Math.floor(i / 15) - 7) * 0.48);
    transform.updateMatrix(); mesh.setMatrixAt(i, transform.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  // 顶点位移会越过默认包围盒，教学示例关闭剔除避免突然消失。
  mesh.frustumCulled = false; app.scene.add(mesh);
  app.gui.add(amplitude, 'value', 0, 1, 0.01).name('柱子起伏幅度');
  app.animate((seconds) => { clock.value = seconds; });
}
main().catch(showError);
