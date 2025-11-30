<script setup lang="ts">
const fileInput = useTemplateRef<HTMLInputElement>("fileInput");
const isDragging = ref(false);

const emit = defineEmits<(e: "select", file: File) => void>();

const openFileDialog = () => {
	fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
	const target = event.target as HTMLInputElement;
	if (target.files && target.files.length > 0) {
		const file = target.files[0];
		if (file) {
			emit("select", file);
		}
		// Reset input so the same file can be selected again if needed
		target.value = "";
	}
};

const onDrop = (event: DragEvent) => {
	isDragging.value = false;
	if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
		const file = event.dataTransfer.files[0];
		if (file) {
			emit("select", file);
		}
	}
};
</script>

<template>
  <div
    class="drop-zone"
    :class="{ 'is-dragging': isDragging }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="openFileDialog"
  >
    <div class="content">
      <div class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-12">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <p class="text">クリックまたはドラッグ＆ドロップで動画・音声をアップロード</p>
      <p class="sub-text">MP4, MP3 (最大 2GB)</p>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="video/mp4,audio/mpeg"
      class="hidden-input"
      @change="handleFileChange"
    />
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.drop-zone {
  @apply relative w-full h-auto min-h-[300px] md:h-[40em] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden;

  &:hover {
    @apply border-blue-400 bg-blue-50/50;
  }

  &.is-dragging {
    @apply border-blue-500 bg-blue-50 scale-[0.99];
  }
}

.content {
  @apply flex flex-col items-center gap-4 p-8 pointer-events-none;
}

.icon {
  @apply text-gray-400;
  
  .drop-zone:hover & {
    @apply text-blue-500;
  }
}

.text {
  @apply text-lg font-medium text-gray-700;
}

.sub-text {
  @apply text-sm text-gray-500;
}

.hidden-input {
  @apply hidden;
}

@media (prefers-color-scheme: dark) {
  .drop-zone {
    @apply border-gray-700 bg-stone-900/50;

    &:hover {
      @apply border-blue-500/50 bg-stone-800;
    }

    &.is-dragging {
      @apply border-blue-500 bg-stone-800;
    }
  }

  .text {
    @apply text-gray-200;
  }

  .sub-text {
    @apply text-gray-400;
  }
}
</style>