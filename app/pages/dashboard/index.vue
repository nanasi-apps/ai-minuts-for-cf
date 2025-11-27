<script setup lang="ts">
definePageMeta({
	layout: "dashboard",
	middleware: ["auth"],
});
</script>

<template>
  <h1>{{ $t('dashboard.overview') }}</h1>
</template>

<style scoped>

</style>