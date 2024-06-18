<script setup lang="ts">
const props = defineProps<{
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
.pop-up {
  display: flex;
  flex-flow: column nowrap;

  min-width: 17vw;
  // height: 50vh; // Epoch info would clip into live info above.
  border: 8px solid #858385;

  border-radius: 10pt;
  background-color: #010238;


  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;

  margin-right: 10em;

  z-index: 500;
}
</style>
