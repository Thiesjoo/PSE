<script setup
        lang="ts">
        import { ThreeSimulation } from '@/Sim';
        import { Satellite } from '@/Satellite';
        import {epochUpdate, calculateRevolutionPerDay} from '../new_eigen_satellite.js';
        import type {SatRec} from 'satellite.js'
        import { ref, watch } from 'vue';
        import { Value } from 'sass';

        const props = defineProps<{
            simulation: ThreeSimulation
        }>();

        // Set epoch as current time and alt as 160km
        let epoch = epochUpdate();
        let alt = 160000 + 6371 * 1000; // Add Earth's radius
        let mean_motion = calculateRevolutionPerDay(alt)

        // Initializing own satelite
        let part1 = "New Satellite\n1 11111U 24001A   ";
        let part2 =  " -.00000000 00000000 00000-0 0 1111 1\n2 11111 000.0000 000.0000 0000000 000.0000 000.0000 ";
        let part3 = "000001";
        let tle = part1 + epoch + part2 + mean_motion + part3;
        console.log(tle)

        //  Add satellite to the simulation
        const sats = Satellite.fromMultipleTLEs(tle);
        let sat = sats[0]
        sats.forEach(sat => props.simulation.addSatellite(sat));

        // ********* SLIDERS *********

        // Initializing slider variables
        const height = ref(160);
        const inclination = ref(0);
        const raan = ref(0);
        const e = ref(0);

        const picked = ref(0); // Initial orbit type is 0 = LEO

        // Height slider live changes and update radio buttons
        watch(height, (Value) => {
            alt = Value * 1000 + 6371 * 1000; // Convert to meters and add Earth's radius
            sat.satData.no = calculateRevolutionPerDay(alt) / (60 * 24); // mean motion [/min]

            if (Value >= 160 && Value < 2000) {
                picked.value = 0; // LEO
            } else if (Value >= 2000 && Value < 36000) {
                picked.value = 1; // MEO
            }
            else {
                picked.value = 2;
            }
        });

        // Inclination slider live changes
        watch(inclination, (Value) => {
            sat.satData.inclo = Value * Math.PI /180 // [rad]
        });

        // RAAN slider live changes
        watch(raan, (Value) => {
            sat.satData.nodeo = Value * Math.PI /180 // [rad]
        });

        // Eccentricity slider live changes
            watch(e, (Value) => {
            sat.satData.ecco = Value/100
        });

        props.simulation.setTimeSpeed(150);


</script>

<template>
    <div class="left-info-block">
        <div class="sliders-sat">
            <br />
            <h2>Simulation Variables</h2>
            <br />
            <h4>Height</h4>
            <div class="slider">
                <input
                    type="range"
                    min="160"
                    max="36000"
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
                    max="100"
                    v-model="e"
                    class="slider"
                />
                <br />
                <p class="display">Value: {{ e/100 }}</p>
            </div>
        </div>
        <br />
        <div class="add-button" style="text-align: center;">ADD</div>
        <br />
        <div class="orbit-sat">
            <h2>Orbit Category</h2>
            <br />
            <div id="categories" style="text-align: center;">
                <span :class="{'category': true, 'highlight': picked === 0}" id="LEO"> LEO</span>
                <span :class="{'category': true, 'highlight': picked === 1}" id="MEO">MEO</span>
                <span :class="{'category': true, 'highlight': picked == 2 }" id="Other">Other</span>
            </div>
            <div class="orbit-info" v-show="picked === 0">
                <h3>Low Earth Orbit</h3>
                <p>Height: 160-2000 km</p>
                <p>Fun facts: :D</p>
            </div>
            <div class="orbit-info" v-show="picked === 1">
                <h3>Medium Earth Orbit</h3>
                <p>Height: 2000-36000 km</p>
                <p>Fun facts: :D</p>
            </div>
            <div class="orbit-info" v-show="picked === 2">
                <h3>Other</h3>
                <p>Height: >36000 km</p>
                <p>Fun facts: :D</p>
            </div>
        </div>
    </div>

</template>


<style scoped
       lang="scss">

    h2 {
        text-align: center;
    }

    h4 {
        text-align: center;
        size: 1rem;
    }

    h3 {
        text-align: center;
        font-weight: bold;
    }
    .left-info-block {
        position: absolute;
        top: 0px;
        left: 0;
        width: 400px;
        height: 100%;
        background-color: #05050a7c;
        color: white;
        padding-left: 20px;
        padding-right: 20px;
        padding-top: 10px;
        padding-bottom: 10px;
        border: 2px solid rgba(255, 255, 255, 0.75);
        border-radius: 12px;
        padding: 50px;
    }
    .sliders-sat {
        position: sticky;
        top: 20px;
        padding-bottom: 10%;
        padding-left: 10%;
        padding-right: 10%;
    }

    .add-button{
        position: sticky;
        width: 50%;
        padding: 20px;
        background-color: rgba(195, 0, 255, 0.36);
        border-radius: 200px;
        cursor: pointer;
    }
    .orbit-sat {
        position: sticky;
        width: 100%;
        padding-top: 10%;
    }

    .orbit-info {
        position: sticky;
        height: 100px;
        width: 100%;
        padding-top: 5%;
        padding-bottom: 20%;
        background-color: rgba(195, 0, 255, 0.36);
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

    .category {
        display: inline-table;
        align-content: center;
        margin-right: 5px;
        width: var(--text-width);
        padding: 10px;
        font-size: 14px;
    }

    .highlight {
        background-color: rgba(195, 0, 255, 0.36);
    }

</style>
