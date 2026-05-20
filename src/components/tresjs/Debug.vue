<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from "vue";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls } from "@tresjs/cientos";
import { useControls, TresLeches } from "@tresjs/leches";

const boxRef = ref();
let animId = 0;

const { speed, color, wireframe, boxScale, intensity, ambient } = useControls({
  speed: { value: 1, min: 0, max: 5, step: 0.1, label: "旋转速度" },
  color: "#9370DB",
  wireframe: false,
  boxScale: { value: 1.5, min: 0.5, max: 3, step: 0.1, label: "缩放" },
  intensity: { value: 1.5, min: 0, max: 5, step: 0.1, label: "主光强度" },
  ambient: { value: 0.5, min: 0, max: 2, step: 0.1, label: "环境光" },
});

watchEffect(() => {
  if (boxRef.value) boxRef.value.scale.set(boxScale.value, boxScale.value, boxScale.value);
});

onMounted(() => {
  const animate = () => {
    if (boxRef.value) boxRef.value.rotation.y += 0.01 * speed.value;
    animId = requestAnimationFrame(animate);
  };
  animate();
});
onUnmounted(() => cancelAnimationFrame(animId));
</script>

<template>
  <div class="three-demo" style="position: relative">
    <TresLeches />
    <TresCanvas clear-color="#333">
      <TresPerspectiveCamera :fov="75" :near="0.1" :far="1000" :position="[-4, 3, 6]" />
      <TresAmbientLight :intensity="ambient" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="intensity" />

      <TresMesh :position-x="-2">
        <TresSphereGeometry />
        <TresMeshStandardMaterial color="orange" />
      </TresMesh>

      <TresMesh ref="boxRef" :position-x="2" :position-y="0.75">
        <TresBoxGeometry />
        <TresMeshStandardMaterial :color="color" :wireframe="wireframe" />
      </TresMesh>

      <TresMesh :rotation-x="-Math.PI / 2">
        <TresPlaneGeometry :args="[10, 10]" />
        <TresMeshStandardMaterial color="greenyellow" />
      </TresMesh>

      <OrbitControls />
    </TresCanvas>
  </div>
</template>
