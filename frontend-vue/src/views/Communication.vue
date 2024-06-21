<script setup lang="ts">
import { Graph } from '@/Graph'
import { AllSatLinks, SatLinks } from '@/SatLinks'
import { Satellite, polar2Cartesian } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import { Filter, SatManager } from '@/common/sat-manager'
import { GeoCoords, calculateDistance, rounded } from '@/common/utils'
import LeftInfoBlock from '@/components/LeftInfoBlock.vue'
import SpeedButtons from '@/components/SpeedButtons.vue'
import MultipleTabs from '@/components/MultipleTabs.vue'
import { Ref, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NUM_DIGITS } from '@/common/constants'

const { t } = useI18n()

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const graph = new Graph()
const all = new AllSatLinks(props.simulation.scene, graph, props.simulation)

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

props.simulation.disableSatClicking()

const firstCoords: Ref<GeoCoords | undefined> = ref(undefined)
const secondCoords: Ref<GeoCoords | undefined> = ref(undefined)
const tabForConnections = 2
const tabForFirstCoords = 3
const tabForSecondCoords = 4
const tabForPath = 5

const currentTab = ref(1)
const currentPath = ref<Satellite[]>([])

let intervalID: number

const distance = computed(() => {
  if (currentPath.value.length === 0) {
    return 0
  }

  let dist = 0
  for (let i = 0; i < currentPath.value.length - 1; i++) {
    const sat1 = currentPath.value[i]
    const sat2 = currentPath.value[i + 1]
    dist += calculateDistance(sat1.realPosition, sat2.realPosition)
  }

  return rounded(dist, NUM_DIGITS)
})

function tabInfoUpdate(tab: number) {
  all.hideConnections = true
  all.setPath([])
  clearInterval(intervalID)

  if (tab === tabForConnections) {
    all.hideConnections = false
  } else if (tab === tabForFirstCoords) {
    if (firstCoords.value) {
      props.simulation.removeMarker(firstCoords.value)
    }
    if (secondCoords.value) {
      props.simulation.removeMarker(secondCoords.value)
    }
    firstCoords.value = undefined
    secondCoords.value = undefined
  } else if (tab === tabForSecondCoords) {
    // TODO: Stop navigating to second page if coords not selected.
    if (secondCoords.value) {
      props.simulation.removeMarker(secondCoords.value)
    }
    secondCoords.value = undefined
  } else if (tab === tabForPath) {
    findPath()
    intervalID = setInterval(findPath, 1000)
  }
}

props.simulation.addEventListener('earthClicked', (coords) => {
  if (coords) {
    if (currentTab.value === tabForFirstCoords) {
      if (firstCoords.value) {
        props.simulation.removeMarker(firstCoords.value)
      }
      firstCoords.value = coords
      props.simulation.addMarker(coords)

      currentTab.value++
      // TODO: Dit is cursed, fix it.
      tabInfoUpdate(currentTab.value)
    } else if (currentTab.value === tabForSecondCoords) {
      if (secondCoords.value) {
        props.simulation.removeMarker(secondCoords.value)
      }
      secondCoords.value = coords
      props.simulation.addMarker(coords)
      currentTab.value++

      // TODO: Dit is cursed, fix it.
      tabInfoUpdate(currentTab.value)
    }
  }
})

function findPath() {
  if (!firstCoords.value || !secondCoords.value) {
    console.error('No coords selected')
    return
  }

  const sat1 = graph.findClosestSat({ ...firstCoords.value })
  const sat2 = graph.findClosestSat({ ...secondCoords.value })
  if (!sat1 || !sat2) {
    return
  }
  const path = graph.findPath(sat1, sat2)

  currentPath.value = []
  console.log('Found path: ', path)
  if (path) {
    for (const node of path) {
      currentPath.value.push(node.sat)
    }
  }

  all.setPath([
    {
      xyzPosition: polar2Cartesian(
        secondCoords.value.lat,
        secondCoords.value.lng,
        secondCoords.value.alt,
        props.simulation.globe.getGlobeRadius()
      )
    },
    ...currentPath.value,
    {
      xyzPosition: polar2Cartesian(
        firstCoords.value.lat,
        firstCoords.value.lng,
        firstCoords.value.alt,
        props.simulation.globe.getGlobeRadius()
      )
    }
  ])
}
</script>

<template>
  <LeftInfoBlock :open="true">
    <MultipleTabs :amount="5" @navigate="tabInfoUpdate" v-model="currentTab">
      <template #tab1>
        <div class="tab">
          <h1 class="titel">{{ t('Send your message through satellites!') }}</h1>
          <h2 class="subtitel">
            {{
              t(
                'This is a communication network of satellites in space. All these satellites can communicate with eachother to send messages around the world.'
              )
            }}
          </h2>
          <p class="description">
            {{ t('Click next to see all the connections the satellites can make!') }}
          </p>
        </div>
      </template>

      <template #tab2>
        <div class="tab">
          <h1 class="titel">{{ t('Satellites are connected like this!') }}</h1>
          <h2 class="subtitel">
            {{
              t(
                'The line that you see between the satellites is the connection that they have with eachother. This means that they can send messages to eachother.'
              )
            }}
          </h2>
          <p class="description">
            {{ t('Click next to choose where you want to send your message from.') }}
          </p>
        </div>
      </template>

      <template #tab3>
        <div class="tab">
          <h1 class="titel">
            {{ t('Click on the first point you would like to communicate from.') }}
          </h1>
          <h2 class="subtitel">
            {{
              t(
                'Click somewhere on the globe to select the first point where you would like to send your message from.'
              )
            }}
          </h2>
        </div> </template
      >text-align: center;

      <template #tab4>
        <div class="tab">
          <h1 class="titel">{{ t('And click where you would like to send your message to') }}</h1>
          <h2 class="subtitel">
            {{
              t(
                'All these satellites can communicate with eachother to send messages around the world.'
              )
            }}
          </h2>
          <p v-if="secondCoords" class="description">
            {{ t('Click next to see the shortest path between the two points') }}
          </p>
        </div>
      </template>

      <template #tab5>
        <div class="tab">
          <h1 class="titel">{{ t('Your message took this route!') }}</h1>
          <h2 class="subtitel">
            {{
              t(
                'This is the shortest path between the two points that you selected. The satellites will send your message through this path.'
              )
            }}
          </h2>
          <p class="description">
            {{ t('Your message took') }} {{ currentPath.length - 1 }} {{ t('hops!') }}
            <br />
            {{ t('And your message flew') }} {{ distance }} {{ t('kilometers.') }}
          </p>
        </div>
      </template>
    </MultipleTabs>
  </LeftInfoBlock>

  <SpeedButtons :simulation="simulation" :showOnlyTime="true"></SpeedButtons>
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  margin: 0.5em;
  color: $main_text;

  .titel {
    font-size: 2.3em;
    margin: 0.5em;
    margin-top: 1.5em;
    font-weight: 500;

    font-family: 'Tomorrow';
    // text-align: center;
    position: fixed;
    top: 0;
  }

  .subtitel {
    font-size: 1.5em;
    margin: 0.5em;
    position: fixed;
  }

  .description {
    font-size: 1.4em;
    margin: 0.5em;
    margin-bottom: 3em;
    position: fixed;
    bottom: 0;
    text-align: center;
  }

  .coords {
    margin: 0.5em;
    font-size: 1.4em;
    position: fixed;
    top: 0;
    margin-top: 10em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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
