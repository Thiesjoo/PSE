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
  <div class="home">
    <div class="header">
      <h1>{{ t("Satellite Radar") }}</h1>
      <img src="../assets/satellite_logo.png" alt="Satellite" width="200" height="200" />
    </div>

    <div class="container">
      <RouterLink to="/visualization">
        <div class="box">
          <h2>{{ t("All satellites") }}</h2>
          <div class="icon">
            <img src="../assets/visualisation1.png" alt="Satellites" width="100" height="100" />
          </div>
        </div>
      </RouterLink>
      <RouterLink to="/simulation">
        <div class="box">
          <h2>{{ t("Make your own satellite") }}</h2>
          <br />
          <div class="icon">
            <img src="../assets/simulation.png" alt="Launch" width="100" height="100" />
          </div>
        </div>
      </RouterLink>
      <RouterLink to="/communication">
        <div class="box">
          <h2>{{ t("Communication") }}</h2>
          <div class="icon">
            <img src="../assets/communication.png" alt="Communication" width="100" height="100" />
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home{
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

    border-radius: 2pt;
    background-color: #090929;

    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-top: 1em;
    margin-bottom: 1em;

    h2 {
      font-size: 3em;
      color: white;
    }
  }
}

.icon {
  min-height: 100px;
  min-width: 100px;
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
