<script setup
        lang="ts">
        import { ThreeSimulation } from '@/Sim';

        const props = defineProps<{
            simulation: ThreeSimulation
        }>();

        // props.simulation.setTimeSpeed(10000);
</script>

<template>
    <div class="container">
        <div class="text-block">
            <h4>Sliders</h4>
            <p>Height</p>
            <div class="slidecontainer">
                <input
                    type="range"
                    min="160"
                    max="2000"
                    value="500"
                    class="slider"
                    id="height"
                />
                <p>Value: <span id="height_val"></span></p>
            </div>
            <p>Inclination</p>
            <div class="slidecontainer">
                <input
                    type="range"
                    min="0"
                    max="90"
                    value="50"
                    class="slider"
                    id="inclination"
                />
                <p>Value: <span id="incl_val"></span></p>
            </div>
            <p>RAAN</p>
            <div class="slidecontainer">
                <input
                    type="range"
                    min="0"
                    max="360"
                    value="50"
                    class="slider"
                    id="raan"
                />
                <p>Value: <span id="raan_val"></span></p>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="text-block2">
            <h4>Satellite Type</h4>

            <form>
                <label>
                    <input
                        type="radio"
                        name="satelliteType"
                        value="LEO"
                    />
                    LEO </label
                ><br />
                <label>
                    <input
                        type="radio"
                        name="satelliteType"
                        value="GEO"
                    />
                    GEO </label
                ><br />
                <label>
                    <input
                        type="radio"
                        name="satelliteType"
                        value="NEO"
                    />
                    NEO
                </label>
            </form>
        </div>
    </div>

</template>

<style scoped
       lang="scss">

    .text-block {
        position: absolute;
        top: 260px;
        right: 50px;
        width: 320px;
        height: 430px;
        background-color: #05050aa2;
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
        top: 50px;
        right: 50px;
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

    .slidecontainer {
        width: 100%;
    }

    .slider {
        width: 100%;
        height: 5px;
        background: #e8f8e5;
        outline: #e8f8e5;
        opacity: 0.7;
        -webkit-transition: 0.2s;
        transition: opacity 0.2s;
    }

    .slider:hover {
        opacity: 1;
    }

    .slider::-moz-range-thumb {
        width: 10px;
        height: 20px;
        background: #fefefe;
        cursor: pointer;
    }

</style>
