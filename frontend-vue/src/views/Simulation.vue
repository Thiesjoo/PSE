<script setup
        lang="ts">
        import { ThreeSimulation } from '@/Sim';
        import { ref } from 'vue';

        const props = defineProps<{
            simulation: ThreeSimulation
        }>();

        const heightValue = ref(20);

</script>

<template>
    <div class="slider-block">
        <h2>Simulation Controls</h2>
        <br />
        <h4>Height</h4>
        <div class="slider">
            <input
                type="range"
                min="1"
                max="100"
                v-model="heightValue"
                class="slider"
            />
            <br />
            <p class="display">Value: {{ heightValue }}</p>
        </div>
    </div>

    <!-- <div class="custom-slider">
        <input
        v-model="heightValue"
            type="range"
            min="60"
            max="2000"
            class="slider"
            />
        <br />
        Value: {{ heightValue }}
    </div> -->

</template>


    <!-- <div class="container">
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
    </div> -->
<!--
</template> -->

<!-- <style src="@vueform/slider/themes/default.css"></style> -->

<style scoped
       lang="scss">

    h2 {
        text-align: center;
    }

    h4 {
        text-align: center;
    }
    .slider-block {
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
