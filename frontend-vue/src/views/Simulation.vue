<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { Satellite } from '@/Satellite'
import SpeedButtons from '@/components/SpeedButtons.vue'
import { epochUpdate, calculateRevolutionPerDay, calculateMeanMotionRadPerMin } from '@/calc_helper'
import { ref, watch } from 'vue'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

let sat_number = 1 // Used for naming satellites when creating multiple
let tle;
const basic_alt = 160000 + 6371 * 1000 // Add Earth's radius
const showOrbit = ref(false);

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

function reset_sliders(){
    height.value = 160;
    inclination.value = 0;
    raan.value = 0;
    e.value = 0;
    picked.value = 0;
}

function add_new_satellite(alt: number){
    let tle = tle_new_satellite(alt);
    const sats = Satellite.fromMultipleTLEs(tle);
    sats.forEach((sat) => props.simulation.addSatellite(sat));
    reset_sliders()
    if (showOrbit.value){
      const orbit = props.simulation.addOrbit(sats[0], true);
      sats[0].setOrbit(orbit);
    }
    return sats[0]
}

// ********* SLIDERS *********

// Initializing slider variables
const height = ref(160)
const inclination = ref(0)
const raan = ref(0)
const e = ref(0)
const picked = ref(0) // Orbit type is 0 = LEO
let add = ref(0); // Used for adding new satellites (0==false)
let remove = ref(0); // Used for removing all current satellites (0==false)

// Height slider live changes and update radio buttons
watch(height, (Value) => {
  let alt = Value * 1000 + 6371 * 1000 // Convert to meters and add Earth's radius
  sat.satData.no = calculateMeanMotionRadPerMin(alt) // mean motion [rad/min]
  sat.orbit?.recalculate();
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
  sat.orbit?.recalculate();
  props.simulation.resendDataToWorkers()
})

// RAAN slider live changes
watch(raan, (Value) => {
  sat.satData.nodeo = (Value * Math.PI) / 180 // [rad]
  sat.orbit?.recalculate();
  props.simulation.resendDataToWorkers()
})

// Eccentricity slider live changes
watch(e, (Value) => {
  sat.satData.ecco = Value / 100
  sat.orbit?.recalculate();
  props.simulation.resendDataToWorkers()
})

// ********* first satellite *********
let sat = add_new_satellite(basic_alt);

// ********* ADD SATELLITE BUTTON *********
watch(add, (newValue) => {
      if (newValue === 1) {
        sat = add_new_satellite(basic_alt);
        add.value = 0 // Reset 'add' to 0 (false)
      }
    })

// ********* REMOVE SAT BUTTON *********
watch(remove, (newValue) => {
      if (newValue === 1) {

        props.simulation.reset();
        remove.value = 0; // Reset 'add' to 0 (false)
        sat_number = 1; // Resets the naming

        sat = add_new_satellite(basic_alt);
      }
    })

// ********* ORBIT shown *********

watch(showOrbit, (newValue) => {
  if (newValue === true){
    const orbit = props.simulation.addOrbit(sat, true);
    sat.setOrbit(orbit)
  }
  else{
    props.simulation.removeOrbit(sat);
  }
})

// ********** SAT NAME **********
const satName = ref('New Satellite 1')
</script>

<template>
  <div class="left-info-block">
    <br />
    <h2>Simulation Variables</h2>
    <br />
    <div class="name-sat">
      <h4 class="display">{{ satName }}</h4>
    </div>
    <div class="sliders-sat">
      <h4>Height</h4>
      <div class="slider">
        <input type="range" min="160" max="36000" v-model="height" class="slider" />
        <br />
        <p class="display">Value: {{ height }}</p>
      </div>
      <br />
      <h4>Inclination</h4>
      <div class="slider">
        <input type="range" min="0" max="90" v-model="inclination" class="slider" />
        <br />
        <p class="display">Value: {{ inclination }}</p>
      </div>
      <br />
      <h4>RAAN</h4>
      <div class="slider">
        <input type="range" min="0" max="360" v-model="raan" class="slider" />
        <br />
        <p class="display">Value: {{ raan }}</p>
      </div>
      <br />
      <h4>Eccentricity</h4>
      <div class="slider">
        <input type="range" min="0" max="100" v-model="e" class="slider" />
        <br />
        <p class="display">Value: {{ e / 100 }}</p>
      </div>
    </div>
    <br />
    <div class="button-box">
      <button class="add-button" @click="add = 1" style="text-align: center">Add another satellite</button>
      <button class="del-button" @click="remove = 1" style="text-align: center">Delete satellites</button>
    </div>
    <div class="show-orbit-check">
      <input type="checkbox" id="show-orbit" v-model="showOrbit" />
      <label for="show-orbit">Show orbit {{ showOrbit }}</label>
    </div>
    <div class="orbit-sat">
      <h2>Orbit Category</h2>
      <br />
      <div id="categories" style="text-align: center">
        <span :class="{ category: true, highlight: picked === 0 }" id="LEO"> LEO</span>
        <span :class="{ category: true, highlight: picked === 1 }" id="MEO">MEO</span>
        <span :class="{ category: true, highlight: picked == 2 }" id="Other">Other</span>
      </div>
      <div class="orbit-info" v-show="picked === 0">
        <h3>Low Earth Orbit</h3>
        <p>Height: 160-2000 km</p>
        <img src="/Leo-highlight.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 1">
        <h3>Medium Earth Orbit</h3>
        <p>Height: 2000-36000 km</p>
        <img src="/Meo-highlight.png" alt="MEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 2">
        <h3>Other</h3>
        <p>Height: >36000 km</p>
        <img src="/Other-highlight.png" alt="Other Image" width="300" />
      </div>
    </div>
  </div>
  <SpeedButtons :simulation="props.simulation" />
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

.left-info-block {
  position: absolute;
  top: 0px;
  left: 0;
  width: 350px;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-evenly;
  align-items: stretch;
  background-color: #05050a7c;
  color: white;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 10px;
  padding-bottom: 10px;
  border: 2px solid rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  padding: 25px;
}

.name-sat{
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 5%
}

.sliders-sat {
  display: flex;
  flex-direction: column;
  top: 10px;
  padding-bottom: 10%;
}

.button-box{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 5%;
}

.add-button {
  appearance: none;
  width: 50%;
  padding: 5px;
  background-color: rgba(195, 0, 255, 0.36);
  border-radius: 200px;
  cursor: pointer;
  color: white;
}

.del-button{
  justify-content: space-around;;
  appearance: none;
  background-color: rgba(195, 0, 255, 0.36);
  border-radius: 200px;
  color: white;
}

.show-orbit-check{
  display: flex;
  bottom: 50px;
  padding: 5%;
  padding-bottom: 5%;
}

.orbit-sat {
  width: 100%;
  padding-top: 10%;
}

.orbit-info {
  right: 20%;
  height: 200px;
  width: 100%;
  padding-top: 5%;
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
  background: #e8f8e5;
  outline: #e8f8e5;
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
  padding: 10px;
  font-size: 14px;
}

.highlight {
  background-color: rgba(195, 0, 255, 0.36);
}

</style>
