<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { ThreeSimulation } from './Sim'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle } from '@vueuse/core'
import { IDLE_TIME } from './common/constants'

const { t } = useI18n()

const canvas = ref<HTMLCanvasElement | null>(null)
const simulation = new ThreeSimulation()

onMounted(() => {
  simulation.initAll(canvas.value!)
})

const route = useRoute()
const router = useRouter()
watch(
  () => route.path,
  (path) => {
    simulation.reset()
    if (route.path !== '/') {
      simulation.moveCenter()
    } else {
      simulation.moveRight()
    }
  }
)

const { idle, lastActive, reset } = useIdle(IDLE_TIME) // 5 min

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
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 24 24"
          width="50px"
          height="50px"
        >
          <g id="Rounded">
            <circle cx="12" cy="3" r="1" />
            <circle cx="22.5" cy="11.5" r="0.5" />
            <circle cx="1.5" cy="11.5" r="0.5" />
            <path
              d="M12.71,2.296L12,3.1l-0.71-0.804L1.203,11.098L1.5,12H4v8c0,0.552,0.448,1,1,1h4c0.552,0,1-0.448,1-1v-6h4v6c0,0.552,0.448,1,1,1h4c0.552,0,1-0.448,1-1v-8h2.5l0.297-0.902L12.71,2.296z"
            />
          </g>
        </svg>
      </RouterLink>
      <RouterLink to="/visualization"
        ><img src="@/assets/visualisation_icon.png" alt="Satellites" width="50" height="50"
      /></RouterLink>
      <RouterLink to="/simulation"
        ><img src="@/assets/simulation_sharp.png" alt="Launch" width="50" height="50"
      /></RouterLink>
      <RouterLink to="/communication">
        <img src="@/assets/communication_icon.png" alt="Communication" width="50" height="50"
      /></RouterLink>
    </nav>
  </header>

  <div class="flags">
    <img
      src="http://purecatamphetamine.github.io/country-flag-icons/3x2/NL.svg"
      alt="Dutch flag"
      @click="
        () => {
          $i18n.locale = 'nl'
          setDutchLanguagePreference()
        }
      "
      :class="{ active: $i18n.locale === 'nl' }"
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
      :class="{ active: $i18n.locale === 'en' || $i18n.locale === 'en-US' }"
    />
  </div>

  <div class="content">
    <Suspense>
      <RouterView v-slot="{ Component }">
        <component :is="Component" :simulation="simulation" />
      </RouterView>

      <template #fallback>
        <div class="loading">
          <p>{{ t('loading') }}</p>
        </div>
      </template>
    </Suspense>
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
        fill: white;
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
