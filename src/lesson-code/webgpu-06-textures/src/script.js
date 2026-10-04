import * as THREE from 'three/webgpu';
import { texture, uv, uniform } from 'three/tsl';
import { createStage, mascot, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage();
  // 自制 UV 测试纹理，不下载付费课程素材。
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    context.fillStyle = `hsl(${x * 45},60%,${y % 2 ? 38 : 60}%)`;
    context.fillRect(x * 64, y * 64, 64, 64);
    context.fillStyle = '#ffffff'; context.font = '18px monospace'; context.fillText(`${x},${y}`, x * 64 + 10, y * 64 + 35);
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const repeat = uniform(1), shift = uniform(0);
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.6 });
  material.colorNode = texture(map, uv().mul(repeat).add(shift)).rgb;
  mascot(app.scene, material);
  app.gui.add(repeat, 'value', 1, 4, 0.1).name('UV 重复');
  app.gui.add(shift, 'value', 0, 1, 0.01).name('UV 偏移');
  app.track(map);
}
main().catch(showError);
