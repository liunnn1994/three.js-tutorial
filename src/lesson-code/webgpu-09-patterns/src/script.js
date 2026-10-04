import * as THREE from 'three/webgpu';
import { uv, uniform, sin, cos, length, smoothstep, mix, color, vec2 } from 'three/tsl';
import { createStage, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage({ camera: [0, 1.7, 5], target: [0, 1.3, 0] });
  const clock = uniform(0), density = uniform(7);
  const p = uv().mul(density);
  const cell = p.floor();
  // 每个格子中有一个动点；邻近格子搜索产生连续的细胞距离场。
  let nearest = p.mul(0).add(10).x;
  for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
    const id = cell.add(vec2(x, y));
    const phase = sin(id.x.mul(127.1).add(id.y.mul(311.7))).mul(43758.5453).fract().mul(Math.PI * 2);
    const center = id.add(vec2(sin(phase.add(clock)), cos(phase.mul(1.3).add(clock))).mul(0.3).add(0.5));
    nearest = nearest.min(length(p.sub(center)));
  }
  const glow = smoothstep(0.08, 0.45, nearest).oneMinus();
  const core = smoothstep(0, 0.2, nearest).oneMinus();
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = mix(color('#050b43'), color('#ff6545').mul(2), glow).add(core.mul(1.4));
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), material);
  plane.position.y = 1.6; app.scene.add(plane);
  app.gui.add(density, 'value', 2, 15, 1).name('细胞密度');
  app.animate((seconds) => { clock.value = seconds * 0.7; });
}
main().catch(showError);
