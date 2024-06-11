<script setup
        lang="ts">
        import { ThreeSimulation } from '@/Sim';

        const props = defineProps<{
            simulation: ThreeSimulation
        }>();

        props.simulation.setTimeSpeed(10000);
</script>

<template>
    Yo test 123
   
</template>

<style scoped
       lang="scss">
</style>
