import * as THREE from 'three/webgpu';
import { normalView, positionView, positionWorld, uv, uniform, sin, mix, color, smoothstep } from 'three/tsl';
import { createStage, anvil, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage(); anvil(app.scene);
  const clock = uniform(0), power = uniform(3), hit = uniform(new THREE.Vector3(0, 2.5, 0));
  const impactAge = uniform(20);
  // 视线与法线在同一个 view 坐标空间中做点积。
  const viewDirection = positionView.negate().normalize();
  const rim = normalView.dot(viewDirection).abs().oneMinus().pow(power);
  const lines = sin(uv().y.mul(90).add(clock.mul(2))).abs().pow(18);
  const distance = positionWorld.distance(hit);
  const ring = distance.sub(impactAge.mul(2)).abs();
  const impact = smoothstep(0, 0.16, ring).oneMinus().mul(impactAge.mul(0.65).oneMinus().max(0));
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  material.colorNode = mix(color('#7044ff'), color('#ffbd64'), rim).mul(rim.mul(3).add(0.6)).add(impact.mul(4));
  material.opacityNode = rim.mul(0.8).add(lines.mul(0.12)).add(impact).clamp(0, 1);
  const shield = new THREE.Mesh(new THREE.SphereGeometry(2.7, 64, 48), material);
  shield.position.y = 0.35; app.scene.add(shield);
  const raycaster = new THREE.Raycaster();
  app.renderer.domElement.addEventListener('pointerdown', (event) => {
    raycaster.setFromCamera(new THREE.Vector2(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2), app.camera);
    const result = raycaster.intersectObject(shield)[0];
    if (result) { hit.value.copy(result.point); impactAge.value = 0; }
  });
  app.gui.add(power, 'value', 1, 8, 0.1).name('边缘集中程度');
  app.notice(`${app.gpu ? 'WebGPU' : 'WebGL 2 回退'} · 点击护盾生成冲击波，拖动旋转`);
  app.animate((seconds, dt) => { clock.value = seconds; impactAge.value += dt; });
}
main().catch(showError);
