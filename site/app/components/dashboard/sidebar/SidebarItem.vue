<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedVariables: used in the template
const props = defineProps<{
	item: {
		name: string;
		icon: string;
		route: string;
	};
}>();
</script>

<template>
  <div class="root">
    <i :class="item.icon + ' text-xl text-stone-600 dark:text-stone-400'"></i>
    <span class="label">{{ item.name }}</span>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.root {
  @apply flex items-center gap-4 p-2 rounded-lg cursor-pointer;
}

.root:hover {
  @apply bg-stone-200 ;
  
  @media (prefers-color-scheme: dark) {
    @apply bg-stone-800;
  }
}

.label {
  @apply text-stone-800 ;
  
  @media (prefers-color-scheme: dark) {
    @apply text-stone-200;
  }
}
</style>