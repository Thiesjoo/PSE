<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import FilterBar from '@/components/FilterBar.vue'
import PopSatInfo from '@/components/PopSatInfo.vue'
import { ref, watch } from 'vue'
import SpeedButtons from '@/components/SpeedButtons.vue'
import { Graph } from '@/Graph'
import { SatManager, Filter } from '@/common/sat-manager'
import { AllSatLinks, SatLinks } from '@/SatLinks'
const props = defineProps<{
  simulation: ThreeSimulation
}>()

const manager = new SatManager(props.simulation)
await manager.init()

const filter: Filter = {name: "Starlink", selected: true, min_launch_year: 1900, max_launch_year: 3000}
manager.selectNone()
manager.currentFilters.push(filter)
manager.updateSatellites()


const currentSelectedSatellite = ref(undefined as Satellite | undefined)

props.simulation.addEventListener('select', (sat) => {
  if (sat){
    const orbit = props.simulation.addOrbit(sat, false);
    sat.setOrbit(orbit)
  }
  else if (currentSelectedSatellite.value){
    props.simulation.removeOrbit(currentSelectedSatellite.value as Satellite)
  }
  currentSelectedSatellite.value = sat;
})

function makeGraph() {
    const graph = new Graph(props.simulation.globe)
    const all = new AllSatLinks(props.simulation.scene)
    const satellites = props.simulation.getSatellites()
    graph.makeGraph(satellites)

    graph.adjList.forEach((values) => {
        const satLink = new SatLinks(values.sat)
        satLink.setSatelliteConnections(values.connections)

        all.addSatLink(satLink)
    })
    props.simulation.addAllSatLinks(all)


    const path = graph.findPath(satellites[0], satellites[100]);
    const satList = []
    if (path) {
        for (const node of path) {
            satList.push(node.sat)
        }
        console.log(path)
    }

    all.setPath(satList)
    props.simulation.setCurrentlySelected(satList[0])
    console.log(path)
}

</script>

<template>
  <!-- <FilterBar :simulation="simulation"></FilterBar> -->
  <button @click="makeGraph">Test</button>

  <SpeedButtons :simulation="simulation"></SpeedButtons>
</template>

<style scoped lang="scss"></style>