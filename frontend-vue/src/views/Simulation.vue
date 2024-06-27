<!--
  This file is the view for the simulation page. This page is used to create and edit satellites in the simulation.

  The page consists of two main components:
  - LeftInfoBlock: This component contains sliders to edit the satellite's properties.
  - RightInfoBlock: This component contains a list of satellites and information about the selected satellite.

 -->

<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import {
  calculateHeight,
  calculateMeanMotionRadPerMin,
  calculateRevolutionPerDay,
  epochUpdate
} from '@/calc_helper'
import LeftInfoBlock from '@/components/LeftInfoBlock.vue'
import SpeedButtons from '@/components/SpeedButtons.vue'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import RightInfoBlock from '@/components/RightInfoBlock.vue'
import OrbitInfoBlock from '@/components/OrbitInfoBox.vue'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faTrashCan, faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { CURRENT_COLOR } from '@/common/constants'

const { t } = useI18n()

const props = defineProps<{
  simulation: ThreeSimulation
}>()
await props.simulation.waitUntilFinishedLoading()

const basicAlt = 153000 + 6371 * 1000 // Add Earth's radius
const satellites = ref<Satellite[]>([])

let currentlySelectedSatellite: Satellite
let currentlySelectedSatelliteRef = ref<Satellite | null>(null)
let satNumber = 1 // Used for naming satellites when creating multiple

/**
 * Compiles a TLE for a new satellite with the given altitude.
 *
 * @param alt - The altitude of the satellite.
 */
function tleNewSatellite(alt: number) {
  // Set epoch as current time and alt as 160km
  let epoch = epochUpdate()
  let mean_motion = calculateRevolutionPerDay(alt)

  // Initializing own satelite
  let name = t('Satellite ') + satNumber.toString() + '\n'
  let catN = satNumber.toString().padStart(5, '0')
  let part1 = '1 ' + catN + 'U 24001A   ' + epoch + ' -.00000000 00000000 00000-0 0 1111 1'
  let part2 = '\n2 11111 000.0000 000.0000 0000000 000.0000 000.0000 '
  let part3 = '000001'
  let tle = name + part1 + part2 + mean_motion + part3
  satNumber = satNumber + 1
  return tle
}

/**
 * Set to initial values or the values of a selected satellite
 *
 * @param {Satellite} sat - The satellite to reset the sliders to.
 */
function updateDisplay(sat: Satellite) {
  height.value = calculateHeight(sat.satData.no)
  inclination.value = +((sat.satData.inclo * 180) / Math.PI).toFixed(0)
  raan.value = +((sat.satData.nodeo * 180) / Math.PI).toFixed(0)
  e.value = sat.satData.ecco * 100
  picked.value = ''

  // Update sat-list
  satellites.value = props.simulation.getNameOfSats()
}

/**
 * Adds a new satellite to the simulation.
 *
 * @param {number} alt - The altitude for the new satellite.
 * @returns {Satellite} The newly created satellite.
 */
function addNewSatellite(alt: number) {
  // Creating Satellite object and adding it to simulation
  let tle = tleNewSatellite(alt)
  const sats = Satellite.fromMultipleTLEs(tle)
  props.simulation.addSatellites(sats)
  let new_sat = sats[0]

  //  Some settings
  updateDisplay(new_sat)
  new_sat.country = 'NL'

  // Add orbit
  createOrbit(new_sat)

  return new_sat
}

/**
 * Switch to selected satellite and change color.
 *
 * @param {Satellite} satellite - The satellite to select.
 *  */
function change_selected(satellite: Satellite) {
  if (satellite != currentlySelectedSatellite) {
    // Remove prev orbit display
    if (currentlySelectedSatellite) {
      props.simulation.removeOrbit(currentlySelectedSatellite)
    }
    setCurrentSat(satellite)
    props.simulation.deselect()
    props.simulation.setCurrentlySelected(satellite, true)
    props.simulation.changeColor(CURRENT_COLOR, satellite)

    updateDisplay(currentlySelectedSatellite)
    // Show orbit
    createOrbit(satellite)
  }
}

function setCurrentSat(satellite: Satellite) {
  currentlySelectedSatellite = satellite
  currentlySelectedSatelliteRef.value = currentlySelectedSatellite
}

function createOrbit(satellite: Satellite) {
  // Add orbit
  props.simulation.removeOrbit(satellite)
  const orbit = props.simulation.addOrbit(satellite, true)
  satellite.setOrbit(orbit)
}

// ********* SLIDERS *********

// Initializing slider variables
const height = ref(160)
const inclination = ref(0)
const raan = ref(0)
const e = ref(0)
const picked = ref('LEO') // Orbit type is 0 = LEO
let add = ref(0) // Used for adding new satellites (0==false)
let remove = ref(0) // Used for removing all current satellites (0==false)

// Height slider live changes and update radio buttons
watch(height, (Value) => {
  let alt = Value * 1000 + 6371 * 1000 // Convert to meters and add Earth's radius
  currentlySelectedSatellite.satData.no = calculateMeanMotionRadPerMin(alt) // mean motion [rad/min]
  currentlySelectedSatellite.orbit?.recalculate()

  // Changing image with LEO, MEO orbit
  if (Value >= 160 && Value < 2000) {
    picked.value = 'LEO' // LEO
  } else if (Value >= 2000 && Value < 36000) {
    picked.value = 'MEO' // MEO
  } else {
    picked.value = 'GEO' // Other
  }
  props.simulation.resendDataToWorkers()
})

// Inclination slider live changes
watch(inclination, (Value) => {
  currentlySelectedSatellite.satData.inclo = (Value * Math.PI) / 180 // [rad]
  currentlySelectedSatellite.orbit?.recalculate()

  // Changing right info box to eccenticity information
  if (Value == 0) {
    picked.value = 'I0'
  } else if (Value > 0 && Value < 45) {
    picked.value = 'I45'
  } else {
    picked.value = 'I90'
  }
  props.simulation.resendDataToWorkers()
})

// RAAN slider live changes
watch(raan, (Value) => {
  currentlySelectedSatellite.satData.nodeo = (Value * Math.PI) / 180 // [rad]
  currentlySelectedSatellite.orbit?.recalculate()

  // Changing right info box to RAAN information
  if (Value == 0) {
    picked.value = 'RAAN0'
  } else if (Value < 90) {
    picked.value = 'RAAN90'
  } else if (Value >= 90 && Value < 180) {
    picked.value = 'RAAN180'
  } else if (Value >= 180 && Value < 270) {
    picked.value = 'RAAN270'
  } else {
    picked.value = 'RAAN360'
  }
  props.simulation.resendDataToWorkers()
})

// Eccentricity slider live changes
watch(e, (Value) => {
  currentlySelectedSatellite.satData.ecco = Value / 100
  currentlySelectedSatellite.orbit?.recalculate()

  // Changing right info box to eccenticity information
  if (Value == 0) {
    picked.value = 'E0'
  } else if (Value > 0 && Value < 30) {
    picked.value = 'E30'
  } else if (Value > 30 && Value < 60) {
    picked.value = 'E60'
  } else {
    picked.value = 'E90'
  }
  props.simulation.resendDataToWorkers()
})

// ********* first satellite *********
onMounted(() => {
  change_selected(addNewSatellite(basicAlt))
})

// ********* ADD SATELLITE BUTTON *********
watch(add, (newValue) => {
  if (newValue === 1) {
    change_selected(addNewSatellite(basicAlt))
    add.value = 0 // Reset 'add' to 0 (false)
  }
})

// ********* REMOVE SAT BUTTON *********
watch(remove, (newValue) => {
  if (newValue === 1) {
    props.simulation.reset()
    remove.value = 0 // Reset 'add' to 0 (false)
    satNumber = 1 // Resets the naming

    setCurrentSat(addNewSatellite(basicAlt))
  }
})

// ********* Clicked sat can be edited *********
props.simulation.addEventListener('select', (satellite) => {
  if (satellite) {
    change_selected(satellite)
  }
})
</script>

<template>
  <LeftInfoBlock :open="true" class="container">
    <br />
    <h2>{{ t('Create your own satellite') }}</h2>
    <p>{{ t('Drag the sliders to see what happens to your satellite!') }}</p>
    <br />
    <div class="name-sat">
      <h3 class="display">{{ currentlySelectedSatelliteRef?.name }}</h3>
    </div>
    <br />
    <div class="sliders-sat">
      <br />
      <br />
      <h4>
        {{ t('Height') }}
        <button class="info_button" @click="picked = 'LEO'" style="text-align: center">
          <FontAwesomeIcon :icon="faInfoCircle" />
        </button>
      </h4>
      <div class="slider">
        <input type="range" min="160" max="36000" v-model="height" class="slider" />
        <br />
        <p class="display">Value: {{ height }} km</p>
      </div>
      <br />
      <h4>
        {{ t('Inclination') }}
        <button class="info_button" @click="picked = 'I0'" style="text-align: center">
          <FontAwesomeIcon :icon="faInfoCircle" />
        </button>
      </h4>
      <div class="slider">
        <input type="range" min="0" max="89" v-model="inclination" class="slider" />
        <br />
        <p class="display">Value: {{ inclination }} &deg;</p>
      </div>
      <br />
      <h4>
        {{ t('RAAN') }}
        <button class="info_button" @click="picked = 'RAAN0'" style="text-align: center">
          <FontAwesomeIcon :icon="faInfoCircle" />
        </button>
      </h4>
      <div class="slider">
        <input type="range" min="0" max="359" v-model="raan" class="slider" />
        <br />
        <p class="display">Value: {{ raan }} &deg;</p>
      </div>
      <br />
      <h4>
        {{ t('Eccentricity') }}
        <button class="info_button" @click="picked = 'E0'" style="text-align: center">
          <FontAwesomeIcon :icon="faInfoCircle" />
        </button>
      </h4>
      <div class="slider">
        <input type="range" min="0" max="99" v-model="e" class="slider" />
        <br />
        <p class="display">Value: {{ e / 100 }}</p>
      </div>
    </div>
    <br />
    <div class="button-box">
      <button class="add-del-button" @click="add = 1" style="text-align: center">
        <FontAwesomeIcon :icon="faPlus" />
      </button>
    </div>
  </LeftInfoBlock>
  <RightInfoBlock :open="!props.simulation.mobile.value">
    <div class="right-info-box">
      <h2>{{ t('Satellites Created') }}</h2>
      <div class="satellite-list">
        <div
          v-for="(satellite, index) in satellites"
          :key="satellite.name"
          :class="{ selected: currentlySelectedSatelliteRef === satellite }"
          @click="change_selected(satellite as Satellite)"
          class="satellite-item"
        >
          {{ t('Satellite') + ' ' + (index + 1) }}
        </div>
      </div>
      <button class="add-del-button " @click="remove = 1" style="text-align: center">
        <FontAwesomeIcon :icon="faTrashCan" />
      </button>
    </div>
    <OrbitInfoBlock :picked="picked" class="orbit-order" v-if="!props.simulation.mobile.value" />
  </RightInfoBlock>
  <SpeedButtons :simulation="props.simulation" />
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
@import '@/common/scrollbar.scss';
.container {
  color: $main_text;
  padding-top: 2em;
  padding-right: 1em;
  padding-left: 1em;
  font-family: 'Tomorrow';
}

h2 {
  text-align: center;
  font-family: 'Tomorrow';
  font-size: 2em;
}

p {
  font-family: 'Tomorrow';
  font-size: 1.2em;
  text-align: center;
}

h4 {
  text-align: center;
  size: 1rem;
  font-size: 1.5rem;
  font-family: 'Tomorrow';
}

h3 {
  text-align: center;
  font-weight: bold;
  font-size: 1.5rem;
  font-family: 'Tomorrow';
}

.name-sat {
  display: flex;
  flex-direction: row;
  justify-content: center;
  font-size: 2em;

  h4 {
    font-weight: 500;
  }
}

.sliders-sat {
  display: flex;
  flex-direction: column;
  top: 10px;
}

.button-box {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.add-del-button {
  border: none;
  font-size: 35px;
  border-radius: 0.5em;
  padding: 0.5em 1em;
  color: $main_text;
  background-color: $add_del_button;
  border: 1px solid $button_border_box;
  width: 100%;
}

.del-button {
  padding: 0.2em;
  margin-top: 0.4em;
}

.info_button {
  width: 20px;
  height: 20px;
  border-radius: 50%; /* Makes the button circular */
  background-color: transparent; /* Remove background color */
  color: rgba(215, 217, 220, 0.7);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  text-decoration: none;
}

.info_button:hover {
  color: $main_text;
}

.info_button {
  width: 20px;
  height: 20px;
  border-radius: 50%; /* Makes the button circular */
  background-color: transparent; /* Remove background color */
  color: rgba(215, 217, 220, 0.7);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  text-decoration: none;
}

.info_button:hover {
  color: $main_text;
}

.orbit-order {
  order: 2;
  margin-top: 10px;
}

.display {
  color: $main_text;
}

.slider {
  --trackHeight: 0.5rem;
  --thumbRadius: 1rem;
}

.slider input[type='range'] {
  appearance: none;
  width: 100%;
  height: 5px;
  background: $slider_bar;
  accent-color: $slider_button;
  opacity: 1;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
}

.slider::-moz-range-thumb {
  width: var(--thumbRadius);
  height: var(--thumbRadius);
  cursor: pointer;
}

.category {
  display: inline-table;
  align-content: center;
  margin-right: 5px;
  width: var(--text-width);
  font-size: 14px;
}

.highlight {
  background-color: $orbit_highlight;
  padding: 5px;
}

.right-info-box {
  align-self: end;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 15vw;
  height: 40%;
  background-color: $pop_up_background;
  color: $main_text;
  border: 2px solid $pop_up_border;
  border-radius: 12px;
  padding: 15px;
  font-family: 'Tomorrow';
}

.satellite-list {
  overflow-y: auto; /* Enable vertical scroll if needed */
  max-height: 65%; /* Limit max height to parent height */
}

.styled-button {
  background: none; /* Remove background color */
  border: none; /* Remove border */
  padding: 0; /* Remove padding */
  margin: 0; /* Remove margin */
  cursor: pointer; /* Make cursor pointer to indicate it's clickable */
  display: inline-flex; /* Ensure the button is inline */
  align-items: center; /* Center items vertically */
}

.styled-button .icon {
  // display: inline-block; /* Ensure the icon is inline */
  position: relative;
  display: inline-block;
  flex-direction: row;
  justify-content: flex-end;
}

.satellite-item {
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
}

.satellite-item.selected {
  background-color: $list_background;
}
</style>
<i18n>
  {
    "en": {
      "Create your own satellite": "Create your own satellite",
      "Satellites Created": "Satellites Created",
      "New satellite": "New Satellite",
      "Height": "Height",
      "Inclination": "Inclination",
      "RAAN": "RAAN",
      "Eccentricity": "Eccentricity",
      "Add satellite": "Add satellite",
      "Delete satellites": "Delete satellites",
      "Show orbit": "Show orbit",
      "Orbit Category": "Orbit Category",
      "Low Earth Orbit": "Low Earth Orbit",
      "Medium Earth Orbit": "Medium Earth Orbit",
      "Other": "Other",
      "true": "true",
      "false": "false",
      "info H": "The height of the satellite above the Earth's surface.",
      "info Incl": "The angle of the orbit of the satellite.",
      "info R": "The longitude on which the satellite crosses the equator from south to north.",
      "info E": "The eccentricity of the orbit.",
      "Satellite": "Satellite",
      "Drag the sliders to see what happens to your satellite!": "Drag the sliders to see what happens to your satellite!"
    },
    "nl": {
      "Create your own satellite": "Maak je eigen satelliet",
      "Satellites Created": "Gemaakte Satellieten",
      "New satellite": "Nieuwe satelliet",
      "Height": "Hoogte",
      "Inclination": "Inclinatie",
      "RAAN": "RAAN",
      "Eccentricity": "Excentriciteit",
      "Add satellite": "Voeg een satelliet toe",
      "Delete satellites": "Verwijder satellieten",
      "Show orbit": "Toon baan",
      "Orbit Category": "Baancategorie",
      "Low Earth Orbit": "Lage Omloopbaan",
      "Medium Earth Orbit": "Middelhoge Omloopbaan",
      "Other": "Andere",
      "true": "waar",
      "false": "onwaar",
      "info H": "De hoogte van de satelliet boven het aardoppervlak.",
      "info Incl": "De hoek van de baan van de satelliet.",
      "info R": "De lengtegraad waarop de satelliet de evenaar van zuid naar noord kruist.",
      "info E": "De excentriciteit van de baan.",
      "Satellite": "Satelliet",
      "Drag the sliders to see what happens to your satellite!": "Sleep de sliders om te zien wat er met je satelliet gebeurt!"
    }
  }
</i18n>
