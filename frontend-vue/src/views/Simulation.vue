<script setup
        lang="ts">
        import { ThreeSimulation } from '@/Sim';
        import { Satellite } from '@/Satellite';
        import {Own_Satellite} from '../new_eigen_satellite.js';
        import { ref, watch } from 'vue';
import { Value } from 'sass';

        const props = defineProps<{
            simulation: ThreeSimulation
        }>();

        //  Create a new satellite
        let new_sat = new Own_Satellite();
        let tle = new_sat.produceTLE();
        const sats = Satellite.fromMultipleTLEs(tle);
        //  Add satellite to the simulation
        sats.forEach(sat => props.simulation.addSatellite(sat));

        props.simulation.setTimeSpeed(1);
        const height = ref(20);
        const inclination = ref(0);
        const raan = ref(0);
        const e = ref(0);

        const picked = ref(80);

</script>

<template>
    <div class="left-info-block">
        <h2>Simulation Controls</h2>
        <br />
        <h4>Height</h4>
        <div class="slider">
            <input
                type="range"
                min="60"
                max="2000"
                v-model="height"
                class="slider"
            />
            <br />
            <p class="display">Value: {{ height }}</p>
        </div>
        <br />
        <h4>Inclination</h4>
        <div class="slider">
            <input
                type="range"
                min="0"
                max="90"
                v-model="inclination"
                class="slider"
            />
            <br />
            <p class="display">Value: {{ inclination }}</p>
        </div>
        <br />
        <h4>RAAN</h4>
        <div class="slider">
            <input
                type="range"
                min="0"
                max="360"
                v-model="raan"
                class="slider"
            />
            <br />
            <p class="display">Value: {{ raan }}</p>
        </div>
        <br />
        <h4>Eccentricity</h4>
        <div class="slider">
            <input
                type="range"
                min="0"
                max="1"
                v-model="e"
                class="slider"
            />
            <br />
            <p class="display">Value: {{ e }}</p>
        </div>
        <br />
        <h2>Satellite Type</h2>
        <br />
        <div> Selected: {{ height = picked }} </div>
        <br />
        <input type="radio" id="LEO" value="80" v-model.number="picked" />
        <label for="80">LEO</label>
        <br />
        <input type="radio" id="GEO" value="1000" v-model.number="picked" />
        <label for="1000">GEO</label>
        <br />
        <input type="radio" id="NEO" value="2000" v-model.number="picked" />
        <label for="2000">NEO</label>
    </div>

</template>


<style scoped
       lang="scss">

    h2 {
        text-align: center;
    }

    h4 {
        text-align: center;
    }
    .left-info-block {
        position: absolute;
        top: 0px;
        left: 0;
        width: 320px;
        height: 100%;
        background-color: #05050a7c;
        color: white;
        padding-left: 50px;
        padding-right: 50px;
        padding-top: 10px;
        padding-bottom: 10px;
        border: 2px solid rgba(255, 255, 255, 0.75);
        border-radius: 12px;
        padding: 50px;
    }

    .text-block2 {
        position: absolute;
        bottom: 50px;
        left: 0;
        width: 120px;
        height: 150px;
        background-color: #05050aa2;
        color: white;
        padding-left: 50px;
        padding-right: 50px;
        padding-top: 10px;
        padding-bottom: 10px;
        border: 2px solid rgba(255, 255, 255, 0.75);
        border-radius: 12px;
        padding: 20px;
    }

    .display{
        background: #00000000;
        color: #ffffff;
    }

    .slider {
        --trackHeight: 0.5rem;
        --thumbRadius: 1rem;
    }

    .slider input[type="range"]{
        appearance: none;
        width: 100%;
        height: 5px;
        background: #e8f8e5;
        outline: #e8f8e5;
        opacity: 1;
        -webkit-transition: 0.2s;
        transition: opacity 0.2s;
    }

    .slider::-moz-range-thumb {
    width: var(--thumbRadius);
    height: var(--thumbRadius);
    background: #fefefe;
    cursor: pointer;
    }

</style>
