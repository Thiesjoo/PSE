<!--
  This component is a pop-up frame that can be used to display content in a pop-up.
  It is used in the popsatinfo component, which is used in the visualisation component.
-->

<script setup lang="ts">
defineProps<{
  open: boolean
}>()
</script>

<template>
  <!-- Leave the pop-up id, it is used to prevent click through's -->
  <div class="pop-up" id="pop-up" v-if="open">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
.pop-up {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;

  border: 3px solid $pop_up_border;

  border-radius: 10pt;
  background-color: $pop_up_background;

  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;

  margin-right: 10em;

  z-index: 500;
}
</style>
