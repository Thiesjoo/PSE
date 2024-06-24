<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps<{
  simulation: ThreeSimulation
}>()
props.simulation.moveLeft()
</script>

<template>
  <div class="header">
    <h1>{{ t('About') }}</h1>
    <img src="../assets/satellite_logo.png" alt="Satellite" width="200" height="200" />
  </div>

  <div class="container">
    {{ t('Info') }}
    <br />
    <h2>{{ t('Team') }}</h2>
    <div class="lists">
      <ul>
        <li>Thies Nieborg</li>
        <li>Thomas Linssen</li>
        <li>Thomas van Lieshout</li>
        <li>Mike Schouten</li>
      </ul>
      <ul>
        <li>Gosia Gniadek</li>
        <li>Mabel Traube</li>
        <li>Sasha van der Linden</li>
        <li>Wike Duivenvoorden</li>
      </ul>
    </div>
    <img src="../assets/uvalogo_white.png" alt="UvA logo" width="500" />
  </div>
  <!-- Logo -->
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
.header {
  display: flex;

  h1 {
    font-size: 10em;
    color: $main_text;
    font-family: 'Tomorrow';
  }
}

.container {
  /* Move to left of screen */
  position: fixed;
  right: 2vw;
  top: 30vh;

  max-width: 40%;

  display: flex;
  flex-direction: column;

  color: white;
  font-family: 'Tomorrow';

  text-align: center;

  font-size: 1.3em;
  font-weight: 500;

  .lists {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    border-radius: 20pt;
    padding: 10pt;
    background-color: $menu_button_background;
    text-align: left;
  }

  img {
    margin: 0;
    position: fixed;
    bottom: 2vh;
    right: 2vw;
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
      font-size: 1.7em;
      margin: 0.2em;
    }
  }
}
</style>
<i18n>
    {
        "en": {
            "About": "About",
            "Team": "Team",
            "Info": "This is made for the course 'Project software engineering' at the University of Amsterdam. During the project we have guidance from Wouter Loeve from the NLR. The goal of the project is to introduce children to satellites. We want to achieve this by visualizing different properties of the satellites."
        },
        "nl": {
            "About": "Over ons",
            "Team": "Team",
            "Info": "Dit is gemaakt voor het vak 'Project software engineering' aan de Universiteit van Amsterdam. Tijdens het project hebben we begeleiding van Wouter Loeve van het NLR. Het doel van het project is om kinderen kennis te laten maken met satellieten. Dit willen we bereiken door verschillende eigenschappen van de satellieten te visualiseren."
        }
    }
</i18n>
