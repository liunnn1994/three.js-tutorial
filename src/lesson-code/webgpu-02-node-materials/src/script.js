import * as THREE from 'three/webgpu';
import { uv, color, mix, floor, uniform, vec2 } from 'three/tsl';
import { createStage, createStudyShape, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage();
  // UV 是贴在表面上的二维坐标；两个方向交替得到棋盘格。
  const density = uniform(12);
  const cell = floor(uv().mul(vec2(4, 1)).mul(density));
  const checker = cell.x.add(cell.y).mod(2);
  const basic = new THREE.MeshBasicNodeMaterial();
  basic.colorNode = mix(color('#180d17'), color('#ff2449'), checker);
  const standard = new THREE.MeshStandardNodeMaterial({ roughness: 0.25, metalness: 0.15 });
  standard.colorNode = basic.colorNode;
  app.track(basic, standard);
  const shape = createStudyShape(app.scene, standard);
  app.gui.add(density, 'value', 2, 24, 1).name('格子密度');
  const parameters = { lit: true };
  app.gui.add(parameters, 'lit').name('启用光照材质').onChange((value) => {
    shape.material = value ? standard : basic;
  });
  app.animate((seconds) => { shape.rotation.y = seconds * 0.2; });
}
main().catch(showError);
