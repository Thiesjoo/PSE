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
    <div v-for="slot in arr" :key="slot">
      <slot :name="`tab${slot}`" v-if="slot == currentTab"></slot>
    </div>

    <div class="buttons">
      <button @click="back()" :disabled="currentTab === 1">back</button>
      <button
        @click="next()"
        :disabled="currentTab === amount || currentTab === 3 || currentTab == 4"
      >
        next
      </button>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.buttons {
  display: flex;
  /* justify-content: space-between; */
  justify-content: center;
  width: 100%;
  max-width: 300px;
  margin-bottom: 20px;

  /* pin at button */
  position: fixed;
  bottom: 0;
}
</style>
