import * as THREE from 'three/webgpu';
import { uv, vec3, normalWorld, positionLocal, mix, color } from 'three/tsl';
import { createStage, mascot, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage();
  const material = new THREE.MeshBasicNodeMaterial();
  const modes = {
    'UV 坐标': vec3(uv(), 0),
    '世界法线': normalWorld.mul(0.5).add(0.5),
    '局部位置': positionLocal.mul(0.5).add(0.5),
    '黑白遮罩': vec3(uv().y.step(0.5)),
    '最终颜色': mix(color('#494eff'), color('#ff9a6a'), uv().y),
  };
  const parameters = { mode: 'UV 坐标', wireframe: false };
  material.colorNode = modes[parameters.mode];
  mascot(app.scene, material);
  app.gui.add(parameters, 'mode', Object.keys(modes)).name('观察 GPU 的输入').onChange((value) => {
    material.colorNode = modes[value]; material.needsUpdate = true;
  });
  app.gui.add(material, 'wireframe').name('查看三角形');
  // 真正的节点图 Inspector 作为可选工具，不影响默认预览的首次加载。
  const tools = { async inspector() {
    try {
      const { Inspector } = await import('three/addons/inspector/Inspector.js');
      app.renderer.inspector = new Inspector();
      app.notice('Inspector 已开启；若面板被 iframe 裁切，请单独打开预览。');
    } catch (error) { showError(error); }
  } };
  app.gui.add(tools, 'inspector').name('打开官方 Inspector');
}
main().catch(showError);
