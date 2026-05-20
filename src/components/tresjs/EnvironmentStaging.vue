<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { PCFShadowMap } from "three";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls, Environment, ContactShadows } from "@tresjs/cientos";

const boxRef = ref();
let animId = 0;

onMounted(() => {
  const animate = () => {
    if (boxRef.value) {
      boxRef.value.rotation.y += 0.01;
      boxRef.value.rotation.x += 0.005;
    }
    animId = requestAnimationFrame(animate);
  };
  animate();
});
onUnmounted(() => cancelAnimationFrame(animId));
</script>

<template>
  <div class="three-demo">
    <TresCanvas shadows clear-color="#333" :shadow-map-type="PCFShadowMap">
      <TresPerspectiveCamera :fov="75" :near="0.1" :far="1000" :position="[-4, 3, 6]" />
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" cast-shadow />

      <TresMesh cast-shadow :position-x="-2" :position-y="1">
        <TresSphereGeometry :args="[0.75, 32, 32]" />
        <TresMeshStandardMaterial color="orange" :metalness="0.3" :roughness="0.2" />
      </TresMesh>

      <TresMesh ref="boxRef" cast-shadow :position-x="2" :position-y="1" :scale="1.5">
        <TresBoxGeometry />
        <TresMeshStandardMaterial color="mediumpurple" :metalness="0.3" :roughness="0.2" />
      </TresMesh>

      <TresMesh cast-shadow :position="[0, 2.5, 0]">
        <TresTorusKnotGeometry :args="[0.5, 0.15, 100, 16]" />
        <TresMeshStandardMaterial color="salmon" :metalness="0.3" :roughness="0.2" />
      </TresMesh>

      <ContactShadows
        :position="[0, 0, 0]"
        :scale="10"
        :resolution="512"
        :far="5"
        color="#4b2709"
        :opacity="0.5"
        :blur="2.5"
      />
      <Suspense>
        <Environment preset="city" :background="false" />
      </Suspense>

      <OrbitControls />
    </TresCanvas>
  </div>
</template>
