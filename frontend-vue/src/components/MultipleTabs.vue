<script lang="ts" setup>
const props = defineProps<{
  amount: number
}>()

const currentTab = defineModel({ required: true, type: Number })

const emit = defineEmits(['navigate'])
const arr = Array.from({ length: props.amount }, (_, i) => i + 1)

const next = () => {
  const newPage = Math.min(currentTab.value + 1, props.amount)
  currentTab.value = newPage
  emit('navigate', newPage)
}

const back = () => {
  const newPage = Math.max(currentTab.value - 1, 1)
  currentTab.value = newPage
  emit('navigate', newPage)
}
</script>

<template>
  <div class="wrapper">
    <template v-for="slot in arr" :key="slot">
      <slot :name="`tab${slot}`" v-if="slot == currentTab"></slot>
    </template>

    <div class="buttons">
      <button @click="back()" :disabled="currentTab === 1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="left">
          <g>
            <path
              d="M12,2A10,10,0,1,0,22,12,10.011,10.011,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8.009,8.009,0,0,1,12,20Z"
            />
            <polygon
              points="13.293 7.293 8.586 12 13.293 16.707 14.707 15.293 11.414 12 14.707 8.707 13.293 7.293"
            />
          </g>
        </svg>
      </button>
      <button @click="next()" :disabled="currentTab === amount">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="right">
          <g>
            <path
              d="M12,2A10,10,0,1,0,22,12,10.011,10.011,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8.009,8.009,0,0,1,12,20Z"
            />
            <polygon
              points="13.293 7.293 8.586 12 13.293 16.707 14.707 15.293 11.414 12 14.707 8.707 13.293 7.293"
            />
          </g>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  padding-top: 2em;
  padding-right: 1em;
  padding-left: 1em;
}

.buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 300px;
  margin-bottom: 20px;
  margin-top: 10px;

  button {
    border: none;
    background: none;
  }

  button:hover {
    svg {
      fill: $button_hover;
    }
  }

  button:disabled {
    svg {
      fill: $button_disabled;
    }
  }

  #right {
    transform: rotate(180deg);
  }

  svg {
    fill: $main_text;
    width: 6em;
    height: 6em;
  }
}
</style>
