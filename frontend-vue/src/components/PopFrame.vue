<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()
</script>

<template>
  <!-- Leave the pop-up id, it is used to prevent click through's -->
  <div class="pop-up" id="pop-up" v-if="open"></div>
</template>

<style scoped lang="scss">
.pop-up {
  width: 320px;
  height: 500px;
  padding: 10px;
  border: 8px solid gray;
  //   margin: 100px;
  //   margin-top: 250px;

  border-radius: 10pt;
  background-color: #05050a;

  display: block;

  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;

  margin-right: 10em;
  //   margin-top: 10em;
}
</style>
