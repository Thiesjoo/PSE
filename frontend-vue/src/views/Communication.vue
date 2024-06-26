<script setup lang="ts">
import { Graph } from '@/Graph'
import { AllSatLinks } from '@/SatLinks'
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
await props.simulation.waitUntilFinishedLoading()

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

let intervalID: number

const distance = computed(() => {
  if (graph.path.length === 0) {
    return 0
  }

  let dist = 0
  for (let i = 0; i < graph.path.length - 1; i++) {
    const sat1 = graph.path[i].sat
    const sat2 = graph.path[i + 1].sat
    dist += calculateDistance(sat1.realPosition, sat2.realPosition)
  }

  return rounded(dist, NUM_DIGITS)
})

function tabInfoUpdate(tab: number) {
  all.hideConnections = true
  all.setPath([])
  graph.calculatePath = false
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
    if (firstCoords.value && secondCoords.value) {
      graph.setStartPos(firstCoords.value)
      graph.setGoalPos(secondCoords.value)
      graph.calculatePath = true
    }
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
                'Look at all these communication satellites! They can connect with eachother to send messages around the world. '
              )
            }}
          </h2>
          <img src="../assets/communication_icon.png" alt="communication" />
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
          <img src="../assets/communication_connect.png" alt="communication" />
          <p class="description">
            {{ t('Click next to choose where you want to send your message from.') }}
          </p>
        </div>
      </template>

      <template #tab3>
        <div class="tab">
          <div>
            <h1 class="titel">{{ t('Step 1') }}:</h1>
            <h1 class="titel">
              {{ t('Click on the first point you would like to communicate from.') }}
            </h1>
          </div>
          <h2 class="subtitel">
            {{
              t(
                'Click somewhere on the globe to select the first point where you would like to send your message from.'
              )
            }}
          </h2>
          <img src="../assets/location_marker1.png" alt="communication" />
          <!-- <p class="description">
            {{ t('Click next to choose where you want to send your message from.') }}
          </p> -->
        </div>
      </template>

      <template #tab4>
        <div class="tab">
          <h1 class="titel">
            {{ t('Step 2') }}: <br />
            {{ t('And click where you would like to send your message to') }}
          </h1>
          <h2 class="subtitel">
            {{
              t(
                'The satellites are now going to calculate the shortest path between the two points that you selected.'
              )
            }}
          </h2>
          <img src="../assets/location_marker2.png" alt="communication" />
        </div>
      </template>

      <template #tab5>
        <div class="tab">
          <h1 class="titel">
            {{ t('Step 3') }}: <br />
            {{ t('Look at the route your message took!') }}
          </h1>
          <h2 class="subtitel">
            {{ t('This is the shortest path between the two points that you selected.') }}
          </h2>
          <div class="route-info">
            <p v-if="graph.path.length > 0">
              {{ t('Your message took') }} {{ graph.path.length }} {{ t('hops!') }}
            </p>
            <p v-if="graph.path.length > 0">
              {{ t('And your message flew') }} {{ distance }} {{ t('kilometers.') }}
            </p>
            <p v-else>
              {{ t('No path found!') }}
            </p>
          </div>
          <div class="again">
            <p>
              {{ t('Click here to try again!') }}
            </p>
            <button @click="(currentTab = 3), tabInfoUpdate(3)">
              <svg
                fill="#000000"
                width="800px"
                height="800px"
                viewBox="0 0 1920 1920"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M960 0v213.333c411.627 0 746.667 334.934 746.667 746.667S1371.627 1706.667 960 1706.667 213.333 1371.733 213.333 960c0-197.013 78.4-382.507 213.334-520.747v254.08H640V106.667H53.333V320h191.04C88.64 494.08 0 720.96 0 960c0 529.28 430.613 960 960 960s960-430.72 960-960S1489.387 0 960 0"
                  fill-rule="evenodd"
                />
              </svg>
            </button>
          </div>
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
  justify-content: space-between;

  height: 100%;

  text-align: center;
  color: $main_text;
  font-family: 'Tomorrow';

  .titel {
    font-size: 2.3em;
    font-weight: 600;
  }

  img {
    width: 100%;
    object-fit: contain;
  }

  .subtitel {
    font-size: 1.5em;
  }

  .description {
    font-size: 1.4em;
    font-style: italic;
  }

  .route-info {
    font-size: 1.4em;
  }

  .again {
    p {
      font-size: 1.4em;
      font-style: italic;
      margin-bottom: 1em;
    }

    button {
      background: none;
      border: none;

      svg {
        fill: $main_text;
        width: 100px;
        height: 100px;
        transform: rotate(100deg);
      }
    }

    button:hover {
      svg {
        fill: $button_hover;
      }
    }
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
      "Send your message through satellites!": "Send your message through satellites!",
      "Look at all these communication satellites! They can connect with eachother to send messages around the world. ": "Look at all these communication satellites! They can connect with eachother to send messages around the world. ",
      "Click next to see all the connections the satellites can make!": "Click next to see all the connections the satellites can make!",
      "Satellites are connected like this!": "Satellites are connected like this!",
      "The line that you see between the satellites is the connection that they have with eachother. This means that they can send messages to eachother.": "The line that you see between the satellites is the connection that they have with eachother. This means that they can send messages to eachother.",
      "Click next to choose where you want to send your message from.": "Click next to choose where you want to send your message from.",
      "Step 1": "Step 1",
      "Click on the first point you would like to communicate from.": "Click on the first point you would like to communicate from.",
      "Click somewhere on the globe to select the first point where you would like to send your message from.": "Click somewhere on the globe to select the first point where you would like to send your message from.",
      "Step 2": "Step 2",
      "And click where you would like to send your message to": "And click where you would like to send your message to",
      "The satellites are now going to calculate the shortest path between the two points that you selected.": "The satellites are now going to calculate the shortest path between the two points that you selected.",
      "Step 3": "Step 3",
      "Look at the route your message took!": "Look at the route your message took!",
      "This is the shortest path between the two points that you selected.": "This is the shortest path between the two points that you selected.",
      "Your message took": "Your message took",
      "hops!": "hops!",
      "And your message flew": "And your message flew",
      "kilometers.": "kilometers.",
      "No path found!": "No path found!",
      "Click here to try again!": "Click here to try again!"
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
      "Send your message through satellites!": "Stuur je bericht via satellieten!",
      "Look at all these communication satellites! They can connect with eachother to send messages around the world. ": "Kijk naar al deze communicatiesatellieten! Ze kunnen met elkaar verbinden om berichten over de hele wereld te sturen. ",
      "Click next to see all the connections the satellites can make!": "Klik op volgende om alle verbindingen te zien die de satellieten kunnen maken!",
      "Satellites are connected like this!": "Satellieten zijn verbonden zoals dit!",
      "The line that you see between the satellites is the connection that they have with eachother. This means that they can send messages to eachother.": "De lijn tussen de satellieten is de connectie die zij met elkaar hebben. Dit betekent dat ze en bericht naar elkaar kunnen sturen.",
      "Click next to choose where you want to send your message from.": "Klik op volgende om te kiezen waar je je bericht vandaan wilt sturen.",
      "Step 1": "Stap 1",
      "Click on the first point you would like to communicate from.": "Klik op het eerste punt waar je van wilt communiceren.",
      "Click somewhere on the globe to select the first point where you would like to send your message from.": "Klik ergens op de aarde om het eerste punt te selecteren waar je je bericht vanaf wilt sturen.",
      "Step 2": "Stap 2",
      "And click where you would like to send your message to": "En klik waar je je bericht naartoe wilt sturen",
      "The satellites are now going to calculate the shortest path between the two points that you selected.": "De satellieten gaan nu het kortste pad berekenen tussen de twee punten die je hebt geselecteerd.",
      "Step 3": "Stap 3",
      "Look at the route your message took!": "Kijk naar de route die je bericht heeft afgelegd!",
      "This is the shortest path between the two points that you selected.": "Dit is het kortste pad tussen de twee punten die je hebt geselecteerd.",
      "Your message took": "Je bericht heeft",
      "hops!": "hops!",
      "And your message flew": "En je bericht vloog",
      "kilometers.": "kilometers.",
      "No path found!": "Geen pad gevonden!",
      "Click here to try again!": "Klik hier om opnieuw te proberen!"

    }
  }

</i18n>
