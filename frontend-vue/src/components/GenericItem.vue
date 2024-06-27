<!--
  This component is a generic item that can be used to display a category or a subcategory.
  It has a checkbox that toggles the selection of all the filters in the category.
  The component receives the following props:
  - alignLeft: a boolean that determines if the item should be aligned to the left or to the right.
  - modelValue: an array of filters that belong to the category.
  - index: the index of the category in the list of categories.
  - icon: the icon of the category.
  - name: the name of the category.
  The component emits an 'update:modelValue' event when the checkbox is clicked.
-->

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'
import { Filter } from '@/common/sat-manager'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

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
    <span class="cat-name">{{ t(name) }}</span>
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

<i18n>
{
  en: {
    "Navigational": "Navigational",
      "Communication": "Communication",
      "Science": "Science",
      "Other": "Other",
      "Planet": "Planet",
      "Space Stations": "Space Stations",
  },
  nl: {
    "Navigational": "Navigatie",
      "Communication": "Communicatie",
      "Science": "Wetenschap",
      "Other": "Overig",
      "Weather": "Weer",
      "Space Stations": "Ruimtestations",
  }
}
</i18n>