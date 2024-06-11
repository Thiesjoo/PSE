<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import { getRawTLES } from '@/api/ourApi'
import PopSatInfo from '@/components/PopSatInfo.vue'
import { ref, watch } from 'vue'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const rawSatData = await getRawTLES(1000)
const sats = Satellite.fromMultipleTLEs(rawSatData).slice(0, 5000)
sats.forEach((sat) => {
  props.simulation.addSatellite(sat)
})

let speed = ref(1)
watch(speed, (newSpeed) => {
  props.simulation.setTimeSpeed(newSpeed)
})

const currentSelectedSatellite = ref(undefined as Satellite | undefined)
props.simulation.addEventListener('select', (sat) => {
  currentSelectedSatellite.value = sat
})
</script>

<template>
  <PopSatInfo
    :currentSelectedSatellite="currentSelectedSatellite"
    v-if="currentSelectedSatellite"
  />

  <button @click="speed = speed * 2">Speed * 2. Current speed: {{ speed }}</button>
</template>

<style scoped lang="scss"></style>
