import * as THREE from 'three/webgpu';
import { instancedBufferAttribute, uv, uniform, vec3, sin, cos, mix, color, smoothstep, pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { createStage, seededRandom, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage({ floor: false, background: '#03040a', camera: [0, 5, 7], target: [0, 0, 0] });
  const count = 18000, random = seededRandom(), data = new Float32Array(count * 3);
  // 三个分量保存 radius、armAngle、height，而不是最终 xyz。
  for (let i = 0; i < count; i++) {
    data[i * 3] = Math.pow(random(), 1.6) * 4;
    data[i * 3 + 1] = i % 4 / 4 * Math.PI * 2 + (random() - 0.5) * 0.7;
    data[i * 3 + 2] = (random() - 0.5) * 0.2;
  }
  const seed = instancedBufferAttribute(new THREE.InstancedBufferAttribute(data, 3));
  const clock = uniform(0), twist = uniform(1.8), size = uniform(0.028);
  const radius = seed.x, angle = seed.y.add(radius.mul(twist)).add(clock.mul(0.25).div(radius.add(0.3)));
  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  material.positionNode = vec3(cos(angle).mul(radius), seed.z, sin(angle).mul(radius));
  material.colorNode = mix(color('#ffe4b5').mul(2), color('#799dff'), radius.div(4));
  material.scaleNode = size;
  material.opacityNode = smoothstep(0, 0.5, uv().sub(0.5).length()).oneMinus().pow(2);
  const stars = new THREE.Sprite(material); stars.count = count; stars.frustumCulled = false; app.scene.add(stars);
  const pipeline = new THREE.RenderPipeline(app.renderer), scenePass = pass(app.scene, app.camera);
  const output = scenePass.getTextureNode('output'), glow = bloom(output, 0.4, 0.2, 0.8);
  pipeline.outputNode = output.add(glow); app.postProcessing(pipeline);
  app.gui.add(twist, 'value', 0, 4, 0.01).name('旋臂缠绕'); app.gui.add(size, 'value', 0.01, 0.08, 0.001).name('恒星尺寸');
  app.animate((seconds) => { clock.value = seconds; });
  app.track(scenePass, glow);
}
main().catch(showError);
