<script setup lang="ts">
import { marked } from "marked";
import { h, nextTick, ref, render, watch } from "vue";
import Button from "@/app/components/general/Button.vue";
import Timestamp from "@/app/components/minuts/Timestamp.vue";

interface Props {
	summary: string;
	isProcessing?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	(e: "regenerate"): void;
	(e: "seek", time: number): void;
}>();

const containerRef = ref<HTMLElement | null>(null);

const formatTime = (seconds: number) => {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const parsedSummary = computed(() => {
	let formatted = props.summary.replace(/。/g, "。\n\n");

	// Replace timestamps with placeholder spans for mounting Vue components
	formatted = formatted.replace(
		/\[(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\]/g,
		(_match, start, end) => {
			const startTime = parseFloat(start);
			const endTime = end ? parseFloat(end) : undefined;
			const timeStr =
				endTime !== undefined
					? `${formatTime(startTime)}~${formatTime(endTime)}`
					: `${formatTime(startTime)}`;
			// Create a placeholder element that we can mount the Vue component into
			return `<span class="js-timestamp-hook" data-start="${startTime}" data-text="${timeStr}"></span>`;
		},
	);

	return marked.parse(formatted);
});

const mountTimestamps = () => {
	if (!containerRef.value) return;

	const hooks = containerRef.value.querySelectorAll(".js-timestamp-hook");
	hooks.forEach((el) => {
		const text = el.getAttribute("data-text");
		const startTimeStr = el.getAttribute("data-start");

		if (text && startTimeStr) {
			const startTime = parseFloat(startTimeStr);
			// Render Timestamp component into the placeholder
			const vnode = h(Timestamp, {
				text,
				isActive: false,
				onClick: () => emit("seek", startTime),
			});
			render(vnode, el as HTMLElement);
		}
	});
};

watch(
	parsedSummary,
	() => {
		nextTick(mountTimestamps);
	},
	{ immediate: true },
);
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
    <div 
      ref="containerRef"
      class="summary-content prose dark:prose-invert" 
      v-html="parsedSummary"
    >
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.summary-card {
  @apply bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col;

  @media (prefers-color-scheme: dark) {
    @apply bg-stone-900 border-gray-800;
  }
}

.card-header {
  @apply flex justify-between items-center mb-4 shrink-0;
}

.card-title {
  @apply text-xl font-bold flex items-center gap-2 text-gray-900;

  @media (prefers-color-scheme: dark) {
    @apply text-white;
  }
}

.summary-content {
  @apply max-w-none text-gray-700 flex-1 overflow-y-auto;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-300;
  }
}
</style>
