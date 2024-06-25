<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { ThreeSimulation } from './Sim'
import { onMounted, ref, watch } from 'vue'
import { useIdle } from '@vueuse/core'
import { IDLE_TIME } from './common/constants'
import LoadingComponent from '@/components/LoadingComponent.vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const canvas = ref<HTMLCanvasElement | null>(null)
const simulation = new ThreeSimulation()

const loading = ref(true)
onMounted(async () => {
  await simulation.initAll(canvas.value!)
  loading.value = false
})

const route = useRoute()
const router = useRouter()
watch(
  () => route.path,
  () => {
    simulation.reset()
    if (route.path !== '/') {
      simulation.moveCenter()
    } else {
      simulation.moveRight()
    }
  }
)

const { idle } = useIdle(IDLE_TIME) // 5 min

watch(idle, (isIdle) => {
  if (isIdle && route.path !== '/') {
    router.push('/')
  }
})

const setDutchLanguagePreference = () => {
  localStorage.setItem('languagePreference', 'nl')
}
const setEnglishLanguagePreference = () => {
  localStorage.setItem('languagePreference', 'en')
}
</script>

<template>
  <header v-if="route.path !== '/'">
    <nav>
      <RouterLink to="/"
        ><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
          <path
            d="M 23.951172 4 A 1.50015 1.50015 0 0 0 23.072266 4.3222656 L 8.859375 15.519531 C 7.0554772 16.941163 6 19.113506 6 21.410156 L 6 40.5 C 6 41.863594 7.1364058 43 8.5 43 L 18.5 43 C 19.863594 43 21 41.863594 21 40.5 L 21 30.5 C 21 30.204955 21.204955 30 21.5 30 L 26.5 30 C 26.795045 30 27 30.204955 27 30.5 L 27 40.5 C 27 41.863594 28.136406 43 29.5 43 L 39.5 43 C 40.863594 43 42 41.863594 42 40.5 L 42 21.410156 C 42 19.113506 40.944523 16.941163 39.140625 15.519531 L 24.927734 4.3222656 A 1.50015 1.50015 0 0 0 23.951172 4 z M 24 7.4101562 L 37.285156 17.876953 C 38.369258 18.731322 39 20.030807 39 21.410156 L 39 40 L 30 40 L 30 30.5 C 30 28.585045 28.414955 27 26.5 27 L 21.5 27 C 19.585045 27 18 28.585045 18 30.5 L 18 40 L 9 40 L 9 21.410156 C 9 20.030807 9.6307412 18.731322 10.714844 17.876953 L 24 7.4101562 z"
          />
        </svg>
      </RouterLink>
      <RouterLink to="/visualization"
        ><img src="@/assets/visualisation_icon.png" alt="Satellites" width="50" height="50"
      /></RouterLink>
      <RouterLink to="/simulation"
        ><img src="@/assets/simulation_icon.png" alt="Launch" width="50" height="50"
      /></RouterLink>
      <RouterLink to="/communication">
        <img src="@/assets/communication_icon.png" alt="Communication" width="50" height="50"
      /></RouterLink>
    </nav>
  </header>

  <div
    class="flags"
    :class="{
      bigger: route.path === '/'
    }"
  >
    <img
      src="http://purecatamphetamine.github.io/country-flag-icons/3x2/NL.svg"
      alt="Dutch flag"
      @click="
        () => {
          $i18n.locale = 'nl'
          setDutchLanguagePreference()
        }
      "
      :class="{ active: locale === 'nl' }"
    />
    <img
      src="http://purecatamphetamine.github.io/country-flag-icons/3x2/GB.svg"
      alt="British flag"
      @click="
        () => {
          $i18n.locale = 'en'
          setEnglishLanguagePreference()
        }
      "
      :class="{ active: locale === 'en' || locale === 'en-US' }"
    />
  </div>

  <div class="content">
    <Suspense>
      <RouterView v-slot="{ Component }">
        <component :is="Component" :simulation="simulation" />
      </RouterView>

      <template #fallback>
        <LoadingComponent></LoadingComponent>
      </template>
    </Suspense>
    <LoadingComponent v-if="loading" />
  </div>
  <canvas ref="canvas" id="canvas"></canvas>
</template>

<style scoped lang="scss">
@import './common/colors.scss';

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

.bigger {
  img {
    width: 5em !important;
    margin: 0.5em !important;
  }
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
    border: 2px solid $flag_border;
  }
}

header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);

  background-color: $button_background;
  z-index: 100;
  border-radius: 0.2em;
  padding: 0.5em;

  nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    .router-link-exact-active {
      background-color: $button_selected;
    }

    a {
      border-radius: 1em;
      padding: 0.2em 0.5em;
      text-decoration: none;
      color: $button_text;

      &:hover {
        color: $button_hover_text;
      }
    }

    svg {
      path {
        fill: $main_text;
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
        },
        "nl": {
            "home": "Home",
            "visualization": "Visualisatie",
            "simulation": "Simulatie",
            "communication": "Communicatie",
        },
    }
</i18n>
