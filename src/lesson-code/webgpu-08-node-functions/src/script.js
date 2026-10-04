import * as THREE from 'three/webgpu';
import { Fn, length, fract, smoothstep, positionWorld, uniform, mix, color } from 'three/tsl';
import { createStage, mascot, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage({ floor: false });
  const clock = uniform(0), frequency = uniform(2);
  // JS 普通函数复用节点表达式；Fn 允许增加 GPU 语句和局部变量。
  const rings = Fn(([point, density, phase]) => {
    const radius = length(point).toVar();
    return smoothstep(0.42, 0.48, fract(radius.mul(density).sub(phase)));
  });
  const floorMaterial = new THREE.MeshBasicNodeMaterial();
  floorMaterial.colorNode = mix(color('#101119'), color('#b1b4ff'), rings(positionWorld.xz, frequency, clock));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), floorMaterial);
  ground.rotation.x = -Math.PI / 2; app.scene.add(ground);
  mascot(app.scene, new THREE.MeshStandardNodeMaterial({ color: '#afbfff', roughness: 0.2 }));
  app.gui.add(frequency, 'value', 0.5, 5, 0.1).name('环密度');
  app.animate((seconds) => { clock.value = seconds * 0.3; });
}
main().catch(showError);
