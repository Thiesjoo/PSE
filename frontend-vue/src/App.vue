<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ThreeSimulation } from './Sim'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() 

const canvas = ref<HTMLCanvasElement | null>(null)
const simulation = new ThreeSimulation()

onMounted(() => {
  simulation.initAll(canvas.value!)
})

const route = useRoute()
watch(
  () => route.path,
  (path) => {
    simulation.reset()
    if (route.path !== '/') {
      simulation.moveCenter()
    }
  }
)
</script>

<template>
  <header v-if="route.path !== '/'">
    <nav>
      <RouterLink to="/"> {{ t("home") }} </RouterLink>
      <RouterLink to="/visualization">{{ t("visualization") }}</RouterLink>
      <RouterLink to="/simulation">{{ t("simulation") }}</RouterLink>
      <RouterLink to="/communication">{{ t("communication") }}</RouterLink>
    </nav>
  </header>

  <div class="flags">
    <img
      src="http://purecatamphetamine.github.io/country-flag-icons/3x2/NL.svg"
      alt="Dutch flag"
      @click="$i18n.locale = 'nl'"
      :class="{ active: $i18n.locale === 'nl' }"
    />
    <img
      src="http://purecatamphetamine.github.io/country-flag-icons/3x2/US.svg"
      alt="English flag"
      @click="$i18n.locale = 'en'"
    :class="{ active: $i18n.locale === 'en' }"
    />
  </div>

  <div class="content">
    <Suspense>
      <RouterView v-slot="{ Component }">
        <component :is="Component" :simulation="simulation" />
      </RouterView>

      <template #fallback>
        <div class="loading">
          <p>{{ t("loading") }}</p>
        </div>
      </template>
    </Suspense>
  </div>
  <canvas ref="canvas" id="canvas"></canvas>
</template>

<style scoped lang="scss">
canvas {
  width: 100vw;
  height: 100vh;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;

  p {
    font-size: 2em;
  }
}

.content {
  z-index: 101;
  margin-top: 3em;
}

.flags {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 100;
    
    img {
        width: 2em;
        margin: 0.5em;
        cursor: pointer;
        border-radius: 0.2em;
    }
    
    .active {
        border: 2px solid yellow;
    }
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
<i18n>
    {
        "en": {
            "home": "Home",
            "visualization": "Visualization",
            "simulation": "Simulation",
            "communication": "Communication",
            "loading": "Loading..."
        },
        "nl": {
            "home": "Home",
            "visualization": "Visualisatie",
            "simulation": "Simulatie",
            "communication": "Communicatie",
            "loading": "Bezig met laden..."
        },
    }
</i18n>