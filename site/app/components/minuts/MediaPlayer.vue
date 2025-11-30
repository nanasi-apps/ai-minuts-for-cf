<script setup lang="ts">
const props = defineProps<{
	src: string;
	subtitle?: string | null;
}>();

const subtitleUrl = computed(() => {
	if (!props.subtitle) return null;
	const blob = new Blob([props.subtitle], { type: "text/vtt" });
	return URL.createObjectURL(blob);
});

// Cleanup URL on unmount
onUnmounted(() => {
	if (subtitleUrl.value) {
		URL.revokeObjectURL(subtitleUrl.value);
	}
});
</script>

<template>
  <div class="media-player-container">
    <video
      :src="src"
      controls
      class="media-player"
      playsinline
      crossorigin="anonymous"
    >
      <track
        v-if="subtitleUrl"
        kind="subtitles"
        label="Japanese"
        srclang="ja"
        :src="subtitleUrl"
        default
      />
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
