<script setup lang="ts">
interface Props {
	size?: "wide" | "narrow";
}

const props = withDefaults(defineProps<Props>(), {
	size: "wide",
});

const sizeClass = computed(() =>
	props.size === "narrow" ? "page-container-narrow" : "page-container-wide",
);
</script>

<template>
  <div class="page-container" :class="sizeClass">
    <slot />
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.page-container {
  @apply p-8 mx-auto;
}

.page-container-wide {
  @apply max-w-7xl;
}

.page-container-narrow {
  @apply max-w-4xl;
}
</style>
