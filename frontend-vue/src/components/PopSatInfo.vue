<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { computed } from 'vue'
import PopFrame from './PopFrame.vue'
import { countryToNameConversion } from '@/common/countries'

// Aantal getallen achter de komma in satellietinformatie
const numDigits = 3

const props = defineProps<{
  currentSelectedSatellite: Satellite
}>()

const epoch = computed(() => {
  if (!props.currentSelectedSatellite) {
    return ''
  }

  const day = Math.floor(props.currentSelectedSatellite.satData.epochdays)
  const tmpYear = props.currentSelectedSatellite.satData.epochyr
  const year = tmpYear > 50 ? 1900 + tmpYear : 2000 + tmpYear
  const hour =
    24 *
    parseFloat('0.' + props.currentSelectedSatellite.satData.epochdays.toString().split('.')[1])
  const minute = 60 * (hour - Math.floor(hour))

  const date = new Date()
  date.setFullYear(year)
  date.setMonth(0)
  date.setDate(day)
  date.setHours(Math.floor(hour))
  date.setMinutes(Math.floor(minute))
  date.setSeconds(0)
  date.setMilliseconds(0)

  return date.toDateString()
})

const rounded = (num: number, digits: number) => {
  const factor = Math.pow(10, digits)
  return Math.round(num * factor) / factor
}

const sat_speed = () => {
  return Math.sqrt(
    Math.pow(props.currentSelectedSatellite.realSpeed?.x || 0, 2) +
      Math.pow(props.currentSelectedSatellite.realSpeed?.y || 0, 2) +
      Math.pow(props.currentSelectedSatellite.realSpeed?.z || 0, 2)
  )
}
</script>

<template>
  <PopFrame :open="true" class="popup">
    <div class="top">
      <h1>{{ currentSelectedSatellite.name }}</h1>
      <img
        :src="`http://purecatamphetamine.github.io/country-flag-icons/3x2/${currentSelectedSatellite.country}.svg`"
        width="100"
        alt="US flag"
      />

      <p id="SatelliteCountry">{{ countryToNameConversion(currentSelectedSatellite.country) }}</p>
      <p>
        <span>NORAD Catalog Number:</span>
        <span id="SatelliteId">{{ currentSelectedSatellite.id }}</span>
      </p>
    </div>
    <div class="live_info">
      <p>
        Longitude:
        <span id="SatelliteLongitude"
          >{{ rounded(currentSelectedSatellite.realPosition?.lng || 0, numDigits) }}º</span
        >
      </p>
      <p>
        Latitude:
        <span id="SatelliteLatitude"
          >{{ rounded(currentSelectedSatellite.realPosition?.lat || 0, numDigits) }}º
        </span>
      </p>
      <p>
        Altitude:
        <span id="SatelliteAltitude"
          >{{ rounded(currentSelectedSatellite.realPosition?.alt || 0, numDigits) }}km</span
        >
      </p>
      <p>
        Speed:
        <span id="SatelliteSpeed">{{ rounded(sat_speed(), numDigits) }}km/s</span>
      </p>
    </div>
    <div class="epoch">
      <p>Last epoch:</p>
      <p id="SatelliteEpoch">{{ epoch }}</p>
    </div>
  </PopFrame>
</template>

<style scoped lang="scss">
.popup {
  .top {
    //  display items in center
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 1em;
    margin-top: 0;

    #SatelliteCountry {
      margin-bottom: 0.5em;
    }

    img {
      margin-top: 1em;
      margin-bottom: 1em;
      border-radius: 10%;
    }

    // Hier moet lettertype Tommorrow, maar is stuk
    h1 {
      font-family: 'ComputerSaysNo';
      font-size: 3em;
      font-weight: 500;
    }
  }

  .live_info {
    // display: flex;
    // flex-direction: column;
    // align-items: left;
    margin-top: 2em;
    margin-left: 1.3em;
    line-height: 2.5em;
  }

  .epoch {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: fixed;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, -50%);

    line-height: 1.5em;
  }

  p {
    font-family: 'ComputerSaysNo';
    font-size: 2em;
  }

  padding: 1em;
}
</style>
