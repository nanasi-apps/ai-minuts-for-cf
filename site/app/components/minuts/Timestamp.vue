<script setup lang="ts">
interface Props {
	text: string;
	isActive?: boolean;
}

defineProps<Props>();
const emit = defineEmits<(e: "click") => void>();
</script>

<template>
  <span
    class="timestamp"
    :class="{ active: isActive }"
    @click="emit('click')"
  >
    {{ text }}
  </span>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.timestamp {
  @apply inline-block px-1.5 py-0.5 mx-1 rounded bg-mattya-100 text-blue-700 cursor-pointer select-none text-xs font-semibold transition-colors;
}

.timestamp:hover {
  @apply bg-mattya-200 underline;
}

.timestamp.active {
  @apply bg-mattya-300 text-white;
}

@media (prefers-color-scheme: dark) {
  .timestamp {
    @apply bg-mattya-900/30 text-mattya-300;
  }
  
  .timestamp:hover {
    @apply bg-mattya-900/50;
  }

  .timestamp.active {
    @apply bg-mattya-600 text-white;
  }
}
</style>
