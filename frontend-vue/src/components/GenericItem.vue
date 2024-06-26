<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'
import { Filter } from '@/common/sat-manager'

const props = defineProps<{
  alignLeft: boolean
  modelValue: Filter[]
  index: number
  icon: string
  name: string
}>()

const emits = defineEmits(['update:modelValue'])

const toggle = () => {
  props.modelValue.forEach((filter) => {
    filter.selected = !filter.selected
  })
  emits('update:modelValue', props.modelValue)
}
</script>

<template>
  <div
    class="wrapper"
    :style="alignLeft ? { justifyContent: 'left' } : { justifyContent: 'right' }"
  >
    <!-- <p v-if="!alignLeft" class="cat-name">{{ name }}</p> -->
    <input
      type="checkbox"
      :checked="props.modelValue.every((filter) => filter.selected)"
      @change="toggle"
      :id="'label' + index"
    />
    <label :for="'label' + index">
      <img :src="icon" width="65" height="65" />
    </label>
    <label class="cat-name">{{ name }}</label>
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-basis: 40%;
  align-items: center;
  padding-bottom: 10px;
  padding-top: 10px;
  border-radius: 10px;

  background-color: rgba(61, 61, 109, 0.671);
  // border: 1px solid white;

  label {
    display: flex;
    flex-direction: column;
    justify-content: center;
    // border: 1px solid purple;

    img {
      opacity: 50%;
      // border: 1px solid green;
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

.cat-name {
  font-size: medium;
  font-family: 'Tomorrow';
  margin-top: 3px;
  margin-left: 10px;
  margin-right: 7px;
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
