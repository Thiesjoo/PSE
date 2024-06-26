<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// rgb(54, 5, 104, 0.40) // Dark purple
// rgb(212, 203, 229, 0.40) // Light purple
// rgba(45, 155, 156, 0.45) // Blue

const props = defineProps<{
  simulation: ThreeSimulation
}>()

props.simulation.moveRight()
</script>

<template>
  <div class="home">
    <div class="header">
      <h1>{{ t('Satellite Radar') }}</h1>
      <img src="../assets/satellite_logo.png" alt="Satellite" width="200" height="200" />
    </div>

    <div class="container">
      <RouterLink to="/visualization">
        <div class="box">
          <div class="text">
            <h2>{{ t('All satellites') }}</h2>
            <h3>{{ t('All_satellites_cta') }}</h3>
          </div>
          <div class="icon">
            <img src="../assets/visualisation_icon.png" alt="Satellites" width="100" height="100" />
          </div>
        </div>
      </RouterLink>
      <RouterLink to="/simulation">
        <div class="box">
          <div class="text">
            <h2>{{ t('Create satellites') }}</h2>
            <h3>{{ t('Create_satellites_cta') }}</h3>
          </div>
          <div class="icon">
            <img src="../assets/simulation_icon.png" alt="Launch" width="100" height="100" />
          </div>
        </div>
      </RouterLink>
      <RouterLink to="/communication">
        <div class="box">
          <div class="text">
            <h2>{{ t('Communication') }}</h2>
            <h3>{{ t('Communication_cta') }}</h3>
          </div>
          <div class="icon">
            <img
              src="../assets/communication_icon.png"
              alt="Communication"
              width="100"
              height="100"
            />
          </div>
        </div>
      </RouterLink>
    </div>

    <div class="scale-disclaimer-container">
      <img class="disclaimer-icon" src="/warning-symbol.svg" width="30px" height="30px" />
      <p class="scale-disclaimer">
        {{ t('Scale_disclaimer') }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';

.home {
  display: flex;
  flex-direction: column;
  align-items: left;
  user-select: none;
}

.header {
  display: flex;

  h1 {
    font-size: 10em;
    color: $main_text;
    font-family: 'Tomorrow';
  }
}

.container {
  display: flex;
  flex-direction: column;
  align-self: flex-start;

  a {
    text-decoration: none;
    margin-top: 1em;
    margin-bottom: 1em;
  }

  .box {
    min-width: 30vw;
    min-height: 10vh;
    padding: 0.5em;

    border-radius: 20pt;
    background-color: $button_background;

    display: flex;
    align-items: center;
    justify-content: space-around;
    margin: 0;

    .text {
      margin-left: 1em;
      margin-right: 2em;
    }

    h2,
    h3 {
      color: $main_text;
      font-family: 'Tomorrow';
    }

    h2 {
      font-size: 3em;
    }

    h3 {
      font-size: 1.5em;
      font-weight: 200;
    }

    .icon {
      margin: 0.1em;
      margin-left: auto;
    }
  }
}

.icon {
  min-height: 100px;
  min-width: 100px;
}

.scale-disclaimer-container {
  position: fixed;
  max-width: 25em;
  bottom: 1em;
  left: 1em;
  display: flex;
  gap: 0.5em;
  align-items: center;
  color: $main_text;
}

.scale-disclaimer {
  font-family: 'Tomorrow';
}
</style>
<i18n>
    {
        "en": {
            "About": "About",
            "Satellite Radar": "Satellite Radar",
            "All satellites": "All satellites",
            "Create satellites": "Make your own satellite",
            "Communication": "Communication"
        },
        "nl": {
            "About": "Over ons",
            "Satellite Radar": "Satelliet Radar",
            "All satellites": "Alle satellieten",
            "Create satellites": "Maak je eigen satelliet",
            "Communication": "Communicatie"
        }
    }
</i18n>
