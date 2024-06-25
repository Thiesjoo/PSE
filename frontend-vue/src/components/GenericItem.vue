<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'
import { Filter } from '@/common/sat-manager'

const props = defineProps<{ alignLeft: boolean, modelValue: Filter[], index: number, icon: string}>()

const emits = defineEmits(['update:modelValue'])

const toggle = () => {
  props.modelValue.forEach((filter) => {
    filter.selected = !filter.selected
  })
  emits('update:modelValue', props.modelValue)
}

</script>

<template>
  <div class="wrapper" :style="alignLeft ? {justifyContent: 'left'} : {justifyContent: 'right'}">
    <p v-if="!alignLeft">Category name</p>
    <input
        type="checkbox"
        :checked="props.modelValue.every((filter) => filter.selected)"
        @change="toggle"
        :id="'label' + index"
        />
    <label :for="'label' + index">
      <img src="/kiddo-button.png" width="80" height="80">
    </label>
    <p v-if="alignLeft">Category name</p>
  </div>
</template>

<style scoped lang="scss">

.wrapper {
  display: flex;
  border: 1px solid purple;
  align-items: center;

  label {
    border: 1px solid red;
    display: flex;
    flex-direction: column;
    justify-content: center;

    img {
      opacity: 50%;
    }
  }
}

input {
  border: 1px solid red;
  margin: 0;
  padding: 0;
  width: 0;
  height: 0;
  opacity: 0;  

  &:checked + label img {
      opacity: 100%; // Show the image when the checkbox is checked
    }
}

// .wrapper {
//   position: relative;
// }

// input {
//   position: absolute;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   opacity: 0;
//   cursor: pointer;

//   &:checked + label {
//     background-color: rgba(45, 155, 156, 0.45);
//   }

//   & + label {
//     display: block;
//     padding: 0.2em;
//     margin: 0.2em 0;
//     border: 1px solid #ccc;
//     border-radius: 0.25em;
//     cursor: pointer;

//     border: 1px solid red;
//     height: 100px;
//   }
// }
</style>
