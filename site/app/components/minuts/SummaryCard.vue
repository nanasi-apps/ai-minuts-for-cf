<script setup lang="ts">
import Button from "@/app/components/general/Button.vue";

interface Props {
	summary: string;
	isProcessing?: boolean;
}

defineProps<Props>();

const emit = defineEmits<(e: "regenerate") => void>();
</script>

<template>
  <div class="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
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
    <div class="prose dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-300">
      {{ summary }}
    </div>
  </div>
</template>
