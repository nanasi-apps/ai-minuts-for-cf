<script setup lang="ts">
interface Props {
  transcript: string;
}

defineProps<Props>();
</script>

<template>
  <div class="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
    <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
      <span>💬</span> 文字起こし
    </h2>
    <div class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-mono text-sm bg-gray-50 dark:bg-stone-950 p-4 rounded-xl">
      {{ transcript }}
    </div>
  </div>
</template>
