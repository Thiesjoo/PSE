<!--
  This is a simple loading component that shows a loading message.
-->

<template>
  <div class="loading">
    <p>{{ t('loading') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped lang="scss">
.loading {
  width: 100vh;
  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
}

.loading p {
  font-size: 2em;
}
</style>

<i18n>
    {
        "en": {
            "loading": "Loading..."
        },
        "nl": {
            "loading": "Laden..."
        }
    }
</i18n>
