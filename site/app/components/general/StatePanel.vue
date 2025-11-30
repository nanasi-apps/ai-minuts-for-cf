<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
	defineProps<{
		icon?: string;
		title: string;
		description?: string;
		variant?: "default" | "error";
	}>(),
	{
		variant: "default",
	},
);

const variantClass = computed(() => {
	return props.variant === "error"
		? "state-panel--error"
		: "state-panel--default";
});
</script>

<template>
  <div class="state-panel" :class="variantClass">
    <div v-if="icon" class="state-panel__icon">{{ icon }}</div>
    <h3 class="state-panel__title">{{ title }}</h3>
    <p v-if="description" class="state-panel__description">{{ description }}</p>
    <div v-if="$slots.actions" class="state-panel__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.state-panel {
  @apply text-center py-20 rounded-3xl border bg-white;

  @media (prefers-color-scheme: dark) {
    @apply bg-stone-900 border-gray-800;
  }
}

.state-panel__icon {
  @apply text-6xl mb-4;
}

.state-panel__title {
  @apply text-xl font-bold text-gray-900 mb-2;

  @media (prefers-color-scheme: dark) {
    @apply text-white;
  }
}

.state-panel__description {
  @apply text-gray-500 mb-6;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-400;
  }
}

.state-panel__actions {
  @apply flex items-center justify-center gap-3;
}

.state-panel--default {
  @apply border-dashed border-gray-300;

  @media (prefers-color-scheme: dark) {
    @apply border-gray-700;
  }
}

.state-panel--error {
  @apply bg-red-50 border-red-200;

  @media (prefers-color-scheme: dark) {
    @apply bg-red-900/20 border-red-800;
  }
}

.state-panel--error .state-panel__title {
  @apply text-red-900;

  @media (prefers-color-scheme: dark) {
    @apply text-red-400;
  }
}

.state-panel--error .state-panel__description {
  @apply text-red-700;

  @media (prefers-color-scheme: dark) {
    @apply text-red-300;
  }
}
</style>
