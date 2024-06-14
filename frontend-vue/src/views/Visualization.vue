<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import FilterBar from '@/components/FilterBar.vue'
import PopSatInfo from '@/components/PopSatInfo.vue'
import { ref, watch } from 'vue'
import SpeedButtons from '@/components/SpeedButtons.vue'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const currentSelectedSatellite = ref(undefined as Satellite | undefined)
let currentSelectedSatelliteLet: Satellite | undefined;

props.simulation.addEventListener('select', (sat) => {
  if (sat){
    const orbit = props.simulation.addOrbit(sat, false);
    sat.setOrbit(orbit)
  }
  else if (currentSelectedSatelliteLet){
    props.simulation.removeOrbit(currentSelectedSatelliteLet)
  }
  currentSelectedSatellite.value = sat;
  currentSelectedSatelliteLet = sat;
})

</script>

<template>
  <FilterBar :simulation="simulation"></FilterBar>
  <PopSatInfo
    :currentSelectedSatellite="currentSelectedSatellite as Satellite"
    v-if="currentSelectedSatellite"
  />

  <SpeedButtons :simulation="simulation"></SpeedButtons>
</template>

<style scoped lang="scss"></style>
