<script setup lang="ts">
interface Props {
	title: string;
	description?: string;
}

// biome-ignore lint/correctness/noUnusedVariables: used in the template
const props = defineProps<Props>();
</script>

<template>
  <div class="section-header">
    <div class="section-text">
      <h1 class="section-title">{{ props.title }}</h1>
      <p v-if="props.description" class="section-description">{{ props.description }}</p>
    </div>
    <div class="section-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.section-header {
  @apply flex items-start justify-between gap-4 mb-8;
}

.section-text {
  @apply space-y-2;
}

.section-title {
  @apply text-3xl font-bold tracking-tight text-gray-900;

  @media (prefers-color-scheme: dark) {
    @apply text-white;
  }
}

.section-description {
  @apply text-gray-500;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-400;
  }
}

.section-actions {
  @apply flex items-center gap-3;
}
</style>
