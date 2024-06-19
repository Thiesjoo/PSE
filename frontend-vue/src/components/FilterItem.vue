<script setup
        lang="ts">
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
    <div class="wrapper">
            <input type="checkbox"
                   :checked="props.modelValue"
                   @change="toggle" />
        <label>
            <slot> </slot>
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
        background-color: #317133;
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