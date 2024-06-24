<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()
</script>

<template>
  <div class="right-info-block" id="right-info-block" v-if="open">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.right-info-block {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  top: 0px;
  right: 0px;
  width: 350px;
  height: 100%;
//   background-color: #01023890;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  padding: 30px 25px;
  max-height: 100%;
}
</style>
