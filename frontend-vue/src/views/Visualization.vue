<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import { computed, ref, watch } from 'vue'
import { fetchTLEs } from '@/api/celestrak'
import { fetchTLEInformation, getRawTLES } from '@/api/ourApi'
import PopFrame from '@/components/PopFrame.vue'
import PopSatInfo from '@/components/PopSatInfo.vue'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const rawSatData = await fetchTLEInformation()
const sats = Satellite.fromOurApiData(rawSatData).slice(0, 5000)
sats.forEach((sat) => props.simulation.addSatellite(sat))

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
