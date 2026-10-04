import * as THREE from 'three/webgpu';
import { color } from 'three/tsl';
import { createStage, createStudyShape, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage();
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.3 });
  material.colorNode = color('#a6baff');
  const shape = createStudyShape(app.scene, material);
  const parameters = { rotate: true };
  app.gui.add(parameters, 'rotate').name('环体旋转');
  app.animate((seconds) => { if (parameters.rotate) shape.rotation.y = seconds * 0.3; });
}
main().catch(showError);
