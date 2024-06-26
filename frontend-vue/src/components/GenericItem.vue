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
  <label
    class="wrapper"
    :style="alignLeft ? { justifyContent: 'left' } : { justifyContent: 'right' }"
    :for="'label' + index"
  >
    <input
      type="checkbox"
      :checked="props.modelValue.every((filter) => filter.selected)"
      @change="toggle"
      :id="'label' + index"
    />
    <img :src="icon" width="65" height="65" />
    <span class="cat-name">{{ name }}</span>
  </label>
</template>

<style scoped lang="scss">
.wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-basis: 45%;
  align-items: center;
  padding-bottom: 10px;
  padding-top: 10px;
  border-radius: 10px;
  max-width: 138px;

  background-color: rgba(61, 61, 109, 0.671);
  border: 1px solid white;
  cursor: pointer; 
}

input {
  border: 1px solid red;
  margin: 0;
  padding: 0;
  width: 0;
  height: 0;
  opacity: 0;
}

input:checked + img {
  opacity: 100%;
}

img {
  opacity: 40%;
}

.cat-name {
  font-size: medium;
  font-family: 'Tomorrow';
  margin-top: 3px;
  margin-left: 10px;
  margin-right: 7px;
}
</style>
