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
          <h2>{{ t('All satellites') }}</h2>
          <div class="icon">
            <img src="../assets/visualisation1.png" alt="Satellites" width="100" height="100" />
          </div>
        </div>
      </RouterLink>
      <RouterLink to="/simulation">
        <div class="box">
          <h2>{{ t('Create satellites') }}</h2>
          <br />
          <div class="icon">
            <img src="../assets/simulation_sharp.PNG" alt="Launch" width="100" height="100" />
          </div>
        </div>
      </RouterLink>
      <RouterLink to="/communication">
        <div class="box">
          <h2>{{ t('Communication') }}</h2>
          <div class="icon">
            <img src="../assets/communication.png" alt="Communication" width="100" height="100" />
          </div>
        </div>
      </RouterLink>
    </div>
  </div>

  <div class="scale-disclaimer-container">
    <img class="disclaimer-icon" src="/warning-symbol.svg" width="30px" height="30px" />
    <p class="scale-disclaimer">
      The scale visualizations in this app are not an accurate reflection of reality.
    </p>
  </div>

  <div class="about">
    <RouterLink to="/about">
      <h2>About</h2>
    </RouterLink>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: left;
}

.header {
  display: flex;

  h1 {
    font-size: 10em;
    color: white;
    font-family: 'Tomorrow';
  }
}

.container {
  display: flex;
  flex-direction: column;
  align-self: flex-start;

  a {
    text-decoration: none;
  }

  .box {
    min-width: 30vw;
    min-height: 10vh;
    padding-left: 1%;

    border-radius: 20pt;
    background-color: rgba(51, 75, 75, 0.278);

    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-top: 1em;
    margin-bottom: 1em;

    h2 {
      font-size: 3em;
      color: white;
      font-family: 'Tomorrow';
    }
  }
}

.about {
  position: fixed;
  bottom: 0;
  right: 0;
  margin: 1em;
  border-radius: 10pt;
  padding: 10pt;
  background-color: rgba(45, 155, 156, 0.45);
  font-family: 'Tomorrow';

  a {
    color: white;
    text-decoration: none;
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
}

.scale-disclaimer {
  font-family: 'Tomorrow';
}
</style>
<i18n>
    {
        "en": {
            "Satellite Radar": "Satellite Radar",
            "All satellites": "All satellites",
            "Make your own satellite": "Make your own satellite",
            "Communication": "Communication"
        },
        "nl": {
            "Satellite Radar": "Satelliet Radar",
            "All satellites": "Alle satellieten",
            "Make your own satellite": "Maak je eigen satelliet",
            "Communication": "Communicatie"
        }
    }
</i18n>
