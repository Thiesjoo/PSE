<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { Satellite } from '@/Satellite'
import SpeedButtons from '@/components/SpeedButtons.vue'
import InfoPopup from '@/components/InfoPopup.vue'
import {
  epochUpdate,
  calculateRevolutionPerDay,
  calculateMeanMotionRadPerMin,
  calculateHeight
} from '@/calc_helper'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LeftInfoBlock from '@/components/LeftInfoBlock.vue'
const { t } = useI18n()

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const basic_alt = 153000 + 6371 * 1000 // Add Earth's radius
const showOrbit = ref(true);
const CURRENT_COLOR = '#34b4b5' //Blue
const satellites = ref<Satellite[]>([]);

let sat: Satellite
let current_sat = ref<Satellite | null>(null)
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
  let name = 'New Satellite' + sat_number.toString() + '\n'
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
  picked.value = 0

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

  // Update sat-list
  satellites.value = props.simulation.getNameOfSats()

  return new_sat
}

/**
 * Switch to selected satellite and change color.
 *
 * @param {Satellite} satellite - The satellite to select.
 *  */
function change_selected(satellite: Satellite) {
  if (satellite != sat) {
    // Remove prev orbit display
    if (sat){
      props.simulation.removeOrbit(sat)
    }
    set_current_sat(satellite)
    props.simulation.deselect()
    props.simulation.setCurrentlySelected(satellite)
    props.simulation.changeColor(CURRENT_COLOR, satellite)
    update_display(sat)
    // Show orbit
    create_orbit(satellite)
  }
}

function set_current_sat(satellite: Satellite) {
  sat = satellite
  current_sat.value = sat
}

function create_orbit(satellite: Satellite){
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
const picked = ref(0) // Orbit type is 0 = LEO
let add = ref(0) // Used for adding new satellites (0==false)
let remove = ref(0) // Used for removing all current satellites (0==false)

// Height slider live changes and update radio buttons
watch(height, (Value) => {
  let alt = Value * 1000 + 6371 * 1000 // Convert to meters and add Earth's radius
  sat.satData.no = calculateMeanMotionRadPerMin(alt) // mean motion [rad/min]
  sat.orbit?.recalculate()

  // Changing image with LEO, MEO orbit
  if (Value >= 160 && Value < 2000) {
    picked.value = 0 // LEO
  } else if (Value >= 2000 && Value < 36000) {
    picked.value = 1 // MEO
  } else {
    picked.value = 2 // Other
  }
  props.simulation.resendDataToWorkers()
})

// Inclination slider live changes
watch(inclination, (Value) => {
  sat.satData.inclo = (Value * Math.PI) / 180 // [rad]
  sat.orbit?.recalculate()
  props.simulation.resendDataToWorkers()
})

// RAAN slider live changes
watch(raan, (Value) => {
  sat.satData.nodeo = (Value * Math.PI) / 180 // [rad]
  sat.orbit?.recalculate()
  props.simulation.resendDataToWorkers()
})

// Eccentricity slider live changes
watch(e, (Value) => {
  sat.satData.ecco = Value / 100
  sat.orbit?.recalculate()
  props.simulation.resendDataToWorkers()
})

// ********* first satellite *********
change_selected(add_new_satellite(basic_alt))

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
  <LeftInfoBlock :open="true">
    <br />
    <h2>{{ t('Simulation Variables') }}</h2>
    <br />
    <div class="name-sat">
      <h4 class="display">{{ sat.name }}</h4>
    </div>
    <div class="sliders-sat">
      <br />
      <br />
      <h4>{{t("Height")}} [km]
        <InfoPopup>
        Some Information
       </InfoPopup>
      </h4>
      <div class="slider">
        <input type="range" min="160" max="36000" v-model="height" class="slider" />
        <br />
        <p class="display">Value: {{ height }}</p>
      </div>
      <br />
      <h4>{{t("Inclination")}} [deg] </h4>
      <div class="slider">
        <input type="range" min="0" max="89" v-model="inclination" class="slider" />
        <br />
        <p class="display">Value: {{ inclination }}</p>
      </div>
      <br />
      <h4>{{ t('RAAN') }} [deg]</h4>
      <div class="slider">
        <input type="range" min="0" max="359" v-model="raan" class="slider" />
        <br />
        <p class="display">Value: {{ raan }}</p>
      </div>
      <br />
      <h4>{{ t('Eccentricity') }}</h4>
      <div class="slider">
        <input type="range" min="0" max="99" v-model="e" class="slider" />
        <br />
        <p class="display">Value: {{ e / 100 }}</p>
      </div>
    </div>
    <br />
    <div class="button-box">
      <button class="add-del-button" @click="add = 1" style="text-align: center">
        {{ t('Add satellite') }}
      </button>
      <button class="add-del-button" @click="remove = 1" style="text-align: center">
        {{ t('Delete satellites') }}
      </button>
    </div>
    <div class="orbit-sat">
      <h2>{{ t('Orbit Category') }}</h2>
      <br />
      <div id="categories" style="text-align: center">
        <span :class="{ category: true, highlight: picked === 0 }" id="LEO"> LEO</span>
        <span :class="{ category: true, highlight: picked === 1 }" id="MEO">MEO</span>
        <span :class="{ category: true, highlight: picked == 2 }" id="Other">Other</span>
      </div>

      <div class="orbit-info" v-show="picked === 0">
        <h3>{{ t('Low Earth Orbit') }}</h3>
        <p>{{ t('Height') }}: 160-2000 km</p>
        <img src="/Leo-highlight.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 1">
        <h3>{{ t('Medium Earth Orbit') }}</h3>
        <p>{{ t('Height') }}: 2000-36000 km</p>
        <img src="/Meo-highlight.png" alt="MEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 2">
        <h3>{{ t('Other') }}</h3>
        <p>{{ t('Height') }}: >36000 km</p>
        <img src="/Other-highlight.png" alt="Other Image" width="300" />
      </div>
    </div>
  </LeftInfoBlock>

  <SpeedButtons :simulation="props.simulation" />

  <div class="right-info-block">
    <h2>{{t("Satellites Created")}}</h2>
    <div class="satellite-list">
      <div
        v-for="satellite in satellites"
        :key="satellite.name"
        :class="{ selected: current_sat === satellite }"
        @click="change_selected(satellite as Satellite)"
        class="satellite-item"
      >
        {{ satellite.name }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
h2 {
  text-align: center;
}

h4 {
  text-align: center;
  size: 1rem;
}

h3 {
  text-align: center;
  font-weight: bold;
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
  // appearance: none;
  // width: 50%;
  // padding: 5px;
  // background-color: rgba(45, 155, 156, 0.45);
  // border-radius: 200px;
  // cursor: pointer;
  // color: white;

  margin: 0 5px;
  border: none;
  border-radius: 0.5em;
  padding: 0.5em 1em;
  color: white;
  background-color: rgba(45, 155, 156, 1)

}

.orbit-sat {
  width: 100%;
  padding-top: 10%;
}

.orbit-info {
  right: 20%;
  height: 200px;
  width: 100%;
  padding-top: 2%;
}

.display {
  background: #00000000;
  color: #ffffff;
}

.slider {
  --trackHeight: 0.5rem;
  --thumbRadius: 1rem;
}

.slider input[type='range'] {
  appearance: none;
  width: 100%;
  height: 5px;
  background: #f8faf8;
  outline: #f9fdf9;
  opacity: 1;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
}

.slider::-moz-range-thumb {
  width: var(--thumbRadius);
  height: var(--thumbRadius);
  background: #fefefe;
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
  background-color: rgba(45, 155, 156, 0.6);
  padding: 5px;
}

.right-info-block {
  position: absolute;
  top: 50px;
  right: 0; /* Position it to the right side */
  width: 175px;
  height: 30%;
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
  background-color: rgba(45, 155, 156, 0.45);
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
      "false": "false"
    },
    "nl": {
      "Simulation Variables": "Simulatie Variabelen",
      "Satellites Created": "Satellieten gemaakt",
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
      "false": "onwaar"
    }
  }
</i18n>
