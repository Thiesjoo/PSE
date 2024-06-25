<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'
import { Filter } from '@/common/sat-manager'

const props = defineProps<{ modelValue: Filter[] }>()

const emits = defineEmits(['update:modelValue'])

const toggle = () => {
  props.modelValue.forEach((filter) => {
    filter.selected = !filter.selected
  })
  emits('update:modelValue', props.modelValue)
}
</script>

<template>
  <div class="wrapper">
    <input
      type="checkbox"
      :checked="props.modelValue.every((filter) => filter.selected)"
      @change="toggle"
    />
    <label>
      <slot></slot>
    </label>
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  position: relative;
}

input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;

  &:checked + label {
    background-color: rgba(45, 155, 156, 0.45);
  }

  & + label {
    display: block;
    padding: 0.2em;
    margin: 0.2em 0;
    border: 1px solid #ccc;
    border-radius: 0.25em;
    cursor: pointer;
  }
}
</style>
