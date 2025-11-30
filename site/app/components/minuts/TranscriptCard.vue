<script setup lang="ts">
import Timestamp from "@/app/components/minuts/Timestamp.vue";

interface Props {
	transcript: string;
	currentTime?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<(e: "seek", time: number) => void>();

interface ParsedSegment {
	type: "text" | "timestamp";
	content: string;
	startTime?: number;
	endTime?: number;
}

const formatTime = (seconds: number) => {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const parsedTranscript = computed(() => {
	const segments: ParsedSegment[] = [];
	// Regex matches [0.00 - 1.00] or [0.00] format
	const regex = /\[(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\]/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null = regex.exec(props.transcript);
	let prevTimestampSegment: ParsedSegment | null = null;

	while (match !== null) {
		const currentStartTime = parseFloat(match[1] ?? "0");
		const currentEndTime = match[2] ? parseFloat(match[2]) : undefined;

		// Add text before timestamp (belongs to previous timestamp)
		if (match.index > lastIndex) {
			// If previous timestamp didn't have an end time, use current start time
			if (prevTimestampSegment && prevTimestampSegment.endTime === undefined) {
				prevTimestampSegment.endTime = currentStartTime;
			}

			const segmentEndTime = prevTimestampSegment?.endTime ?? currentStartTime;

			segments.push({
				type: "text",
				content: props.transcript.slice(lastIndex, match.index),
				startTime: prevTimestampSegment?.startTime,
				endTime: segmentEndTime,
			});
		}

		// Create current timestamp segment
		const content =
			currentEndTime !== undefined
				? `${formatTime(currentStartTime)}~${formatTime(currentEndTime)}`
				: `${formatTime(currentStartTime)}`;

		const newTimestampSegment: ParsedSegment = {
			type: "timestamp",
			content: content,
			startTime: currentStartTime,
			endTime: currentEndTime,
		};
		segments.push(newTimestampSegment);

		prevTimestampSegment = newTimestampSegment;
		lastIndex = regex.lastIndex;

		match = regex.exec(props.transcript);
	}

	// Add remaining text
	if (lastIndex < props.transcript.length) {
		// If the last timestamp didn't have an end time, assume it goes to the end (Infinity)
		if (prevTimestampSegment && prevTimestampSegment.endTime === undefined) {
			prevTimestampSegment.endTime = Infinity;
		}

		segments.push({
			type: "text",
			content: props.transcript.slice(lastIndex),
			startTime: prevTimestampSegment?.startTime,
			endTime: prevTimestampSegment?.endTime ?? Infinity,
		});
	}

	return segments;
});

const isActive = (segment: ParsedSegment) => {
	if (
		props.currentTime === undefined ||
		segment.startTime === undefined ||
		segment.endTime === undefined
	) {
		return false;
	}
	return (
		props.currentTime >= segment.startTime &&
		props.currentTime < segment.endTime
	);
};
</script>

<template>
  <div class="transcript-container">
    <h2 class="transcript-header">
      <span class="header-icon">💬</span> 文字起こし
    </h2>
    <div class="transcript-body">
      <template v-for="(segment, index) in parsedTranscript" :key="index">
        <Timestamp
          v-if="segment.type === 'timestamp'"
          :text="segment.content"
          :is-active="isActive(segment)"
          @click="emit('seek', segment.startTime!)"
        />
        <span 
          v-else 
          class="text-segment"
          :class="{ 'active': isActive(segment) }"
        >{{ segment.content }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.transcript-container {
  @apply bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col;

  @media (prefers-color-scheme: dark) {
    @apply bg-stone-900 border-gray-800;
  }
}

.transcript-header {
  @apply text-xl font-bold mb-4 flex items-center gap-2 text-gray-900;

  @media (prefers-color-scheme: dark) {
    @apply text-white;
  }
}

.header-icon {
  @apply inline-block;
}

.transcript-body {
  @apply whitespace-pre-wrap text-gray-700 leading-relaxed font-mono text-sm bg-gray-50 p-4 rounded-xl overflow-y-auto flex-1;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-300 bg-stone-950;
  }
}

.text-segment {
  @apply transition-colors duration-200;
}

.text-segment.active {
  @apply bg-mattya-100 text-gray-900;
}

@media (prefers-color-scheme: dark) {
  .text-segment.active {
    @apply bg-mattya-900/70 text-gray-100;
  }
}
</style>
