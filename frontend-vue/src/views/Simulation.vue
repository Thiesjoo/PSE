<script setup
        lang="ts">
        import { ThreeSimulation } from '@/Sim';
        import { Satellite } from '@/Satellite';
        import {epochUpdate, calculateRevolutionPerDay, calculateMeanMotionRadPerMin} from '../new_eigen_satellite.js';
        import type {SatRec} from 'satellite.js'
        import { ref, watch } from 'vue';
        import { Value } from 'sass';

        const props = defineProps<{
            simulation: ThreeSimulation
        }>();
        const sat_number = 1; // Used for naming satellites when creating multiple

        function initialize_new_satellite(){
            // Set epoch as current time and alt as 160km
            let epoch = epochUpdate();
            let alt = 160000 + 6371 * 1000; // Add Earth's radius
            let mean_motion = calculateRevolutionPerDay(alt);

            // Initializing own satelite
            let name = "New Satellite" + sat_number.toString() + "\n";
            let part1 = "1 11111U 24001A   ";
            let part2 =  " -.00000000 00000000 00000-0 0 1111 1\n2 11111 000.0000 000.0000 0000000 000.0000 000.0000 ";
            let part3 = "000001";
            let tle = name + part1 + epoch + part2 + mean_motion + part3;
            console.log(tle);

            //  Add satellite to the simulation
            const sats = Satellite.fromMultipleTLEs(tle);
            let sat = sats[0];
            sats.forEach(sat => props.simulation.addSatellite(sat));

            // sat_number = sat_number + 1;
        }

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
            sat.satData.no = calculateMeanMotionRadPerMin(alt) // mean motion [rad/min]

            if (Value >= 160 && Value < 2000) {
                picked.value = 0; // LEO
            } else if (Value >= 2000 && Value < 36000) {
                picked.value = 1; // MEO
            } else {
                picked.value = 2; // Other
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

        props.simulation.setTimeSpeed(50);

</script>

<template>
    <div class="left-info-block">
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
        <br />
        <h2>Orbit Category</h2>
        <br />
        <div id="categories">
        <span :class="{'category': true, 'highlight': picked === 0}" id="LEO">LEO</span>
        <span :class="{'category': true, 'highlight': picked === 1}" id="MEO">MEO</span>
        <span :class="{'category': true, 'highlight': picked == 2 }" id="Other">Other</span>

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

    .category {
            display: inline-block;
            margin-right: 20px;
            padding: 7px;
            font-size: 1em;
        }
        .highlight {
            background-color: rgba(195, 0, 255, 0.36);
        }

</style>
