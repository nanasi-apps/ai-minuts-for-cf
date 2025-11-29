<script setup lang="ts">
interface Props {
	disabled?: boolean;
	variant?: "primary" | "secondary" | "white";
	size?: "medium" | "large";
	shadow?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	variant: "primary",
	size: "medium",
	shadow: false,
});
</script>

<template>
<button 
  class="root" 
  :class="[
    props.variant, 
    props.size,
    { 'has-shadow': props.shadow }
  ]"
  type="button" 
  :disabled="props.disabled" 
> 
  <slot />
</button>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.root {
  @apply rounded-2xl font-medium transition-colors duration-200;
}

.root:focus {
  @apply outline-none ring-2 ring-mattya-400;
}

.root:disabled {
  @apply bg-gray-400 cursor-not-allowed text-white;
}

/* Sizes */
.medium {
  @apply px-5 py-2 text-base;
}

.large {
  @apply px-8 py-4 text-lg;
}

/* Variants */
.primary {
  @apply bg-mattya-600 text-white;
}

.primary:hover {
  @apply bg-mattya-700;
}

.secondary {
  @apply text-stone-600 dark:text-stone-300 hover:bg-mattya-50 dark:hover:bg-stone-800;
}

.white {
  @apply bg-white text-mattya-900;
}

.white:hover {
  @apply bg-mattya-50;
}

/* Shadow */
.has-shadow {
  @apply shadow-lg shadow-mattya-200/50 dark:shadow-none;
}
</style>