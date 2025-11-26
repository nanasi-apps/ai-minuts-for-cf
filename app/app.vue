<script setup lang="ts">
import { checkSession } from "@/app/stores/auth";

onMounted(() => {
	checkSession();
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
