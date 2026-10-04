import * as THREE from 'three/webgpu';
import { Fn, If, instancedArray, instanceIndex, uniform, vec3, positionLocal, mix, color, pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { createStage, seededRandom, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage({ floor: false, camera: [0, 2, 8], target: [0, 0, 0] });
  if (!app.gpu) {
    app.notice('这节使用真正的 GPU compute，需要 WebGPU。请在支持 WebGPU 的浏览器中通过 localhost / HTTPS 打开；不以 CPU 动画替代。');
    return;
  }
  const count = 4096, random = seededRandom(19), initial = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = random() * Math.PI * 2, z = random() * 2 - 1, r = Math.cbrt(random()) * 2;
    initial[i * 3] = Math.cos(a) * Math.sqrt(1 - z * z) * r;
    initial[i * 3 + 1] = z * r;
    initial[i * 3 + 2] = Math.sin(a) * Math.sqrt(1 - z * z) * r;
  }
  const positions = instancedArray(initial, 'vec3'), velocities = instancedArray(count, 'vec3');
  const fixedStep = 1 / 120;
  const delta = uniform(fixedStep), attraction = uniform(1.6), radius = uniform(2.5);
  let accumulated = 0;
  const pointer = uniform(new THREE.Vector3());
  // 每个调用仅写自己的槽位：没有同时读写邻居的竞争。
  const compute = Fn(() => {
    const p = positions.element(instanceIndex), v = velocities.element(instanceIndex);
    const relative = p.sub(pointer).toVar();
    const distance = relative.length().max(0.05);
    const outward = relative.div(distance);
    const repel = outward.mul(distance.mul(-1).add(1.7).max(0)).mul(6);
    const swirl = vec3(relative.y.negate(), relative.x, relative.z.mul(0.2)).mul(0.9);
    const force = pointer.sub(p).mul(attraction).add(repel).add(swirl);
    v.addAssign(force.mul(delta));
    v.mulAssign(delta.mul(-1.8).exp());
    p.addAssign(v.mul(delta));
    If(p.length().greaterThan(radius), () => {
      const normal = p.normalize().toVar();
      p.assign(normal.mul(radius));
      // 只反射朝外的速度，避免粒子在边界抖动。
      If(v.dot(normal).greaterThan(0), () => { v.subAssign(normal.mul(v.dot(normal)).mul(1.8)); });
    });
  })().compute(count).setName('Sphere physics');
  // 实例小球有真实表面和光照，与第 15 课的平面精灵不同。
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.4 });
  material.positionNode = positionLocal.add(positions.toAttribute());
  const energy = velocities.toAttribute().length().mul(0.6).clamp(0, 1);
  material.colorNode = mix(color('#646bba'), color('#ff982a'), energy);
  material.emissiveNode = color('#ff6518').mul(energy.pow(2)).mul(2.5);
  const particles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), material, count);
  const identity = new THREE.Matrix4();
  for (let i = 0; i < count; i++) particles.setMatrixAt(i, identity);
  particles.instanceMatrix.needsUpdate = true;
  particles.frustumCulled = false; app.scene.add(particles);
  const raycaster = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  app.renderer.domElement.addEventListener('pointermove', (event) => {
    raycaster.setFromCamera(new THREE.Vector2(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2), app.camera);
    raycaster.ray.intersectPlane(plane, pointer.value);
    pointer.value.clampLength(0, 1.6);
  });
  const reset = Fn(() => { positions.element(instanceIndex).assign(positions.element(instanceIndex).normalize().mul(2)); velocities.element(instanceIndex).assign(vec3(0)); })().compute(count);
  app.gui.add(attraction, 'value', 0.1, 6, 0.1).name('吸引强度');
  app.gui.add({ reset() { accumulated = 0; app.renderer.compute(reset); } }, 'reset').name('重置到球壳');
  const pipeline = new THREE.RenderPipeline(app.renderer), scenePass = pass(app.scene, app.camera);
  const output = scenePass.getTextureNode('output'), glow = bloom(output, 0.4, 0.25, 1);
  pipeline.outputNode = output.add(glow); app.postProcessing(pipeline);
  app.animate((seconds, dt) => {
    // 正常低帧率补做多次小步；严重卡顿最多追赶 0.25 秒，避免持续积压。
    accumulated += Math.min(dt, 0.25);
    while (accumulated + 1e-10 >= fixedStep) {
      app.renderer.compute(compute);
      accumulated = Math.max(0, accumulated - fixedStep);
    }
  });
  app.track(scenePass, glow);
}
main().catch(showError);
