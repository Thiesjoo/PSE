<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const time = props.simulation.getTime()

const currentTimeString = ref('')

const dateFormatEN = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: "Europe/Amsterdam"
})

const dateFormatNL = new Intl.DateTimeFormat('nl', {
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: "Europe/Amsterdam"
})


const updateCurrentTimeString = () => {
  currentTimeString.value = locale.value === 'en' ? dateFormatEN.format(time.time) : dateFormatNL.format(time.time)
}

onMounted(() => {
  updateCurrentTimeString()
  setInterval(() => {
    updateCurrentTimeString()
  }, 50)
})

const resetTime = () => {
  time.setTime(new Date())
  time.setSpeed(1)
}

const intervals = [1, 10, 100, 1000, 10000]
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
        {{ t('Speed') }} x{{ interval }}
      </button>
      <button @click="resetTime()" class="reset">{{ t('Reset to current time') }}</button>
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

  .reset {
    background-color: #4c56af;
    font-weight: 550;
  }
}
</style>
<i18n>
{
  "en":{
    "Speed": "Speed",
    "Reset to current time": "Reset to current time"
  },
  "nl":{
    "Speed": "Snelheid",
    "Reset to current time": "Herstel naar huidige tijd"
  }
}
</i18n>
