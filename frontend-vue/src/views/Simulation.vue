<script setup
        lang="ts">
        import { ThreeSimulation } from '@/Sim';

        const props = defineProps<{
            simulation: ThreeSimulation
        }>();

        // props.simulation.setTimeSpeed(10000);
</script>

<template>
    Yo test 123

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
</style>
