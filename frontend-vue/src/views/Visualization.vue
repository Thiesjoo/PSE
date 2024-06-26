<!--
  This file is the main view for the visualization page. This page is responsible for rendering the simulation and the filter bar.

  The popup satellite info is also rendered here, as well as the speed buttons.
 -->

<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import FilterBar from '@/components/FilterBar.vue'
import LoadingComponent from '@/components/LoadingComponent.vue'
import PopSatInfo from '@/components/PopSatInfo.vue'
import SpeedButtons from '@/components/SpeedButtons.vue'
import { ref } from 'vue'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

await props.simulation.waitUntilFinishedLoading()

const currentSelectedSatellite = ref(undefined as Satellite | undefined)

props.simulation.addEventListener('select', (sat) => {
  if (sat) {
    const orbit = props.simulation.addOrbit(sat, false)
    sat.setOrbit(orbit)
  } else if (currentSelectedSatellite.value) {
    props.simulation.removeOrbit(currentSelectedSatellite.value as Satellite)
  }
  currentSelectedSatellite.value = sat
})
</script>

<template>
  <Suspense>
    <FilterBar :simulation="simulation"></FilterBar>
    <template #fallback>
      <LoadingComponent></LoadingComponent>
    </template>
  </Suspense>
  <PopSatInfo
    :currentSelectedSatellite="currentSelectedSatellite as Satellite"
    v-if="currentSelectedSatellite"
  />

  <SpeedButtons :simulation="simulation"></SpeedButtons>
</template>

<style scoped lang="scss"></style>
