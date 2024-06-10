<script setup
        lang="ts">
        import { Satellite } from '@/Satellite';
        import { ThreeSimulation } from '@/Sim';
        import { computed, ref } from 'vue';
        import { fetchTLEs } from '@/api/celestrak';

        const props = defineProps<{
            simulation: ThreeSimulation
        }>();


        const rawSatData = await fetchTLEs();
        const sats = Satellite.fromMultipleTLEs(rawSatData);
        
        sats.forEach(sat => props.simulation.addSatellite(sat));
        props.simulation.setTimeSpeed(20)


        const react = ref(undefined as Satellite | undefined);

        props.simulation.addEventListener('select', (sat) => {
            react.value = sat;
        })

        const epoch = computed(() => {
            if (!react.value) {
                return '';
            }

            const day = Math.floor(react.value.satData.epochdays);
            const tmpYear = react.value.satData.epochyr
            const year = tmpYear > 50 ? 1900 + tmpYear : 2000 + tmpYear;
            const hour = 24 * parseFloat('0.' + react.value.satData.epochdays.toString().split('.')[1]);
            const minute = 60 * (hour - Math.floor(hour));


            const date = new Date();
            date.setFullYear(year);
            date.setMonth(0);
            date.setDate(day);
            date.setHours(Math.floor(hour));
            date.setMinutes(Math.floor(minute));
            date.setSeconds(0);
            date.setMilliseconds(0);

            return date.toDateString();
        })


        const rounded = (num: number, digits: number) => {
            const factor = Math.pow(10, digits);
            return Math.round(num * factor) / factor;
        }

</script>

<template>

    <div class="pop-up"
         id="pop-up"
         v-if="react">
        <h1> {{ react.name }}</h1>
        <img src="@/assets/usflag.svg"
             width="100"
             alt="US flag" />
        <p id="SatelliteCountry">Insert country</p>
        <p>
            <span>NORAD Catalog Number:</span>
            <span id="SatelliteId">{{ react.id }}</span>
        </p>
        <p>
            Longitude:
            <span id="SatelliteLongitude">{{ rounded(react.realPosition?.lng || 0, 7) }}º</span>
        </p>
        <p>
            Latitude:
            <span id="SatelliteLatitude">{{ rounded(react.realPosition?.lat || 0, 7) }}º </span>
        </p>
        <p>
            Altitude:
            <span id="SatelliteAltitude">{{ rounded(react.realPosition?.alt || 0, 7) }}km</span>
        </p>
        <p>Last epoch:</p>
        <p id="SatelliteEpoch">{{ epoch }}</p>
    </div>

    <button @click="props.simulation.setTimeSpeed(1009)"> boe</button>
</template>

<style scoped
       lang="scss">
    .pop-up {
        width: 320px;
        height: 500px;
        padding: 10px;
        border: 8px solid gray;
        margin: 100px;
        margin-top: 250px;

        border-radius: 10pt;
        position: absolute;
        background-color: #05050a;

        display: block;
        /* flex-direction: column;
        justify-content: center;
        align-items: center; */

        h1 {
            font-family: Tomorrow;
            font-weight: 400;
        }

        p {
            font-family: 'ComputerSaysNo';
            font-size: 2em;
        }

        img {
            border-radius: 10%;
        }
    }
</style>
