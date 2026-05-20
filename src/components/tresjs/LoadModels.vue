<script setup lang="ts">
import { PCFShadowMap } from "three";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls, useGLTF } from "@tresjs/cientos";

const { execute } = useGLTF("/assets/24-environment-map-final/models/hamburger.glb");
const { scene } = await execute();
scene.scale.setScalar(0.5);
scene.position.y = 0.5;
</script>

<template>
  <div class="three-demo">
    <TresCanvas shadows clear-color="ivory" :shadow-map-type="PCFShadowMap">
      <TresPerspectiveCamera :fov="75" :near="0.1" :far="1000" :position="[-4, 3, 6]" />
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" cast-shadow />

      <primitive :object="scene" cast-shadow />

      <TresMesh :rotation-x="-Math.PI / 2" receive-shadow>
        <TresPlaneGeometry :args="[20, 20]" />
        <TresMeshStandardMaterial color="#cccccc" />
      </TresMesh>

      <OrbitControls />
    </TresCanvas>
  </div>
</template>
