<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import LeftInfoBlock from '@/components/LeftInfoBlock.vue'
import { Ref, ref, watch } from 'vue'
import SpeedButtons from '@/components/SpeedButtons.vue'
import { Graph } from '@/Graph'
import { SatManager, Filter } from '@/common/sat-manager'
import { AllSatLinks, SatLinks } from '@/SatLinks'
import { geoCoords } from '@/common/utils'
import { useI18n } from 'vue-i18n'
import { rounded } from '@/common/utils'
import { NUM_DIGITS } from '@/common/constants'
import { LocationMarker } from '@/LocationMarker';

const { t } = useI18n()

const props = defineProps<{
  simulation: ThreeSimulation
}>()

let firstCoords: Ref<geoCoords | undefined> = ref(undefined)
let secondCoords: Ref<geoCoords | undefined> = ref(undefined)

const manager = new SatManager(props.simulation)
await manager.init()

const filter: Filter = {
  name: 'Starlink',
  selected: true,
  min_launch_year: 1900,
  max_launch_year: 3000
}
manager.selectNone()
manager.currentFilters.push(filter)
manager.updateSatellites()

const currentSelectedSatellite = ref(undefined as Satellite | undefined)

props.simulation.addEventListener('earthClicked', (coords) => {
  if (coords) {
    if (!firstCoords.value) {
      firstCoords.value = coords
      props.simulation.addMarker(coords);
    } else if (!secondCoords.value) {
      secondCoords.value = coords
      props.simulation.addMarker(coords);
      makeGraph()
    }
  }
})

function makeGraph() {
  if (!firstCoords.value || !secondCoords.value) {
    console.error()
    return
  }

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

  const sat1 = graph.findClosestSat({
    alt: firstCoords.value.altitude,
    lat: firstCoords.value.lat,
    lng: firstCoords.value.lng
  })
  const sat2 = graph.findClosestSat({
    alt: secondCoords.value.altitude,
    lat: secondCoords.value.lat,
    lng: secondCoords.value.lng
  })
  if (!sat1 || !sat2) {
    return
  }
  const path = graph.findPath(sat1, sat2)
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
  <LeftInfoBlock :open="true">
    <div class="container">
      <h1>{{ t('Communication') }}</h1>
      <p>
        {{
          t(
            'Click on the globe to select two points and find the shortest path between two satellites'
          )
        }}
      </p>
      <div v-if="firstCoords">
        <p>{{ t('First point') }}:</p>
        <p>
          <span>{{ t('Longitude') }}: </span>
          <span>{{ rounded(firstCoords.lng, NUM_DIGITS) }}º</span>
        </p>
        <p>
          <span>{{ t('Latitude') }}: </span>
          <span>{{ rounded(firstCoords.lat, NUM_DIGITS) }}º</span>
        </p>
      </div>
      <div v-if="secondCoords">
        <p>{{ t('Second point') }}:</p>
        <p>
          <span>{{ t('Longitude') }}: </span>
          <span>{{ rounded(secondCoords.lng, NUM_DIGITS) }}º</span>
        </p>
        <p>
          <span>{{ t('Latitude') }}: </span>
          <span>{{ rounded(secondCoords.lat, NUM_DIGITS) }}º</span>
        </p>
      </div>

      <!-- <div class="info">
        <p>
          <span>{{ t('Amount of hops') }}</span>
          <span>{{ 0 }}</span>
        </p>
        <p>
          <span>{{ t('Distance') }}</span>
          <span>{{ 0 }}</span>
        </p>
      </div> -->

      <button>
        {{ t('Reset route') }}
      </button>
    </div>
  </LeftInfoBlock>

  <SpeedButtons :simulation="simulation"></SpeedButtons>
</template>

<style scoped lang="scss">
.container {
  padding: 10px;

  h1 {
    font-size: 2em;
    margin-bottom: 10px;
  }

  p {
    font-size: 1.2em;
    margin-bottom: 10px;
  }
}
</style>

<i18n>
  {
    "en": {
      "Longitude": "Longitude",
      "Latitude": "Latitude",
      "First point": "First point",
      "Second point": "Second point",
      "Communication": "Communication",
      "Click on the globe to select two points and find the shortest path between two satellites": "Click on the globe to select two points and find the shortest path between two satellites",
      "Reset route": "Reset route",
      "Amount of hops": "Amount of hops",
      "Distance": "Distance",

    },
    "nl": {
      "Longitude": "Lengtegraad",
      "Latitude": "Breedtegraad",
      "First point": "Eerste punt",
      "Second point": "Tweede punt",
      "Communication": "Communicatie",
      "Click on the globe to select two points and find the shortest path between two satellites": "Klik op de aardbol om twee punten te selecteren en het kortste pad tussen twee satellieten te vinden",
      "Reset route": "Reset route",
      "Amount of hops": "Aantal hops",
      "Distance": "Afstand",
    }
  }

</i18n>
