<script setup lang="ts">
import { Satellite } from '@/Satellite';
import { ThreeSimulation } from '@/Sim';
import { ref } from 'vue';

const props = defineProps<{
    simulation: ThreeSimulation
}>();


const sat = new Satellite();
sat.fromTLE(`STARLINK-1130
1 48274U 21001A   21100.00000000  .00000000  00000-0  00000-0 0  9999
2 48274  53.0000  90.0000 0000000  90.0000  90.0000 15.00000000    10`);

props.simulation.addSatellite(sat);
props.simulation.setTimeSpeed(1)


const react = ref(undefined as Satellite | undefined);

props.simulation.addEventListener('select', (sat) => {
    react.value = sat;
})

</script>

<template>
    dingen doen met data

    <div v-if="react">
        <h1>{{react.name}}</h1>
        <p>{{react.satData.satnum}}</p>
    </div>
</template>

<style>
</style>
