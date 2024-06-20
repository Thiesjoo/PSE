<script lang="ts"
        setup>
        import { ref } from 'vue';

        const props = defineProps<{
            amount: number;
        }>();

        const emit = defineEmits(["navigate"])
        const arr = Array.from({ length: props.amount }, (_, i) => i + 1);

        const currentTab = ref(1);

        const next = () => {
            console.log(currentTab.value, props.amount, Math.min(currentTab.value, props.amount))
            currentTab.value = Math.min(currentTab.value + 1, props.amount);
            emit("navigate", currentTab.value)
        };

        const back = () => {
            currentTab.value = Math.max(currentTab.value - 1, 1);
            emit("navigate", currentTab.value)
        };


</script>

<template>
    <div class="wrapper">

        <div v-for="slot in arr">
            <slot :name="`tab${slot}`"
                  v-if="slot == currentTab"></slot>
        </div>
        <button @click="back()">back</button>
        <button @click="next()">next</button>

    </div>
</template>

<style scoped>
.wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column
}
</style>