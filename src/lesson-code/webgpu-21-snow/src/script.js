import * as THREE from 'three/webgpu';
import { texture, uv, positionLocal, vec3, mix, color, uniform } from 'three/tsl';
import { createStage, showError } from '../../_webgpu/common.js';
async function main() {
  const app = await createStage({ floor: false, background: '#9ecde4', camera: [5, 5, 6], target: [0, 0, 0] });
  // CanvasTexture 是持久化高度场：GPU 每帧读它，CPU 只在落脚时更新它。
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d'); context.fillStyle = 'black'; context.fillRect(0, 0, 512, 512);
  const heightMap = new THREE.CanvasTexture(canvas); heightMap.colorSpace = THREE.NoColorSpace;
  heightMap.generateMipmaps = false; heightMap.minFilter = THREE.LinearFilter;
  const depth = uniform(0.2), imprint = texture(heightMap, uv()).r;
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.9 });
  // 几何体旋转后 local.y 就是世界的向上方向。
  material.positionNode = positionLocal.add(vec3(0, imprint.mul(depth).negate(), 0));
  material.colorNode = mix(color('#effaff'), color('#4289ae'), imprint);
  const geometry = new THREE.PlaneGeometry(8, 8, 192, 192); geometry.rotateX(-Math.PI / 2);
  const snow = new THREE.Mesh(geometry, material); app.scene.add(snow);
  const walker = new THREE.Group(); app.scene.add(walker);
  const jacket = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.35, 6, 16), new THREE.MeshStandardNodeMaterial({ color: '#236047' })); jacket.position.y = 0.8; walker.add(jacket);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), new THREE.MeshStandardNodeMaterial({ color: '#dfb899' })); head.position.y = 1.22; walker.add(head);
  const feet = [];
  for (const x of [-0.13, 0.13]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.32), new THREE.MeshStandardNodeMaterial({ color: '#182438' })); foot.position.set(x, 0.12, 0.06); walker.add(foot); feet.push(foot);
  }
  function stamp(x, z, angle) {
    // PlaneGeometry.rotateX(-PI/2) 后，世界 +z 对应纹理 -v。
    const u = (x / 8 + 0.5) * 512, v = (z / 8 + 0.5) * 512;
    context.save(); context.translate(u, v); context.rotate(angle);
    const gradient = context.createRadialGradient(0, 0, 1, 0, 0, 13);
    gradient.addColorStop(0, 'white'); gradient.addColorStop(0.6, '#aaaaaa'); gradient.addColorStop(1, 'transparent');
    context.scale(0.65, 1); context.fillStyle = gradient; context.fillRect(-15, -15, 30, 30); context.restore();
    heightMap.needsUpdate = true;
  }
  const raycaster = new THREE.Raycaster(), destination = new THREE.Vector3(2, 0, 0);
  app.renderer.domElement.addEventListener('pointerdown', (event) => {
    raycaster.setFromCamera(new THREE.Vector2(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2), app.camera);
    const result = raycaster.intersectObject(snow)[0]; if (result) destination.copy(result.point);
  });
  const parameters = { autoWalk: true, clear() { context.fillStyle = 'black'; context.fillRect(0, 0, 512, 512); heightMap.needsUpdate = true; } };
  app.gui.add(parameters, 'autoWalk').name('自动绕圈'); app.gui.add(depth, 'value', 0, 0.45, 0.01).name('足迹深度'); app.gui.add(parameters, 'clear').name('清空足迹');
  let distanceSinceStep = 0, nextFoot = 0;
  const direction = new THREE.Vector3(), footWorld = new THREE.Vector3();
  app.animate((seconds, dt) => {
    if (parameters.autoWalk) destination.set(Math.cos(seconds * 0.35) * 2.3, 0, Math.sin(seconds * 0.35) * 2.3);
    direction.subVectors(destination, walker.position); direction.y = 0;
    const step = Math.min(direction.length(), dt * 1.1);
    if (step < 0.002) return;
    walker.position.addScaledVector(direction.normalize(), step);
    walker.rotation.y = Math.atan2(direction.x, direction.z);
    distanceSinceStep += step;
    feet.forEach((foot, i) => { foot.position.y = 0.12 + Math.max(0, Math.sin(seconds * 8 + i * Math.PI)) * 0.16; });
    if (distanceSinceStep > 0.24) {
      walker.updateMatrixWorld(true); feet[nextFoot].getWorldPosition(footWorld);
      stamp(footWorld.x, footWorld.z, -walker.rotation.y); nextFoot = 1 - nextFoot; distanceSinceStep = 0;
    }
  });
  app.notice(`${app.gpu ? 'WebGPU' : 'WebGL 2 回退'} · 关闭自动绕圈后点击雪面移动，足迹会保留`);
  app.track(heightMap);
}
main().catch(showError);
