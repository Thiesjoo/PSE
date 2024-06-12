<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

props.simulation.moveRight();
</script>

<template>
  <h1>Satelliet</h1>

  <div class="container">
    <RouterLink to="/visualization">
      <div class="box">
        <h2>Alle satellieten</h2>
        <!-- <p>Some text</p> -->
      </div>
    </RouterLink>
    <RouterLink to="/simulation">
      <div class="box">
        <h2>Maak je eigen satelliet</h2>
        <!-- <p>Some text</p> -->
      </div>
    </RouterLink>
    <RouterLink to="/communication">
      <div class="box">
        <h2>Communicatie</h2>
        <!-- <p>Some text</p> -->
      </div>
    </RouterLink>
  </div>
</template>

<style scoped>
h1 {
  font-size: 10em;
  color: white;
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
</style>
