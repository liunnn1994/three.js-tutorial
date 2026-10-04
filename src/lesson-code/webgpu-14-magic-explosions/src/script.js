import * as THREE from 'three/webgpu';
import { positionLocal, uniform, vec3, sin, cos, uv, color, smoothstep } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass } from 'three/tsl';
import { createStage, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage({ camera: [6, 4, 7] });
  const age = uniform(0), duration = 2.4;
  const progress = age.div(duration).clamp(0, 1);
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  // 共享一个 GPU 生命周期，环的相位通过各自的网格缩放和位置区分。
  material.positionNode = positionLocal.mul(progress.mul(2.5).add(0.1));
  material.colorNode = color('#ff73f2').mul(3);
  material.opacityNode = smoothstep(0, 0.08, progress).mul(smoothstep(0.4, 1, progress).oneMinus());
  const rings = new THREE.Group(); app.scene.add(rings);
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65 + i * 0.08, 0.025 + i * 0.004, 8, 96), material);
    ring.rotation.x = Math.PI / 2 + (i % 2 ? 0.15 : -0.15);
    ring.position.y = 0.3 + i * 0.22; rings.add(ring);
  }
  const sparks = new THREE.Group(); app.scene.add(sparks);
  for (let i = 0; i < 40; i++) {
    const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), material);
    const a = i * 2.4; spark.userData.direction = new THREE.Vector3(Math.cos(a), 0.4 + (i % 7) / 6, Math.sin(a)); sparks.add(spark);
  }
  const parameters = { repeat: true, replay() { age.value = 0; } };
  app.gui.add(parameters, 'repeat').name('循环爆炸'); app.gui.add(parameters, 'replay').name('重新触发');
  const pipeline = new THREE.RenderPipeline(app.renderer), scenePass = pass(app.scene, app.camera);
  const output = scenePass.getTextureNode('output'), glow = bloom(output, 0.6, 0.4, 1);
  pipeline.outputNode = output.add(glow); app.postProcessing(pipeline);
  app.animate((seconds, dt) => {
    age.value += dt; if (parameters.repeat && age.value > duration + 0.4) age.value = 0;
    rings.rotation.y = age.value;
    sparks.children.forEach((spark) => spark.position.copy(spark.userData.direction).multiplyScalar(age.value * 1.6));
  });
  app.track(scenePass, glow);
}
main().catch(showError);
