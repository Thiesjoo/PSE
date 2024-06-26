<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

const props = defineProps<{
  simulation: ThreeSimulation
  showOnlyTime?: boolean
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
  timeZone: 'Europe/Amsterdam'
})

const dateFormatNL = new Intl.DateTimeFormat('nl', {
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Amsterdam'
})

const updateCurrentTimeString = () => {
  currentTimeString.value =
    locale.value === 'en' ? dateFormatEN.format(time.time) : dateFormatNL.format(time.time)
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

const intervals = [1, 10, 100, 1000]
</script>

<template>
  <div class="wrapper">
    <h1>
      {{ currentTimeString }}
    </h1>
    <div class="speed">
      <template v-if="props.showOnlyTime === undefined || !props.showOnlyTime">
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
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
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
  color: $main_text;

  h1 {
    margin-bottom: 0.3em;
    font-variant-numeric: tabular-nums;
  }
  .speed {
    button {
      margin: 0 5px;
      border: none;
      border-radius: 0.5em;
      padding: 0.5em 1em;
      background-color: $button_background;
      color: $main_text;
    }
    .active {
      background-color: $button_selected;
    }
    .reset {
      font-weight: 550;
      color: $main_text;
      background-color: $reset_button_background;
    }
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
