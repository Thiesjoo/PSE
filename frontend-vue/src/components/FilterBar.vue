<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { SatManager } from '@/common/sat-manager'
import FilterItem from './FilterItem.vue'

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/material.css';
import { ref } from 'vue';

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const manager = new SatManager(props.simulation)
await manager.init()

const filters = manager.currentFilters

// Keeps track of whether sats without launch year should be included
let include_sats_without_launch_year = ref(true)

// Sort satellites ascending and remove sats without launch year
let all_satellites = manager.allSatellites
all_satellites.sort((a, b) => a.launch_year - b.launch_year)
all_satellites = all_satellites.filter((sat) => sat.launch_year !== -1)

// Boundary launch years
const FIRST_LAUNCH_YEAR = all_satellites[0].launch_year
const MOST_RECENT_LAUNCH_YEAR = all_satellites[all_satellites.length-1].launch_year

// Stores the slider values
const slider_values = ref([
  FIRST_LAUNCH_YEAR,
  MOST_RECENT_LAUNCH_YEAR
]);
</script>

<template>
  <div class="left-info-block">
    <div class="tmp">
      <button @click="manager.selectNone()">Unselect All</button>
      <button @click="manager.selectAll()">Select All</button>
      <FilterItem v-for="filter in filters" :key="filter.name" v-model="filter.selected">
        {{ filter.name }} - {{ manager.count[filter.name] }}
      </FilterItem>
      
      <div class="launch-year-filter-block">
        <label>Filter on launch years</label>
        <vue-slider v-model="slider_values" 
          :min="FIRST_LAUNCH_YEAR" 
          :max="MOST_RECENT_LAUNCH_YEAR"
          :min-range="1"
          :enable-cross="false"
          id="launch-year-slider"/>
          
        <input type="checkbox" id="include_without_launch_year" v-model="include_sats_without_launch_year">
        <label for="include_without_launch_year">Include satellites without launch year</label>
      </div>

    </div>
  </div>
</template>

<style scoped lang="scss">
.left-info-block {
  position: absolute;
  top: 0px;
  left: 0;
  width: 320px;
  height: 100%;
  background-color: #05050a7c;
  color: white;
  padding-left: 50px;
  padding-right: 50px;
  padding-top: 10px;
  padding-bottom: 10px;
  border: 2px solid rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  padding: 50px;
}

.tmp {
  display: flex;
  flex-direction: column;
}

.launch-year-filter-block {
  margin-top: 20px;
}

#include_without_launch_year {
  margin-top: 5px;
  margin-right: 5px;
}

</style>
