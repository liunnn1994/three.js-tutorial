import * as THREE from 'three/webgpu';
import { Fn, vec3, positionLocal, reference } from 'three/tsl';
import { createStage, createStudyShape, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage();
  const parameters = { offset: 0.5 };
  const offset = reference('offset', 'float', parameters);
  const material = new THREE.MeshStandardNodeMaterial();
  material.colorNode = Fn(() => {
    // .toVar 创建 GPU 局部变量，assign 在 Fn 的语句栈中工作。
    const tint = positionLocal.mul(0.5).add(0.5).toVar();
    tint.x.assign(tint.x.add(offset).fract());
    return vec3(tint);
  })();
  createStudyShape(app.scene, material);
  app.scene.add(new THREE.AxesHelper(3));
  app.gui.add(parameters, 'offset', 0, 1, 0.01).name('引用对象的 offset');
}
main().catch(showError);
