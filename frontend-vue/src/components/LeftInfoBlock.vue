<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()
</script>

<template>
  <div class="left-info-block" id="left-info-block" v-if="open">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
.left-info-block {
  position: absolute;
  top: 0px;
  left: 0;
  width: 350px;
  height: 100%;
  background-color: $pop_up_background;
  border: 3px solid $pop_up_border;
  border-radius: 12px;
}
</style>
