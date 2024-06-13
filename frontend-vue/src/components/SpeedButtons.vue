<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const time = props.simulation.getTime()

const currentTimeString = ref('')

const updateCurrentTimeString = () => {
  currentTimeString.value = time.time.toUTCString()
}

onMounted(() => {
  updateCurrentTimeString()
  setInterval(() => {
    updateCurrentTimeString()
  }, 50)
})

const intervals = [1, 10, 100, 1000]
</script>

<template>
  <div class="wrapper">
    <h1>
      {{ currentTimeString }}
    </h1>
    <div class="speed">
      <button
        v-for="interval in intervals"
        :key="interval"
        @click="time.setSpeed(interval)"
        :class="{
          active: interval === time.multiplier.value
        }"
      >
        Speed x{{ interval }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;

  position: absolute;
  bottom: 0;
  margin: 0 auto;
  margin-bottom: 2em;

  transform: translateX(-50%);

  h1 {
    margin-bottom: 0.3em;
  }
  .speed {
    button {
      margin: 0 5px;
      border: none;
      border-radius: 0.5em;
      padding: 0.5em 1em;
    }
    .active {
      background-color: #4caf50;
    }
  }
}
</style>
