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
import { geoCoords } from '@/common/utils'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

let firstCoords: geoCoords
let secondCoords: geoCoords;

const manager = new SatManager(props.simulation)
await manager.init()

const filter: Filter = {name: "Starlink", selected: true, min_launch_year: 1900, max_launch_year: 3000}
manager.selectNone()
manager.currentFilters.push(filter)
manager.updateSatellites()


const currentSelectedSatellite = ref(undefined as Satellite | undefined)

props.simulation.addEventListener('earthClicked', (coords) => {
  if (coords){
    if (!firstCoords){
      firstCoords = coords;
    }
    else if (!secondCoords){
      secondCoords = coords;
      makeGraph();
      setInterval((makeGraph), 5000)
    }
  }
})

function makeGraph() {
    props.simulation.satelliteLinks?.destroy()
    const graph = new Graph(props.simulation.globe)
    const all = new AllSatLinks(props.simulation.scene)
    const satellites = props.simulation.getSatellites()
    graph.makeGraph(satellites)

    graph.adjList.forEach((values) => {
        const satLink = new SatLinks(values.sat)
        // satLink.setSatelliteConnections(values.connections)

        all.addSatLink(satLink)
    })
    props.simulation.addAllSatLinks(all)

    const sat1 = graph.findClosestSat({alt: firstCoords.altitude, lat: firstCoords.lat, lng: firstCoords.lng})
    const sat2 = graph.findClosestSat({alt: secondCoords.altitude, lat: secondCoords.lat, lng: secondCoords.lng})
    if (!sat1 || !sat2){
      return
    }
    const path = graph.findPath(sat1, sat2);
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