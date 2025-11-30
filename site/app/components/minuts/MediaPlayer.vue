<script setup lang="ts">
defineProps<{
	src: string;
}>();
</script>

<template>
  <div class="media-player-container">
    <video
      :src="src"
      controls
      class="media-player"
      playsinline
    >
      お使いのブラウザは動画タグをサポートしていません。
    </video>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.media-player-container {
  @apply w-full rounded-xl overflow-hidden bg-black/5 border border-gray-200 dark:border-gray-800 shadow-sm;
}

.media-player {
  @apply w-full h-auto max-h-[500px] object-contain;
}
</style>
