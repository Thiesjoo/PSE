<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()
</script>

<template>
  <!-- Leave the pop-up id, it is used to prevent click through's -->
  <div class="left-info-block" id="left-info-block" v-if="open">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.left-info-block {
  position: absolute;
  top: 0px;
  left: 0;
  width: 350px;
  height: 100%;
  background-color: #01023890;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  padding: 30px 25px;
  max-height: 100%;
}
</style>
