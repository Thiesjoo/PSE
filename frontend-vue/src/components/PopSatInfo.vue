<!--
  This component is a popup that shows information about a satellite.
  It is used in the visualisation tab.
-->

<script setup lang="ts">
import { Satellite } from '@/Satellite'
import { computed, onUnmounted, ref } from 'vue'
import PopFrame from './PopFrame.vue'
import InfoPopup from '@/components/InfoPopup.vue'
import { useI18n } from 'vue-i18n'
import { rounded } from '@/common/utils'
import { NUM_DIGITS } from '@/common/constants'

const { t, locale } = useI18n()

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

  const localeCode = locale.value === 'nl' ? 'nl-NL' : 'en-US'

  return date.toLocaleTimeString(localeCode, {
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
})

const speed = computed(() => {
  if (!props.currentSelectedSatellite) {
    return ''
  }
  return rounded(props.currentSelectedSatellite.realSpeed.value, NUM_DIGITS)
})

const key = ref(0)
const interval = setInterval(() => {
  key.value++
}, 100)

onUnmounted(() => {
  clearInterval(interval)
})

const categories = computed(() => {
  return props.currentSelectedSatellite.categories.map((x) => t(x)).join(', ')
})
</script>

<template>
  <PopFrame :open="true" class="popup">
    <div class="top">
      <h1>{{ currentSelectedSatellite.name }}</h1>
      <div v-if="currentSelectedSatellite.country.includes('/')">
        <img
          :src="`https://purecatamphetamine.github.io/country-flag-icons/3x2/${currentSelectedSatellite.country.split('/')[0]}.svg`"
          width="100"
          :alt="`${currentSelectedSatellite.country.split('/')[0]} flag`"
        />
        <img
          :src="`https://purecatamphetamine.github.io/country-flag-icons/3x2/${currentSelectedSatellite.country.split('/')[1]}.svg`"
          width="100"
          :alt="`${currentSelectedSatellite.country.split('/')[1]} flag`"
        />
      </div>
      <div v-else-if="currentSelectedSatellite.country === 'UNK'">
        <img
          :src="`https://upload.wikimedia.org/wikipedia/commons/2/2a/Flag_of_None.svg`"
          width="100"
          :alt="`Unknown flag`"
        />
      </div>
      <div v-else-if="currentSelectedSatellite.country === 'INT'">
        <img
          :src="`https://upload.wikimedia.org/wikipedia/commons/e/ef/International_Flag_of_Planet_Earth.svg`"
          width="100"
          :alt="`International flag`"
        />
      </div>
      <div v-else>
        <img
          :src="`https://purecatamphetamine.github.io/country-flag-icons/3x2/${currentSelectedSatellite.country}.svg`"
          width="100"
          :alt="`${currentSelectedSatellite.country} flag`"
        />
      </div>
      <p id="SatelliteCountry">{{ t(currentSelectedSatellite.country) }}</p>
      <p id="norad">
        <InfoPopup>
          {{ t('NORAD Catalog Number_description') }}
        </InfoPopup>
        <span>{{ t('NORAD Catalog Number') }}:</span>
        <span id="SatelliteId">{{ currentSelectedSatellite.id }}</span>
      </p>
    </div>
    <div class="live_info">
      <p>
        {{ t('Longitude') }}:
        <span id="SatelliteLongitude" :key="key"
          >{{ rounded(currentSelectedSatellite.realPosition?.lng || 0, NUM_DIGITS) }}º</span
        >
        <InfoPopup>
          {{ t('Longitude_description') }}
        </InfoPopup>
      </p>
      <p>
        {{ t('Latitude') }}:
        <span id="SatelliteLatitude" :key="key"
          >{{ rounded(currentSelectedSatellite.realPosition?.lat || 0, NUM_DIGITS) }}º
        </span>
        <InfoPopup>
          {{ t('Latitude_description') }}
        </InfoPopup>
      </p>
      <p>
        {{ t('Altitude') }}:
        <span id="SatelliteAltitude" :key="key"
          >{{ rounded(currentSelectedSatellite.realPosition?.alt || 0, NUM_DIGITS) }}km</span
        >
        <InfoPopup>
          {{ t('Altitude_description') }}
        </InfoPopup>
      </p>
      <p>
        {{ t('Speed') }}:
        <span id="SatelliteSpeed" :key="key">{{ speed }}km/s</span>
        <InfoPopup>
          {{ t('Speed_description') }}
        </InfoPopup>
      </p>
    </div>
    <div class="epoch">
      <p>{{ t('Last epoch') }}:</p>
      <span id="SatelliteEpoch" :key="key">{{ epoch }}</span>
      <InfoPopup>
        {{ t('Last epoch_description') }}
      </InfoPopup>
    </div>
    <div class="cat-list">
      <h1>{{ t('Belongs to') }}:</h1>
      <p>{{ categories }}</p>
    </div>
  </PopFrame>
</template>

<style scoped lang="scss">
.popup {
  font-family: 'ComputerSaysNo';

  p,
  .epoch {
    position: relative;
  }

  .top {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: left;
    width: 20em;

    #SatelliteCountry {
      margin-bottom: 0.5em;
    }

    #norad {
      div {
        margin-bottom: 1em;
      }
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
    margin-top: 2em;
    line-height: 2.5em;
    width: 20em;
  }

  .epoch {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 2em;
    width: 20em;
    line-height: 1.5em;

    p {
      font-size: 3em;
      margin-bottom: 0.2em;
    }
  }

  p,
  #SatelliteEpoch {
    font-family: 'ComputerSaysNo';
    font-size: 2em;
  }

  padding: 1em;
}

.cat-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 2em;
  width: 20em;
  line-height: 1.5em;

  h1 {
    font-size: 3em;
    margin-bottom: 0.2em;
  }
}
</style>
<i18n>
{
    "en": {
        "NORAD Catalog Number": "NORAD Catalog Number",
        "NORAD Catalog Number_description": "This is a nine-digit number assigned by the United States Space Command in the order of launch or discovery to all artificial objects in the orbits of Earth.",
        "Longitude": "Longitude",
        "Longitude_description": "How much east or west is the satellite.",
        "Latitude": "Latitude",
        "Latitude_description": "How much north or south is the satellite.",
        "Altitude": "Altitude",
        "Altitude_description": "How high is the satellite.",
        "Speed": "Speed",
        "Speed_description": "How fast the satellite is.",
        "Last epoch": "Last updated",
        "Last epoch_description": "Last time the satellite published the orbit it currently is in.",

        "US": "United States",
        "FR": "France",
        "DE": "Germany",
        "GB": "Great Britain",
        "JP": "Japan",
        "RU": "Russia",
        "AR": "Argentina",
        "IT": "Italy",
        "BR": "Brazil",
        "INT": "International",
        "CN": "China",
        "LU": "Luxembourg",
        "IL": "Israel",
        "EU": "European Union",
        "CA": "Canada",
        "SE": "Sweden",
        "SA": "Saudi Arabia",
        "GR": "Greece",
        "AE": "United Arab Emirates",
        "AU": "Australia",
        "IN": "India",
        "ES": "Spain",
        "TH": "Thailand",
        "IR": "Iran",
        "KR": "South Korea",
        "ID": "Indonesia",
        "NO": "Norway",
        "VN": "Vietnam",
        "DK": "Denmark",
        "TR": "Turkey",
        "MY": "Malaysia",
        "CH": "Switzerland",
        "DZ": "Algeria",
        "EG": "Egypt",
        "SG": "Singapore",
        "SG/TW": "Singapore/Taiwan",
        "KZ": "Kazakhstan",
        "PK": "Pakistan",
        "NG": "Nigeria",
        "MX": "Mexico",
        "CL": "Chile",
        "BY": "Belarus",
        "VE": "Venezuela",
        "AZ": "Azerbaijan",
        "AT": "Austria",
        "EC": "Ecuador",
        "EE": "Estonia",
        "ZA": "South Africa",
        "NL": "Netherlands",
        "BO": "Bolivia",
        "FR/IT": "France/Italy",
        "BE": "Belgium",
        "UA": "Ukraine",
        "IQ": "Iraq",
        "PL": "Poland",
        "CN/BR": "China/Brazil",
        "TM/MC": "Turkmenistan/Monaco",
        "LA": "Laos",
        "PE": "Peru",
        "FI": "Finland",
        "BG": "Bulgaria",
        "TW": "Taiwan",
        "MA": "Morocco",
        "BD": "Bangladesh",
        "PH": "Philippines",
        "UNK": "Unknown",
        "JO": "Jordan",
        "GR/SA": "Greece/Saudi Arabia",
        "CZ": "Czech Republic",
        "ET": "Ethiopia",
        "SI": "Slovenia",
        "LT": "Lithuania",
        "TN": "Tunisia",
        "SK": "Slovakia",
        "HU": "Hungary",
        "KW": "Kuwait",
        "RW": "Rwanda",
        "AO": "Angola",
        "CO": "Colombia",
        "KE": "Kenya",
        "MC": "Monaco",
        "VA": "Vatican City",
        "DJ": "Djibouti",
        "KP": "North Korea",
        "AM": "Armenia",
        "IE": "Ireland",
        "PT": "Portugal",
        "NZ": "New Zealand",
        "Belongs to": "Belongs to"
    },
    "nl": {
        "NORAD Catalog Number": "NORAD Catalogusnummer",
        "NORAD Catalog Number_description": "Dit is een negen-cijferig nummer toegewezen door het United States Space Command in de volgorde van lancering of ontdekking aan alle kunstmatige objecten in de banen van de aarde.",
        "Longitude": "Lengtegraad",
        "Longitude_description": "Hoeveel oost of west de satelliet is.",
        "Latitude": "Breedtegraad",
        "Latitude_description": "Hoeveel noord of zuid de satelliet is.",
        "Altitude": "Hoogte",
        "Altitude_description": "Hoe hoog is de satelliet.",
        "Speed": "Snelheid",
        "Speed_description": "Hoe snel is de satelliet.",
        "Last epoch": "Laatste update",
        "Last epoch_description": "Laatste keer dat de satelliet de huidige baan publiceerde.",

        "US": "Verenigde Staten",
        "FR": "Frankrijk",
        "DE": "Duitsland",
        "GB": "Groot-Brittannië",
        "JP": "Japan",
        "RU": "Rusland",
        "AR": "Argentinië",
        "IT": "Italië",
        "BR": "Brazilië",
        "INT": "Internationaal",
        "CN": "China",
        "LU": "Luxemburg",
        "IL": "Israël",
        "EU": "Europese Unie",
        "CA": "Canada",
        "SE": "Zweden",
        "SA": "Saoedi-Arabië",
        "GR": "Griekenland",
        "AE": "Verenigde Arabische Emiraten",
        "AU": "Australië",
        "IN": "India",
        "ES": "Spanje",
        "TH": "Thailand",
        "IR": "Iran",
        "KR": "Zuid-Korea",
        "ID": "Indonesië",
        "NO": "Noorwegen",
        "VN": "Vietnam",
        "DK": "Denemarken",
        "TR": "Turkije",
        "MY": "Maleisië",
        "CH": "Zwitserland",
        "DZ": "Algerije",
        "EG": "Egypte",
        "SG": "Singapore",
        "SG/TW": "Singapore/Taiwan",
        "KZ": "Kazachstan",
        "PK": "Pakistan",
        "NG": "Nigeria",
        "MX": "Mexico",
        "CL": "Chili",
        "BY": "Wit-Rusland",
        "VE": "Venezuela",
        "AZ": "Azerbeidzjan",
        "AT": "Oostenrijk",
        "EC": "Ecuador",
        "EE": "Estland",
        "ZA": "Zuid-Afrika",
        "NL": "Nederland",
        "BO": "Bolivië",
        "FR/IT": "Frankrijk/Italië",
        "BE": "België",
        "UA": "Oekraïne",
        "IQ": "Irak",
        "PL": "Polen",
        "CN/BR": "China/Brazilië",
        "TM/MC": "Turkmenistan/Monaco",
        "LA": "Laos",
        "PE": "Peru",
        "FI": "Finland",
        "BG": "Bulgarije",
        "TW": "Taiwan",
        "MA": "Marokko",
        "BD": "Bangladesh",
        "PH": "Filipijnen",
        "UNK": "Onbekend",
        "JO": "Jordanië",
        "GR/SA": "Griekenland/Saoedi-Arabië",
        "CZ": "Tsjechië",
        "ET": "Ethiopië",
        "SI": "Slovenië",
        "LT": "Litouwen",
        "TN": "Tunesië",
        "SK": "Slowakije",
        "HU": "Hongarije",
        "KW": "Koeweit",
        "RW": "Rwanda",
        "AO": "Angola",
        "CO": "Colombia",
        "KE": "Kenia",
        "MC": "Monaco",
        "VA": "Vaticaanstad",
        "DJ": "Djibouti",
        "KP": "Noord-Korea",
        "AM": "Armenië",
        "IE": "Ierland",
        "PT": "Portugal",
        "NZ": "Nieuw-Zeeland",
        "Belongs to": "Hoort bij"
    }
}
</i18n>
