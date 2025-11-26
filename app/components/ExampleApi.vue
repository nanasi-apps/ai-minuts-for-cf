<script setup lang="ts">
import { useAsyncApi } from "@/app/composable/useApi";

const { data: exampleData } = await useAsyncApi((api) => api.example.test());
</script>

<template>
  <Card>
    <p>{{ exampleData?.message }}</p>
  </Card>
</template>

<style module>

</style>