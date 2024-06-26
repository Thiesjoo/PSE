<script setup lang="ts">
defineProps<{
  open: boolean
}>()
</script>

<template>
  <div class="right-info-block" id="right-info-block" v-if="open">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
.right-info-block {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  top: 20px;
  right: 0px;
  width: 350px;
  height: 100%;
  padding: 30px 25px;
  max-height: 100%;
}
</style>
