<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { computed, getCurrentInstance, onUnmounted, ref, watch } from 'vue'
import PopFrame from './PopFrame.vue'
import { countryToNameConversion } from '@/common/countries'
import InfoPopup from '@/components/InfoPopup.vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n() 

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

  const localeCode = locale.value === 'nl' ?  'nl-NL' : 'en-US'

  return date.toLocaleTimeString(localeCode, {
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
})

const rounded = (num: number, digits: number) => {
  const factor = Math.pow(10, digits)
  return Math.round(num * factor) / factor
}


const speed = computed(() => {
  if (!props.currentSelectedSatellite) {
    return ''
  }
  return rounded(props.currentSelectedSatellite.realSpeed.value, numDigits)
})

const key = ref(0)
const interval = setInterval(() => {
    key.value++
}, 10000)

onUnmounted(() => {
  clearInterval(interval)
})

</script>

<template>
  <PopFrame :open="true" class="popup" >
    <div class="top" :key="key">
      <h1>{{ currentSelectedSatellite.name }}
        <InfoPopup>
            description
        </InfoPopup>
      </h1>

      <img
        :src="`http://purecatamphetamine.github.io/country-flag-icons/3x2/${currentSelectedSatellite.country}.svg`"
        width="100"
        :alt="`${currentSelectedSatellite.country} flag`"
        v-if="!currentSelectedSatellite.country.includes('/')"
      />
      <div v-else>
        <img
          :src="`http://purecatamphetamine.github.io/country-flag-icons/3x2/${currentSelectedSatellite.country.split('/')[0]}.svg`"
          width="100"
          :alt="`${currentSelectedSatellite.country.split('/')[0]} flag`"
        />
        <img
          :src="`http://purecatamphetamine.github.io/country-flag-icons/3x2/${currentSelectedSatellite.country.split('/')[1]}.svg`"
          width="100"
          :alt="`${currentSelectedSatellite.country.split('/')[1]} flag`"
        />
      </div>
      <p id="SatelliteCountry">{{ countryToNameConversion(currentSelectedSatellite.country) }}</p>
      <p>
        <span>{{ t("NORAD Catalog Number") }}:</span>
        <span id="SatelliteId">{{ currentSelectedSatellite.id }}</span>
      </p>
    </div>
    <div class="live_info">
      <p>
        {{ t("Longitude") }}:
        <span id="SatelliteLongitude"
          >{{ rounded(currentSelectedSatellite.realPosition?.lng || 0, numDigits) }}º</span
        >
      </p>
      <p>
        {{ t("Latitude") }}:
        <span id="SatelliteLatitude"
          >{{ rounded(currentSelectedSatellite.realPosition?.lat || 0, numDigits) }}º
        </span>
      </p>
      <p>
        {{ t("Altitude") }}:
        <span id="SatelliteAltitude"
          >{{ rounded(currentSelectedSatellite.realPosition?.alt || 0, numDigits) }}km</span
        >
      </p>
      <p>
        {{ t("Speed") }}:
        <span id="SatelliteSpeed">{{ speed }}km/s</span>
      </p>
    </div>
    <div class="epoch">
      <p>{{ t("Last epoch") }}:</p>
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
    // margin-bottom: 1em;
    // margin-top: 0;

    #SatelliteCountry {
      margin-bottom: 0.5em;
    }

    img {
      margin: 1em;
      border-radius: 10%;
    }

    h1 {
      font-family: 'Tomorrow';
      font-size: 1.5em;
      font-weight: 500;
    }
  }

  .live_info {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    // align-items: left;
    margin-top: 2em;
    // margin-left: 1.3em;
    line-height: 2.5em;
  }

  .epoch {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 2em;
    width: 100%;
    line-height: 1.5em;
  }

  p {
    font-family: 'ComputerSaysNo';
    font-size: 2em;
  }

  padding: 1em;
}
</style>
<i18n>
{
  "en": {
    "Longitude": "Longitude",
    "Latitude": "Latitude",
    "Altitude": "Altitude",
    "Speed": "Speed",
    "Last epoch": "Last epoch",
    "NORAD Catalog Number": "NORAD Catalog Number"
  },
  "nl": {
    "Longitude": "Lengtegraad",
    "Latitude": "Breedtegraad",
    "Altitude": "Hoogte",
    "Speed": "Snelheid",
    "Last epoch": "Laatste epoch",
    "NORAD Catalog Number": "NORAD Catalogusnummer"
  }
}
</i18n>