<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { PCFShadowMap } from "three";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls } from "@tresjs/cientos";

const GROUND_Y = -0.25;
const GRAVITY = -9.81;
const BOUNCE = 0.5;
const FRICTION = 0.95;

interface PhysicsBody {
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
  angVelocity: [number, number, number];
  mesh: any;
}

const bodies = reactive<PhysicsBody[]>([
  {
    position: [-2, 5, 0],
    velocity: [0, 0, 0],
    rotation: [0, 0, 0],
    angVelocity: [0.5, 0.3, 0],
    mesh: null,
  },
  {
    position: [2, 7, 0],
    velocity: [0, 0, 0],
    rotation: [0, 0, 0],
    angVelocity: [0, 0.5, 0.3],
    mesh: null,
  },
  {
    position: [0, 9, 1],
    velocity: [0, 0, 0],
    rotation: [0, 0, 0],
    angVelocity: [0.3, 0, 0.5],
    mesh: null,
  },
]);

const applyImpulse = (index: number) => {
  const body = bodies[index];
  if (body) {
    body.velocity[1] = 5;
    body.angVelocity[0] += (Math.random() - 0.5) * 3;
    body.angVelocity[1] += (Math.random() - 0.5) * 3;
    body.angVelocity[2] += (Math.random() - 0.5) * 3;
  }
};

let animId = 0;
let lastTime = 0;

onMounted(() => {
  lastTime = performance.now();
  const animate = (time: number) => {
    const delta = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    for (const body of bodies) {
      if (!body.mesh) continue;
      body.velocity[1] += GRAVITY * delta;
      body.position[0] += body.velocity[0] * delta;
      body.position[1] += body.velocity[1] * delta;
      body.position[2] += body.velocity[2] * delta;
      const halfH = 0.75;
      if (body.position[1] - halfH < GROUND_Y) {
        body.position[1] = GROUND_Y + halfH;
        body.velocity[1] = -body.velocity[1] * BOUNCE;
        body.velocity[0] *= FRICTION;
        body.velocity[2] *= FRICTION;
        body.angVelocity[0] *= FRICTION;
        body.angVelocity[1] *= FRICTION;
        body.angVelocity[2] *= FRICTION;
      }
      body.rotation[0] += body.angVelocity[0] * delta;
      body.rotation[1] += body.angVelocity[1] * delta;
      body.rotation[2] += body.angVelocity[2] * delta;
      body.mesh.position.set(...body.position);
      body.mesh.rotation.set(...body.rotation);
    }
    animId = requestAnimationFrame(animate);
  };
  animId = requestAnimationFrame(animate);
});
onUnmounted(() => cancelAnimationFrame(animId));
</script>

<template>
  <div class="three-demo">
    <TresCanvas shadows clear-color="#111" :shadow-map-type="PCFShadowMap">
      <TresPerspectiveCamera :fov="75" :near="0.1" :far="1000" :position="[4, 3, 6]" />
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" cast-shadow />

      <TresMesh
        :ref="
          (el: any) => {
            bodies[0].mesh = el;
          }
        "
        cast-shadow
        @click="applyImpulse(0)"
      >
        <TresSphereGeometry :args="[0.75, 32, 32]" />
        <TresMeshStandardMaterial color="orange" />
      </TresMesh>

      <TresMesh
        :ref="
          (el: any) => {
            bodies[1].mesh = el;
          }
        "
        cast-shadow
        :scale="1.5"
        @click="applyImpulse(1)"
      >
        <TresBoxGeometry />
        <TresMeshStandardMaterial color="mediumpurple" />
      </TresMesh>

      <TresMesh
        :ref="
          (el: any) => {
            bodies[2].mesh = el;
          }
        "
        cast-shadow
        @click="applyImpulse(2)"
      >
        <TresSphereGeometry :args="[0.5, 32, 32]" />
        <TresMeshStandardMaterial color="salmon" />
      </TresMesh>

      <TresMesh receive-shadow :position-y="GROUND_Y">
        <TresBoxGeometry :args="[20, 0.5, 20]" />
        <TresMeshStandardMaterial color="#aaaaaa" />
      </TresMesh>

      <OrbitControls />
    </TresCanvas>
  </div>
</template>
