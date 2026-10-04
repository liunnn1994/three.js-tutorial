import * as THREE from 'three/webgpu';
import { attribute, positionLocal, uniform, sin, mix, color } from 'three/tsl';
import { createStage, createStudyShape, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage();
  const frequency = uniform(9), clock = uniform(0);
  const material = new THREE.MeshStandardNodeMaterial();
  const bands = sin(positionLocal.y.mul(frequency).add(clock)).mul(0.5).add(0.5);
  material.colorNode = mix(color('#326ca3'), color('#ffd58b'), bands).mul(attribute('aTint', 'vec3'));
  const shape = createStudyShape(app.scene, material);
  const position = shape.geometry.attributes.position;
  const data = new Float32Array(position.count * 3);
  // 以实际 X 范围把每个顶点的绿色权重映射到 0.5–1。
  const bounds = shape.geometry.boundingBox;
  const width = bounds.max.x - bounds.min.x;
  for (let i = 0; i < position.count; i++) {
    data[i * 3] = 1;
    data[i * 3 + 1] = 0.5 + (position.getX(i) - bounds.min.x) / width * 0.5;
    data[i * 3 + 2] = 1;
  }
  shape.geometry.setAttribute('aTint', new THREE.BufferAttribute(data, 3));
  app.gui.add(frequency, 'value', 1, 30, 1).name('所有顶点共享的频率');
  app.animate((seconds) => { clock.value = seconds; });
}
main().catch(showError);
