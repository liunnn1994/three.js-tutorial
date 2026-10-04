import * as THREE from 'three/webgpu';
import { instancedBufferAttribute, uv, uniform, vec3, sin, smoothstep } from 'three/tsl';
import { createStage, seededRandom, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage({ floor: false, camera: [4, 2.5, 6] });
  const count = 12000, random = seededRandom(), data = new Float32Array(count * 3), hues = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    data[i * 3] = (random() - 0.5) * 4; data[i * 3 + 1] = random() * 3; data[i * 3 + 2] = (random() - 0.5) * 2;
    hues[i * 3] = random(); hues[i * 3 + 1] = random(); hues[i * 3 + 2] = random();
  }
  const positions = instancedBufferAttribute(new THREE.InstancedBufferAttribute(data, 3));
  const colors = instancedBufferAttribute(new THREE.InstancedBufferAttribute(hues, 3));
  const clock = uniform(0), size = uniform(0.035);
  const material = new THREE.SpriteNodeMaterial({ depthWrite: false, transparent: true });
  material.positionNode = positions.add(vec3(sin(positions.y.add(clock)).mul(0.12), 0, 0));
  material.colorNode = colors;
  material.scaleNode = size;
  material.opacityNode = smoothstep(0.05, 0.5, uv().sub(0.5).length()).oneMinus();
  const sprites = new THREE.Sprite(material); sprites.count = count; sprites.frustumCulled = false; app.scene.add(sprites);
  app.gui.add(size, 'value', 0.01, 0.1, 0.001).name('精灵世界尺寸');
  app.animate((seconds) => { clock.value = seconds; });
}
main().catch(showError);
