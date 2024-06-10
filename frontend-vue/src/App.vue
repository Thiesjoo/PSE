<script setup
        lang="ts">
        import { RouterLink, RouterView } from 'vue-router'
        import { ThreeSimulation } from './Sim'
        import { onMounted, ref } from 'vue'

        const canvas = ref<HTMLCanvasElement | null>(null)

        const simulation = new ThreeSimulation()

        onMounted(() => {
            simulation.initAll(canvas.value!)
        })
</script>

<template>
    <header>
        <nav>
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/visualization">Visualization</RouterLink>
            <RouterLink to="/simulation">Simulation</RouterLink>
            <RouterLink to="/communication">Communication</RouterLink>
        </nav>
    </header>

    <div class="content">
        <RouterView v-slot="{ Component }">
            <component :is="Component"
                       :simulation="simulation" />
        </RouterView>
    </div>
    <canvas ref="canvas"></canvas>
</template>

<style scoped
       lang="scss">
    canvas {
        width: 100vh;
        height: 100vh;
        display: block;
        position: absolute;
        top: 0;
        left: 0;
    }

    header {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);


        background-color: white;
        z-index: 100;
        border-radius: 0.2em;
        padding: 0.5em;

        nav {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            

            .router-link-exact-active {
                background-color: yellow;
            }

            a {
                border-radius: 1em;
                padding: 0.2em 0.5em;
                text-decoration: none;
                color: black;

                &:hover {
                    color: blue;
                }
            }
        }



    }
</style>
