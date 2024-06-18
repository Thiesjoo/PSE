<script setup>

import { ref } from 'vue';

const showPopup = ref(false);

</script>

<template>
    <div>
        <img src="@/assets/info.svg"
             @click="showPopup = !showPopup"
             width="25" />
        <div v-if="showPopup"
             class="popup">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped
       lang="scss">

    .popup {
        position: absolute;
        top: 0;
        right: 0;

        width: 300px;
        display: flex;
        background-color: rgba(255, 255, 255);
        color: black;
        font-size: 1em;

        border: 1px solid black;
        padding: 10px;
        z-index: 1000;
    }

    img {
        position: absolute;
        top: 0;
        right: 0;

        path {
            fill: red;
        }

        color: red;
    }

</style>