<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps<{
  simulation: ThreeSimulation
}>()

props.simulation.moveRight()
</script>

<template>
  <div class="header">
    <h1>{{ t('Satellite Radar') }}</h1>
    <img src="../assets/satellite_logo.png" alt="Satellite" width="200" height="200" />
  </div>

  <div class="container">
    <RouterLink to="/visualization">
      <div class="box">
        <h2>{{ t('All satellites') }}</h2>
      </div>
    </RouterLink>
    <RouterLink to="/simulation">
      <div class="box">
        <h2>{{ t('Make your own satellite') }}</h2>
      </div>
    </RouterLink>
    <RouterLink to="/communication">
      <div class="box">
        <h2>{{ t('Communication') }}</h2>
      </div>
    </RouterLink>
  </div>

  <div class="about">
    <RouterLink to="/about">
      <h2>About</h2>
    </RouterLink>
  </div>
</template>

<style scoped>
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
  align-items: left;
  justify-content: center;
  position: fixed;
  left: 10%;
  top: 50%;
  transform: translateY(-50%);

  a {
    text-decoration: none;
  }

  .box {
    width: 30vw;
    height: 10vh;
    /* border: 8px solid gray; */

    border-radius: 2pt;
    background-color: #090929;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-top: 1em;
    margin-bottom: 1em;

    h2 {
      font-size: 3em;
      color: white;
    }
  }
}

.about {
  position: fixed;
  bottom: 0;
  right: 0;
  margin: 1em;
  background-color: blueviolet;
  width: 5vw;

  a {
    color: white;
    text-decoration: none;
  }
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
