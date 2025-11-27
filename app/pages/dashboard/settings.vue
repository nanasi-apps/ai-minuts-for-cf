<script setup lang="ts">
definePageMeta({
	layout: "dashboard",
	middleware: ["auth"],
});
</script>

<template>
  <h1>{{ $t('dashboard.settings') }}</h1>
</template>

<style scoped>

</style>