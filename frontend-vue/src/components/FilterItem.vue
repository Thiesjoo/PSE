<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emits = defineEmits(['update:modelValue'])

const toggle = () => {
  emits('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label>
    <input type="checkbox" :checked="props.modelValue" @change="toggle" />
    <slot> </slot>
  </label>
</template>
