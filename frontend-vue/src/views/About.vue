<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps<{
  simulation: ThreeSimulation
}>()
</script>

<template>
  <div class="header">
    <h1>{{ t('About') }}</h1>
    <img src="../assets/satellite_logo.png" alt="Satellite" width="200" height="200" />
  </div>

  <div class="container">
    <!-- Logo -->
    <img src="../assets/university-of-amsterdam.png" alt="UvA logo" width="350" height="200" />
    <h2>{{ t('Team') }}</h2>
    <!-- List -->
    <ul>
      <li>Gosia Gniadek</li>
      <li>Mabel Traube</li>
      <li>Mike Schouten</li>
      <li>Sasha van der Linden</li>
      <li>Thies Nieborg</li>
      <li>Thomas Linssen</li>
      <li>Thomas van Lieshout</li>
      <li>Wike Duivenvoorden</li>
    </ul>
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
  /* Move to left of screen */
  position: fixed;
  left: 2vw;
  top: 20vh;

  display: flex;
  flex-direction: column;

  color: white;
  font-family: 'Tomorrow';

  img {
    margin: 0;
  }

  h2 {
    font-size: 3em;
    font-weight: 500;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;

    li {
      font-size: 2em;
      /* margin: 0.5em; */
    }
  }
}
</style>
<i18n>
    {
        "en": {
            "About": "About"
        },
        "nl": {
            "About": "Over ons"
        }
    }
</i18n>
