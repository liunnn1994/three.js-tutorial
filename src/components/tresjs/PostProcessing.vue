<script setup lang="ts">
import * as THREE from "three";
import { ref, onMounted, onUnmounted } from "vue";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls } from "@tresjs/cientos";
import { EffectComposerPmndrs, BloomPmndrs, VignettePmndrs } from "@tresjs/post-processing";

const torusGeometry = new THREE.TorusGeometry(1, 0.4, 16, 32);
const material = new THREE.MeshNormalMaterial();

const donuts: {
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
}[] = [];
for (let i = 0; i < 30; i++) {
  donuts.push({
    position: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10],
    scale: 0.2 + Math.random() * 0.2,
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
  });
}

const meshRefs = ref<THREE.Mesh[]>([]);
let animId = 0;

onMounted(() => {
  const animate = () => {
    for (const mesh of meshRefs.value) {
      if (mesh) {
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.005;
      }
    }
    animId = requestAnimationFrame(animate);
  };
  animate();
});
onUnmounted(() => cancelAnimationFrame(animId));
</script>

<template>
  <div class="three-demo">
    <TresCanvas clear-color="#111">
      <TresPerspectiveCamera :fov="75" :near="0.1" :far="1000" :position="[-4, 2, 6]" />
      <TresMesh
        v-for="(d, i) in donuts"
        :key="i"
        :ref="
          (el: any) => {
            if (el) meshRefs[i] = el;
          }
        "
        :geometry="torusGeometry"
        :material="material"
        :position="d.position"
        :scale="d.scale"
        :rotation="d.rotation"
      />

      <EffectComposerPmndrs>
        <BloomPmndrs :intensity="1.5" :luminance-threshold="0.3" />
        <VignettePmndrs :offset="0.3" :darkness="0.8" />
      </EffectComposerPmndrs>

      <OrbitControls />
    </TresCanvas>
  </div>
</template>
