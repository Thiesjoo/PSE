<!--
 Creates the about page. This page contains information about the project and the team members.
-->

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
    {{ t('Following') }}
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
    <img src="../assets/uvalogo_white.png" alt="UvA logo" />
  </div>
  <!-- Logo -->
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
.header {
  display: flex;

  h1 {
    font-size: 9em;
    color: $main_text;
    font-family: 'Tomorrow';
  }
}

.container {
  /* Move to left of screen */
  position: fixed;
  right: 2vw;
  top: 30vh;

  max-width: 50vw;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

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
    background-color: $button_background;
    text-align: left;
  }

  img {
    margin-top: 1em;
    width: 60%;
  }

  h2 {
    font-size: 2em;
    font-weight: 500;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;

    li {
      font-size: 1.3em;
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
            "Info": "This website is made for the course 'Project software engineering' at the University of Amsterdam. The goal of the project is to introduce children to satellites. We want to achieve this by visualizing different properties of the satellites. During the project we have had help from Wouter Loeve from the NLR.",
            "Following": "The following students have contributed to this project:"
        },
        "nl": {
            "About": "Over ons",
            "Team": "Team",
            "Info": "Deze website is gemaakt voor het vak 'Project software engineering' aan de Universiteit van Amsterdam. Het doel van het project is om kinderen kennis te laten maken met satellieten. Dit willen we bereiken door verschillende eigenschappen van de satellieten te visualiseren. Tijdens het project hebben we begeleiding gekregen van Wouter Loeve van het NLR.",
            "Following": "De volgende studenten hebben bijgedragen aan dit project:"
        }
    }
</i18n>
