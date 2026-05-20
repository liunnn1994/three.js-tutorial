<script setup lang="ts">
import { TresCanvas } from "@tresjs/core";
import { OrbitControls, Box, Sphere, TorusKnot, Levioso } from "@tresjs/cientos";
</script>

<template>
  <div class="three-demo">
    <TresCanvas clear-color="#333">
      <TresPerspectiveCamera :fov="75" :near="0.1" :far="1000" :position="[-4, 3, 6]" />
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" />

      <Box :args="[1, 1, 1]" color="mediumpurple" :position="[2, 0.5, 0]" :scale="1.5" />

      <Levioso :speed="3" :float-factor="1.5" :rotation-factor="5">
        <Sphere :args="[0.75, 32, 32]" color="orange" :position="[-2, 1, 0]" />
      </Levioso>

      <Levioso :speed="2" :float-factor="1" :rotation-factor="8">
        <TorusKnot :args="[0.5, 0.15, 100, 16]" color="salmon" :position="[0, 2.5, 0]" />
      </Levioso>

      <TresMesh :rotation-x="-Math.PI / 2">
        <TresPlaneGeometry :args="[10, 10]" />
        <TresMeshStandardMaterial color="greenyellow" />
      </TresMesh>

      <OrbitControls />
    </TresCanvas>
  </div>
</template>
