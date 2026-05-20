<script setup lang="ts">
import * as THREE from 'three'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, Text3D } from '@tresjs/cientos'

const torusGeometry = new THREE.TorusGeometry(1, 0.6, 16, 32)
const material = new THREE.MeshNormalMaterial()

const donuts: { position: [number, number, number]; scale: number; rotation: [number, number, number] }[] = []
for (let i = 0; i < 50; i++) {
  donuts.push({
    position: [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 10,
    ],
    scale: 0.2 + Math.random() * 0.2,
    rotation: [
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    ],
  })
}
</script>

<template>
  <div class="three-demo">
    <TresCanvas clear-color="#333">
      <TresPerspectiveCamera :fov="75" :near="0.1" :far="1000" :position="[-4, 2, 6]" />

      <Suspense>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          text="Hello TresJS"
          :center="true"
          :size="0.75"
          :height="0.2"
          :curve-segments="12"
          :bevel-enabled="true"
          :bevel-thickness="0.02"
          :bevel-size="0.02"
          :bevel-segments="5"
        >
          <TresMeshNormalMaterial />
        </Text3D>
      </Suspense>

      <TresMesh
        v-for="(d, i) in donuts"
        :key="i"
        :geometry="torusGeometry"
        :material="material"
        :position="d.position"
        :scale="d.scale"
        :rotation="d.rotation"
      />

      <OrbitControls />
    </TresCanvas>
  </div>
</template>
