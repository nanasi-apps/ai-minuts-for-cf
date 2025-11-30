<script setup lang="ts">
import { marked } from "marked";
import Button from "@/app/components/general/Button.vue";

interface Props {
	summary: string;
	isProcessing?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<(e: "regenerate") => void>();

const parsedSummary = computed(() => {
	const formatted = props.summary.replace(/。/g, "。\n\n");
	return marked.parse(formatted);
});
</script>

<template>
  <div class="summary-card">
    <div class="card-header">
      <h2 class="card-title">
        <span>📝</span> 要約
      </h2>
      <Button 
        @click="emit('regenerate')" 
        variant="secondary" 
        :disabled="isProcessing"
      >
        再要約
      </Button>
    </div>
    <div class="summary-content prose dark:prose-invert" v-html="parsedSummary">
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.summary-card {
  @apply bg-white rounded-2xl p-6 shadow-sm border border-gray-100;

  @media (prefers-color-scheme: dark) {
    @apply bg-stone-900 border-gray-800;
  }
}

.card-header {
  @apply flex justify-between items-center mb-4;
}

.card-title {
  @apply text-xl font-bold flex items-center gap-2 text-gray-900;

  @media (prefers-color-scheme: dark) {
    @apply text-white;
  }
}

.summary-content {
  @apply max-w-none text-gray-700;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-300;
  }
}
</style>
