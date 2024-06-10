<script setup
        lang="ts">
        import { RouterLink, RouterView } from "vue-router";
        import { ThreeSimulation } from "./Sim";
        import { onMounted, ref } from "vue";

        const canvas = ref<HTMLCanvasElement | null>(null);

        const simulation = new ThreeSimulation();

        onMounted(() => {
            simulation.initAll(canvas.value!);
        });
</script>

<template>
    <header>
        <div class="wrapper">
            <nav>
                <RouterLink to="/">Home</RouterLink>
                <RouterLink to="/Vis">Vis</RouterLink>
            </nav>
        </div>
    </header>

    <div id="test">
        <RouterView v-slot="{ Component }">
            <component :is="Component"
                       :simulation="simulation" />
        </RouterView>
    </div>
    <canvas ref="canvas"></canvas>
</template>

<style scoped>
canvas {
    width: 100vh;
    height: 100vh;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
}


.wrapper {
    z-index: 100;
}

#test {
    z-index: 100;
    /* position: absolute;
    top: 50vh;
    left: 0;
    width: 100%; */
    
}


header {
  line-height:5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

header {
display: flex;
place-items: center;
}

.logo {
margin: 0 2rem 0 0;
}

header .wrapper {
display: flex;
place-items: flex-start;
flex-wrap: wrap;
}
</style>
