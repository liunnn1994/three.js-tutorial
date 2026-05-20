<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

const cubeRef = ref()
const cubeColor = ref('mediumpurple')
let animId = 0

onMounted(() => {
  const animate = () => {
    if (cubeRef.value) cubeRef.value.rotation.y += 0.005
    animId = requestAnimationFrame(animate)
  }
  animate()
})
onUnmounted(() => cancelAnimationFrame(animId))

const onClickCube = () => {
  const hue = Math.random() * 360
  cubeColor.value = `hsl(${hue}, 100%, 60%)`
}
const onPointerEnter = () => { document.body.style.cursor = 'pointer' }
const onPointerLeave = () => { document.body.style.cursor = 'default' }
</script>

<template>
  <div class="three-demo">
    <TresCanvas clear-color="#333">
      <TresPerspectiveCamera :fov="75" :near="0.1" :far="1000" :position="[-4, 3, 6]" />
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" />

      <TresMesh :position-x="-2">
        <TresSphereGeometry />
        <TresMeshStandardMaterial color="orange" />
      </TresMesh>

      <TresMesh
        ref="cubeRef"
        :position-x="2"
        :scale="1.5"
        @click="onClickCube"
        @pointer-enter="onPointerEnter"
        @pointer-leave="onPointerLeave"
      >
        <TresBoxGeometry />
        <TresMeshStandardMaterial :color="cubeColor" />
      </TresMesh>

      <TresMesh :rotation-x="-Math.PI / 2">
        <TresPlaneGeometry :args="[10, 10]" />
        <TresMeshStandardMaterial color="greenyellow" />
      </TresMesh>

      <OrbitControls />
    </TresCanvas>
  </div>
</template>
