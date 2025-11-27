<script setup lang="ts">
import { useApi } from "@/app/composable/useApi";

definePageMeta({
	layout: "dashboard",
	middleware: ["auth"],
});

const route = useRoute();
const minutsId = Number(route.params.id);

const api = useApi();
onMounted(async () => {
	api.minuts.process({ minutsId: minutsId });
});
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Minutes ID: {{ minutsId }}</h1>
    <p class="text-gray-600">Processing...</p>
  </div>
</template>
