<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls } from "@tresjs/cientos";

const boxRef = ref();
let animId = 0;

onMounted(() => {
  const animate = () => {
    if (boxRef.value) boxRef.value.rotation.y += 0.01;
    animId = requestAnimationFrame(animate);
  };
  animate();
});
onUnmounted(() => cancelAnimationFrame(animId));
</script>

<template>
  <div class="three-demo">
    <TresCanvas clear-color="#333">
      <TresPerspectiveCamera :fov="45" :near="0.1" :far="200" :position="[3, 2, 6]" />
      <TresDirectionalLight :position="[1, 2, 3]" :intensity="1.5" />
      <TresAmbientLight :intensity="0.5" />

      <TresMesh :position-x="-2">
        <TresSphereGeometry />
        <TresMeshStandardMaterial color="orange" />
      </TresMesh>

      <TresMesh ref="boxRef" :position-x="2" :scale="1.5" :rotation-y="Math.PI * 0.25">
        <TresBoxGeometry />
        <TresMeshStandardMaterial color="mediumpurple" />
      </TresMesh>

      <TresMesh :position-y="-1" :rotation-x="-Math.PI * 0.5" :scale="10">
        <TresPlaneGeometry />
        <TresMeshStandardMaterial color="greenyellow" />
      </TresMesh>

      <OrbitControls />
    </TresCanvas>
  </div>
</template>
