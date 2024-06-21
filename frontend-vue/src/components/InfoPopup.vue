<script setup lang="ts">
import { ref } from 'vue'
import { vOnClickOutside } from '@vueuse/components'

const showPopup = ref(false)
</script>

<template>
  <div class="wrapper">
    <button @click="showPopup = !showPopup">
      <img src="@/assets/info.svg" />
    </button>
    <div v-if="showPopup" v-on-click-outside="() => (showPopup = false)" class="popup">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/common/colors.scss';
.wrapper {
  z-index: 100;

  font-family: 'ComputerSaysNo';

  button {
    background-color: transparent;
    border: none;
    cursor: pointer;

    width: 30px;
    height: 30px;
    position: absolute;
    top: 0;
    right: 0;

    img {
      width: 100%;
      height: 100%;
      opacity: 0.7;
    }
  }
  .popup {
    position: relative;
    top: 0;
    right: 0;

    width: 300px;
    display: flex;
    background-color: $info_popup_background;
    color: $info_popup_text;
    font-size: 4vh;

    border: 1px solid $info_popup_border;
    padding: 10px;
    z-index: 1000;
  }
}
</style>
