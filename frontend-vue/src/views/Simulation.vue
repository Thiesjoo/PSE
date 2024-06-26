<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import {
  calculateHeight,
  calculateMeanMotionRadPerMin,
  calculateRevolutionPerDay,
  epochUpdate
} from '@/calc_helper'
import InfoPopup from '@/components/InfoPopup.vue'
import LeftInfoBlock from '@/components/LeftInfoBlock.vue'
import SpeedButtons from '@/components/SpeedButtons.vue'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import RightInfoBlock from '@/components/RightInfoBlock.vue'
import OrbitInfoBlock from '@/components/OrbitInfoBox.vue'
const { t } = useI18n()

const props = defineProps<{
  simulation: ThreeSimulation
}>()
await props.simulation.waitUntilFinishedLoading()

const basic_alt = 153000 + 6371 * 1000 // Add Earth's radius
const CURRENT_COLOR = '#34b4b5' //Blue
const satellites = ref<Satellite[]>([])

let currentlySelectedSatellite: Satellite
let currentlySelectedSatelliteRef = ref<Satellite | null>(null)
let sat_number = 1 // Used for naming satellites when creating multiple

/**
 * Compiles a TLE for a new satellite with the given altitude.
 *
 * @param alt - The altitude of the satellite.
 */
function tle_new_satellite(alt: number) {
  // Set epoch as current time and alt as 160km
  let epoch = epochUpdate()
  let mean_motion = calculateRevolutionPerDay(alt)

  // Initializing own satelite
  let name = t('Satellite ') + sat_number.toString() + '\n'
  let cat_n = sat_number.toString().padStart(5, '0')
  let part1 = '1 ' + cat_n + 'U 24001A   ' + epoch + ' -.00000000 00000000 00000-0 0 1111 1'
  let part2 = '\n2 11111 000.0000 000.0000 0000000 000.0000 000.0000 '
  let part3 = '000001'
  let tle = name + part1 + part2 + mean_motion + part3
  sat_number = sat_number + 1
  return tle
}

/**
 * Set to initial values or the values of a selected satellite
 *
 * @param {Satellite} sat - The satellite to reset the sliders to.
 */
function update_display(sat: Satellite) {
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
function add_new_satellite(alt: number) {
  // Creating Satellite object and adding it to simulation
  let tle = tle_new_satellite(alt)
  const sats = Satellite.fromMultipleTLEs(tle)
  sats.forEach((sat) => props.simulation.addSatellite(sat))
  let new_sat = sats[0]

  //  Some settings
  update_display(new_sat)
  new_sat.country = 'NL'

  // Add orbit
  create_orbit(new_sat)

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
    set_current_sat(satellite)
    props.simulation.deselect()
    props.simulation.setCurrentlySelected(satellite, true)
    props.simulation.changeColor(CURRENT_COLOR, satellite)

    update_display(currentlySelectedSatellite)
    // Show orbit
    create_orbit(satellite)
  }
}

function set_current_sat(satellite: Satellite) {
  currentlySelectedSatellite = satellite
  currentlySelectedSatelliteRef.value = currentlySelectedSatellite
}

function create_orbit(satellite: Satellite) {
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
  change_selected(add_new_satellite(basic_alt))
})

// ********* ADD SATELLITE BUTTON *********
watch(add, (newValue) => {
  if (newValue === 1) {
    change_selected(add_new_satellite(basic_alt))
    add.value = 0 // Reset 'add' to 0 (false)
  }
})

// ********* REMOVE SAT BUTTON *********
watch(remove, (newValue) => {
  if (newValue === 1) {
    props.simulation.reset()
    remove.value = 0 // Reset 'add' to 0 (false)
    sat_number = 1 // Resets the naming

    set_current_sat(add_new_satellite(basic_alt))
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
  <head>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
      integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
  </head>
  <LeftInfoBlock :open="true" class="container">
    <br />
    <h2>{{ t('Simulation Variables') }}</h2>
    <br />
    <div class="name-sat">
      <h4 class="display">{{ currentlySelectedSatelliteRef?.name }}</h4>
    </div>
    <br />
    <div class="sliders-sat">
      <br />
      <br />
      <h4>
        {{ t('Height') }} [km]
        <InfoPopup class="icon"> {{ t('info H') }} </InfoPopup>
      </h4>
      <div class="slider">
        <input type="range" min="160" max="36000" v-model="height" class="slider" />
        <br />
        <p class="display">Value: {{ height }}</p>
      </div>
      <br />
      <h4>
        {{ t('Inclination') }} [deg]
        <InfoPopup class="icon"> {{ t('info Incl') }} </InfoPopup>
      </h4>
      <div class="slider">
        <input type="range" min="0" max="89" v-model="inclination" class="slider" />
        <br />
        <p class="display">Value: {{ inclination }}</p>
      </div>
      <br />
      <h4>
        {{ t('RAAN') }} [deg]
        <InfoPopup class="icon"> {{ t('info R') }} </InfoPopup>
      </h4>
      <div class="slider">
        <input type="range" min="0" max="359" v-model="raan" class="slider" />
        <br />
        <p class="display">Value: {{ raan }}</p>
      </div>
      <br />
      <h4>
        {{ t('Eccentricity') }}
        <InfoPopup class="icon"> {{ t('info E') }} </InfoPopup>
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
        <i class="fa-solid fa-plus"></i>
        <!-- {{ t('Add satellite') }} -->
      </button>
      <button class="add-del-button" @click="remove = 1" style="text-align: center">
        <i class="fa-regular fa-trash-can"></i>
        <!-- {{ t('Delete satellites') }} -->
      </button>
    </div>
  </LeftInfoBlock>
  <RightInfoBlock :open="true">
    <!-- Information box HEIGHT -->
    <!-- <div class="orbit-info-box" v-show="picked === 'LEO' || picked === 'MEO' || picked === 'GEO'">
      <h2>{{ t('Orbit Category') }}</h2>
      <div class="orbit-info" v-show="picked === 'LEO'">
        <h3>{{ t('Low Earth Orbit') }}</h3>
        <h4>{{ t('Height') }}: 160-2000 km</h4>
        <img src="/Leo-highlight.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'MEO'">
        <h3>{{ t('Medium Earth Orbit') }}</h3>
        <h4>{{ t('Height') }}: 2000-36000 km</h4>
        <img src="/Meo-highlight.png" alt="MEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'GEO'">
        <h3>{{ t('Other') }}</h3>
        <h4>{{ t('Height') }}: >36000 km</h4>
        <img src="/Other-highlight.png" alt="Other Image" width="300" />
      </div>
    </div> -->
    <!-- Information box INCLINATION -->
    <!-- <div class="orbit-info-box" v-show="picked === 'I0' || picked === 'I45' || picked === 'I90'">
      <h2>{{ t('Inclination') }}</h2>
      <h4>
        Orbit inclination is the angle at which orbit is tilted compared to path around equator.
      </h4>
      <div class="orbit-info" v-show="picked === 'I0'">
        <h4>{{ t('Inclination') }}: 0 &deg</h4>
        <img src="/inclination0.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'I45'">
        <h4>{{ t('Inclination') }}: &lt 45 &deg</h4>
        <img src="/inclination45.png" alt="MEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'I90'">
        <h4>{{ t('Inclination') }}: 45-89 &deg</h4>
        <img src="/inclination85.png" alt="Other Image" width="300" />
      </div>
    </div> -->
    <!-- Information box RAAN -->
    <!-- <div
      class="orbit-info-box"
      v-show="
        picked === 'RAAN0' ||
        picked === 'RAAN90' ||
        picked === 'RAAN180' ||
        picked === 'RAAN270' ||
        picked === 'RAAN360'
      "
    >
      <h2>{{ t('Right Ascension of the Ascending Node') }}</h2>
      <h4>RAAN determines at what longitude satellite crosses the equator.</h4>
      <div class="orbit-info" v-show="picked === 'RAAN0'">
        <h4>{{ t('RAAN') }}: 0 &deg</h4>
        <img src="/Leo-highlight.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'RAAN90'">
        <h4>{{ t('RAAN') }}: &lt 90 &deg</h4>
        <img src="/Meo-highlight.png" alt="MEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'RAAN180'">
        <h4>{{ t('RAAN') }}: 90-180 &deg</h4>
        <img src="/Other-highlight.png" alt="Other Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'RAAN270'">
        <h4>{{ t('RAAN') }}: 180-270 &deg</h4>
        <img src="/Other-highlight.png" alt="Other Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'RAAN360'">
        <h4>{{ t('RAAN') }}: 270-360 &deg</h4>
        <img src="/Other-highlight.png" alt="Other Image" width="300" />
      </div>
    </div> -->
    <!-- Information box ECCENTRICITY -->
    <!-- <div
      class="orbit-info-box"
      v-show="picked === 'E0' || picked === 'E30' || picked === 'E60' || picked === 'E90'"
    >
      <h2>{{ t('Orbit Eccentricity') }}</h2>
      <h4>
        Orbit eccentricity is how much an orbit looks like an oval instead of a perfect circle
        <i class="fa-regular fa-circle"></i>.
      </h4>
      <div class="orbit-info" v-show="picked === 'E0'">
        <h3>{{ t('Circular Orbit') }}</h3>
        <h4>{{ t('Eccentricity') }}: 0</h4>
        <img src="/eccentricity-0.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'E30'">
        <h3>{{ t('Slight Elliptical shape') }}</h3>
        <h4>{{ t('Eccentricity') }}: &lt 0.3</h4>
        <img src="/eccentricity-4.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'E60'">
        <h3>{{ t('More Elliptical shape') }}</h3>
        <h4>{{ t('Eccentricity') }}: 0.3 - 0.6</h4>
        <img src="/eccentricity-75.png" alt="MEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'E90'">
        <h3>{{ t('Ellipse') }}</h3>
        <h4>{{ t('Eccentricity') }}: >0.60</h4>
        <img src="/eccentricity-95.png" alt="Other Image" width="300" />
      </div>
    </div> -->
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
    </div>
    <OrbitInfoBlock :picked="picked" class="orbit-order" />
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
}

h2 {
  text-align: center;
  font-family: 'Tomorrow';
}

h4 {
  text-align: center;
  size: 1rem;
}

h3 {
  text-align: center;
  font-weight: bold;
}

.icon {
  // override the infopopup style
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}

.name-sat {
  display: flex;
  flex-direction: row;
  justify-content: center;
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
  margin: 0 5px;
  border: none;
  font-size: 35px;
  border-radius: 0.5em;
  padding: 0.5em 1em;
  color: $main_text;
  background-color: $button_background_box;
  border: 1px solid $button_border_box;
}

.orbit-order {
  order: 2;
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
  width: 90%;
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
  width: 175px;
  height: 30%;
  background-color: $pop_up_background;
  color: $main_text;
  padding-left: 15px;
  padding-right: 15px;
  padding-top: 10px;
  padding-bottom: 10px;
  border: 2px solid $pop_up_border;
  border-radius: 12px;
  padding: 15px;
}

.satellite-list {
  overflow-y: auto; /* Enable vertical scroll if needed */
  max-height: 65%; /* Limit max height to parent height */
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
      "Simulation Variables": "Simulation Variables",
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
      "Satellite": "Satellite"
    },
    "nl": {
      "Simulation Variables": "Simulatie Variabelen",
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
      "Satellite": "Satelliet"
    }
  }
</i18n>
