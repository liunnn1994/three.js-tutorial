import * as THREE from 'three/webgpu';
import { pass, uv, sin, uniform, mix, color, vec3 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { createStage, anvil, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage();
  anvil(app.scene);
  const clock = uniform(0);
  const material = new THREE.MeshBasicNodeMaterial();
  const lattice = sin(uv().x.mul(40)).abs().lessThan(0.08).or(sin(uv().y.mul(24)).abs().lessThan(0.08));
  material.colorNode = mix(color('#020309'), color('#ff993c').mul(5), lattice);
  material.opacityNode = lattice.select(0.9, 0.06);
  material.transparent = true; material.depthWrite = false;
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 2), material);
  shell.position.y = 0.8; app.scene.add(shell);
  // RenderPipeline 替换旧教程中的 EffectComposer。
  const pipeline = new THREE.RenderPipeline(app.renderer);
  const scenePass = pass(app.scene, app.camera);
  const sceneColor = scenePass.getTextureNode('output');
  const glow = bloom(sceneColor, 0.7, 0.35, 1);
  pipeline.outputNode = sceneColor.add(glow);
  app.postProcessing(pipeline);
  app.gui.add(glow.strength, 'value', 0, 2, 0.01).name('Bloom 强度');
  app.gui.add(glow.threshold, 'value', 0, 3, 0.01).name('发光阈值');
  app.animate((seconds) => { clock.value = seconds; shell.rotation.y = seconds * 0.08; });
  app.track(scenePass, glow);
}
main().catch(showError);
