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

const value = ref([1960,2024]);

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

    </div>
    <vue-slider v-model="value" :min="1960" :max="2024" :min-range="1" :enable-cross="false" id="launch-year-slider" />
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

#launch-year-slider {
  /* overwrite slider styles */
  margin-top: 20px;
}
</style>
