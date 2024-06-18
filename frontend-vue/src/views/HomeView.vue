<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

props.simulation.moveRight()
</script>

<template>
  <div class="home">
    <div class="header">
      <h1>Satellite Radar</h1>
      <img src="../assets/satellite_logo.png" alt="Satellite" width="200" height="200" />
    </div>

    <div class="container">
      <RouterLink to="/visualization">
        <div class="box">
          <h2>All satellites</h2>
          <div class="icon">Some Icon</div>
        </div>
      </RouterLink>
      <RouterLink to="/simulation">
        <div class="box">
          <h2>Make your own satellite</h2>
          <br />
          <div class="icon">Some Icon</div>
        </div>
      </RouterLink>
      <RouterLink to="/communication">
        <div class="box">
          <h2>Communication</h2>
          <div class="icon">Some Icon</div>
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
  /* justify-content: space-around; */
  /* border: 2px solid rgb(255, 255, 255); */
}

.header {
  display: flex;
  /* border: 2px solid rgb(255, 0, 0); */

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
  /* border: 2px solid rgb(0, 68, 255); */

  a {
    text-decoration: none;
  }


  .box {
    min-width: 30vw;
    min-height: 10vh;
    padding-left: 1%;
    /* border: 2px solid rgb(255, 255, 0); */

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
  border: 2px solid rgb(0, 255, 217);
  min-height: 100px;
  min-width: 100px;
}

</style>
