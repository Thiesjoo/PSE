<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { Satellite } from '@/Satellite'
import { ref, watch } from 'vue';
// import { exp_sat } from '@/views/Simulation.vue'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

// const satellites = props.simulation.getNameOfSats();
const satellites = ref<Satellite[]>([]);
const selectedSatellite =  ref<Satellite | null>(null);

const selectSatellite = (satellite: Satellite) => {
  selectedSatellite.value = satellite;
};

watch(() => props.simulation.satellites, (newSatellites) => {
  console.log("bullshit");
  satellites.value = props.simulation.getNameOfSats()
}, { immediate: true });


</script>

<template>
  <div class="right-info-block">
    <h2>Satellites Created</h2>
    <div class="satellite-list">
      <div
        v-for="satellite in satellites"
        :key="satellite.name"
        :class="{'selected': selectedSatellite === satellite}"
        @click="selectSatellite(satellite)"
        class="satellite-item"
      >
        {{ satellite.name }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.right-info-block {
  position: absolute;
  top: 50px;
  right: 0; /* Position it to the right side */
  width: 175px;
  height: 50%;
  background-color: #01023890;
  color: white;
  padding-left: 15px;
  padding-right: 15px;
  padding-top: 10px;
  padding-bottom: 10px;
  border: 2px solid rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  padding: 15px;
}

.satellite-list {
  overflow-y: auto; /* Enable vertical scroll if needed */
  max-height: 78%; /* Limit max height to parent height */
}

.satellite-item {
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
}

.satellite-item.selected {
  background-color: rgb(213, 247, 73);
}
</style>
