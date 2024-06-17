<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { SatManager } from '@/common/sat-manager'
import FilterItem from './FilterItem.vue'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const manager = new SatManager(props.simulation)
await manager.init()

const filters = manager.currentFilters
</script>

<template>
  <div class="left-info-block">
    <div class="tmp">
      <button @click="manager.selectNone()">Unselect All</button>
      <button @click="manager.selectAll()">Select All</button>
      <FilterItem v-for="filter in filters" :key="filter.name" v-model="filter.selected">
        {{ filter.name }} - {{ manager.count[filter.name] }}
      </FilterItem>
    </div>
  </div>
</template>

<style scoped lang="scss">
.left-info-block {
  position: absolute;
  top: 0px;
  left: 0;
  width: 350px;
  height: 100%;
  background-color: #01023890;
  color: white;
  padding-left: 25px;
  padding-right: 25px;
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
</style>
