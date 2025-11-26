<script setup lang="ts">
import Button from "@/app/components/general/Button.vue";

definePageMeta({
	layout: "dashboard",
});
</script>

<template>
  <h1>{{ $t('minuts') }}</h1>
  <Button>
    アップロードする
  </Button>
</template>

<style scoped>

</style>