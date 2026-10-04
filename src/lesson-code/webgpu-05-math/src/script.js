import * as THREE from 'three/webgpu';
import { uv, uniform, sin, fract, smoothstep, mix, color, vec3 } from 'three/tsl';
import { createStage, mascot, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage();
  const frequency = uniform(8), clock = uniform(0);
  const p = uv().mul(frequency);
  const wave = sin(p.x.add(clock)).mul(0.5).add(0.5);
  const bands = smoothstep(0.35, 0.65, fract(p.y.add(wave)));
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.4 });
  material.colorNode = mix(color('#172889'), color('#fa785a'), bands);
  const character = mascot(app.scene, material);
  const graph = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicNodeMaterial());
  graph.material.colorNode = vec3(wave); graph.position.set(-2.5, 1.3, 0); app.scene.add(graph);
  app.gui.add(frequency, 'value', 1, 24, 1).name('频率');
  app.animate((seconds) => { clock.value = seconds; character.rotation.y = seconds * 0.15; });
}
main().catch(showError);
