<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

const props = defineProps<{
  picked: string
}>()
</script>

<template>
  <head>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
      integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
  </head>
  <div>
    <!-- Information box HEIGHT -->
    <div class="orbit-info-box" v-show="['LEO', 'MEO', 'GEO'].includes(picked)">
      <h2>{{ t('Orbit Category') }}</h2>
      <div class="orbit-info" v-show="picked === 'LEO'">
        <h3>{{ t('Low Earth Orbit') }}</h3>
        <h4>{{ t('Height') }}: 160-2000 km</h4>
        <img src="/Leo-highlight.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'MEO'">
        <h3>{{ t('Medium Earth Orbit') }}</h3>
        <h4>{{ t('Height') }}: 2000-36000 km</h4>
        <img src="/Meo-highlight.png" alt="MEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'GEO'">
        <h3>{{ t('Other') }}</h3>
        <h4>{{ t('Height') }}: >36000 km</h4>
        <img src="/Other-highlight.png" alt="Other Image" width="300" />
      </div>
    </div>
    <!-- Information box INCLINATION -->
    <div class="orbit-info-box" v-show="['I0', 'I45', 'I90'].includes(picked)">
      <h2>{{ t('Inclination') }}</h2>
      <h4>
        {{ t('Orbit information') }}
      </h4>
      <div class="orbit-info" v-show="picked === 'I0'">
        <h4>{{ t('Inclination') }}: 0 &deg;</h4>
        <img src="/inclination0.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'I45'">
        <h4>{{ t('Inclination') }}: &lt; 45 &deg;</h4>
        <img src="/inclination45.png" alt="MEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'I90'">
        <h4>{{ t('Inclination') }}: 45-89 &deg;</h4>
        <img src="/inclination85.png" alt="Other Image" width="300" />
      </div>
    </div>
    <!-- Information box RAAN -->
    <div
      class="orbit-info-box"
      v-show="['RAAN0', 'RAAN90', 'RAAN180', 'RAAN270', 'RAAN360'].includes(picked)"
    >
      <h2>{{ t('Right Ascension of the Ascending Node') }}</h2>
      <h4> {{ t( 'RAAN information')}}</h4>
      <div class="orbit-info" v-show="picked === 'RAAN0'">
        <h4>{{ t('RAAN') }}: 0 &deg;</h4>
        <img src="/raan0.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'RAAN90'">
        <h4>{{ t('RAAN') }}: &lt; 90 &deg;</h4>
        <img src="/raan90.png" alt="MEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'RAAN180'">
        <h4>{{ t('RAAN') }}: 90-180 &deg;</h4>
        <img src="/raan180.png" alt="Other Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'RAAN270'">
        <h4>{{ t('RAAN') }}: 180-270 &deg;</h4>
        <img src="/raan270.png" alt="Other Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'RAAN360'">
        <h4>{{ t('RAAN') }}: 270-360 &deg;</h4>
        <img src="/raan360.png" alt="Other Image" width="300" />
      </div>
    </div>
    <!-- Information box ECCENTRICITY -->
    <div class="orbit-info-box" v-show="['E0', 'E30', 'E60', 'E90'].includes(picked)">
      <h2>{{ t('Orbit Eccentricity') }}</h2>
      <h4>
        {{ t( 'Eccentricity information') }}
      </h4>
      <div class="orbit-info" v-show="picked === 'E0'">
        <h3>{{ t('Circular Orbit') }}</h3>
        <h4>{{ t('Eccentricity') }}: 0</h4>
        <img src="/eccentricity-0.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'E30'">
        <h3>{{ t('Slight Elliptical shape') }}</h3>
        <h4>{{ t('Eccentricity') }}: &lt; 0.3</h4>
        <img src="/eccentricity-4.png" alt="LEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'E60'">
        <h3>{{ t('More Elliptical shape') }}</h3>
        <h4>{{ t('Eccentricity') }}: 0.3 - 0.6</h4>
        <img src="/eccentricity-75.png" alt="MEO Image" width="300" />
      </div>
      <div class="orbit-info" v-show="picked === 'E90'">
        <h3>{{ t('Ellipse') }}</h3>
        <h4>{{ t('Eccentricity') }}: >0.60</h4>
        <img src="/eccentricity-95.png" alt="Other Image" width="300" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
.orbit-info-box {
  align-self: start;
  background-color: $pop_up_background;
  border: 2px solid $pop_up_border;
  border-radius: 12px;
  padding-top: 15px;
  padding-left: 10px;
}

.orbit-info {
  right: 20%;
  height: 200px;
  width: 100%;
  padding-top: 2%;
}

img {
  display: block;
  margin-top: 10px;
}
</style>

<i18n>
    {
      "en": {
        "Height": "Height",
        "Inclination": "Inclination",
        "RAAN": "RAAN",
        "Eccentricity": "Eccentricity",
        "Orbit Category": "Orbit Category",
        "Low Earth Orbit": "Low Earth Orbit",
        "Medium Earth Orbit": "Medium Earth Orbit",
        "Other": "Other",
        "Orbit information": "Orbit inclination is the angle at which orbit is tilted compared to path around equator.",
        "RAAN information": "RAAN determines at what longitude satellite crosses the equator.",
        "Eccentricity information": "Orbit eccentricity is how much an orbit looks like an oval instead of a perfect circle."
      },
      "nl": {
        "Height": "Hoogte",
        "Inclination": "Inclinatie",
        "RAAN": "RAAN",
        "Eccentricity": "Excentriciteit",
        "Orbit Category": "Baancategorie",
        "Low Earth Orbit": "Lage Omloopbaan",
        "Medium Earth Orbit": "Middelhoge Omloopbaan",
        "Other": "Andere",
        "Orbit information": "De inclinatie van de baan is de hoek waaronder de baan is gekanteld ten opzichte van het pad rond de evenaar.",
        "RAAN information": "RAAN bepaalt op welke lengtegraad de satelliet de evenaar kruist.",
        "Eccentricity information": "De excentriciteit van de baan is hoeveel een baan op een ovaal lijkt in plaats van een perfecte cirkel.",
        
      }
    }
  </i18n>
