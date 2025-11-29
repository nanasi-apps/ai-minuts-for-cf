<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		items?: number;
	}>(),
	{
		items: 3,
	},
);
</script>

<template>
  <div class="skeleton-grid">
    <div v-for="i in props.items" :key="i" class="skeleton-card">
      <div class="skeleton-line skeleton-line--wide"></div>
      <div class="skeleton-line skeleton-line--medium"></div>
      <div class="skeleton-line skeleton-line--narrow"></div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.skeleton-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.skeleton-card {
  @apply bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-48 animate-pulse;

  @media (prefers-color-scheme: dark) {
    @apply bg-stone-900 border-gray-800;
  }
}

.skeleton-line {
  @apply rounded bg-gray-100;

  @media (prefers-color-scheme: dark) {
    @apply bg-gray-800;
  }
}

.skeleton-line--wide {
  @apply h-6 w-3/4 mb-4;
}

.skeleton-line--medium {
  @apply h-4 w-1/2 mb-2;
}

.skeleton-line--narrow {
  @apply h-4 w-1/4;
}
</style>
