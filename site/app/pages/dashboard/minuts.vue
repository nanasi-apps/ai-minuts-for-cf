<script setup lang="ts">
import FileInput from "@/app/components/dashboard/FileInput.vue";
import { useApi } from "@/app/composable/useApi";
import { useToast } from "@/app/composables/useToast";

definePageMeta({
	title: "pages.minuts.title",
	description: "pages.minuts.description",
	pageSize: "narrow",
	layout: "dashboard",
	middleware: ["auth"],
});

import { useAudioExtractor } from "@/app/composables/useAudioExtractor";

const api = useApi();
const { addToast } = useToast();
const router = useRouter();
const isUploading = ref(false);
const uploadProgress = ref(0);
const errorMessage = ref<string | null>(null);
const statusMessage = ref("アップロード中...");

const {
	isProcessing: isExtracting,
	progress: extractionProgress,
	stage: extractionStage,
	error: extractionError,
	errorType: extractionErrorType,
	retryCount,
	extractAudioFromVideo,
	retryExtraction,
	cancel: cancelExtraction,
	getErrorMessage,
} = useAudioExtractor();

const handleFileSelect = async (file: File) => {
	if (isUploading.value) return;

	// Validate file type client-side as well
	if (!["video/mp4", "audio/mpeg", "audio/wav"].includes(file.type)) {
		errorMessage.value =
			"対応していないファイル形式です。MP4, MP3, WAVを選択してください。";
		return;
	}

	errorMessage.value = null;
	isUploading.value = true;
	uploadProgress.value = 0;
	statusMessage.value = "準備中...";

	// Cancel any ongoing extraction
	if (isExtracting.value) {
		cancelExtraction();
		await nextTick(); // Ensure UI updates before starting new extraction
	}

	// Show extraction status if video
	if (file.type.startsWith("video/")) {
		watch(
			[isExtracting, extractionStage, extractionProgress],
			([isProcessing, stage, progress]) => {
				if (isProcessing) {
					statusMessage.value = `${stage}... (${progress}%)`;
					uploadProgress.value = Math.floor(progress * 0.6); // Extraction is 60% of upload
				}
			},
			{ immediate: true },
		);
	}

	try {
		let audioBlob: Blob | null = null;
		let audioFileName: string | null = null;
		let audioContentType: "audio/mpeg" | null = null;

		// Extract audio if video
		if (file.type.startsWith("video/")) {
			try {
				audioBlob = await extractAudioFromVideo(file);
				audioFileName = `${file.name.replace(/\.[^/.]+$/, "")}.mp3`;
				audioContentType = "audio/mpeg";
				addToast("音声の抽出に成功しました", "success");
			} catch (e) {
				console.error("Audio extraction failed:", e);
				if (extractionErrorType) {
					addToast(getErrorMessage(extractionErrorType), "error");
				} else {
					addToast(
						"音声抽出に失敗しました。動画のみアップロードします。",
						"info",
					);
				}
			}
		}

		statusMessage.value = "アップロード中...";

		// Adjust progress after extraction is done
		if (file.type.startsWith("video/")) {
			uploadProgress.value = 60; // Start upload progress at 60% after extraction
		}

		// 1. Generate Presigned URL
		const { uploadUrl, minutsId, audioUploadUrl } =
			await api.minuts.generatePresignedUrl({
				filename: file.name,
				contentType: file.type as "video/mp4" | "audio/mpeg" | "audio/wav",
				fileSize: file.size,
				audio:
					audioBlob && audioFileName && audioContentType
						? {
								filename: audioFileName,
								contentType: audioContentType,
								fileSize: audioBlob.size,
							}
						: undefined,
			});

		// 2. Upload to R2
		// Upload main file (Video or Audio)
		const uploadPromises = [uploadToR2(uploadUrl, file, file.type)];

		// Upload extracted audio if exists
		if (audioUploadUrl && audioBlob && audioContentType) {
			uploadPromises.push(
				uploadToR2(audioUploadUrl, audioBlob as File, audioContentType),
			);
		}

		await Promise.all(uploadPromises);

		statusMessage.value = "処理を開始中...";

		// 3. Process
		await api.minuts.process({ minutsId });

		// 4. Notify success
		addToast("アップロードが完了しました！", "success");

		// 5. Redirect
		router.push(`/minuts/${minutsId}`);
	} catch (error) {
		console.error(error);
		errorMessage.value =
			error instanceof Error ? error.message : "アップロードに失敗しました";
		addToast("アップロードに失敗しました", "error");
	} finally {
		isUploading.value = false;
	}
};

const uploadToR2 = (
	url: string,
	file: File | Blob,
	contentType: string,
): Promise<void> => {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.upload.addEventListener("progress", (event) => {
			if (event.lengthComputable) {
				let progress = Math.round((event.loaded / event.total) * 100);

				// Adjust progress for video files (extraction took first 60%)
				if (
					event.target instanceof XMLHttpRequest &&
					event.target.upload &&
					extractionProgress.value > 0
				) {
					progress = Math.round(60 + progress * 0.4);
				}

				uploadProgress.value = progress;
			}
		});

		xhr.addEventListener("load", () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
			} else {
				reject(new Error(`Upload failed with status ${xhr.status}`));
			}
		});

		xhr.addEventListener("error", () => {
			reject(new Error("Network error during upload"));
		});

		xhr.open("PUT", url);
		xhr.setRequestHeader("Content-Type", contentType);
		xhr.send(file);
	});
};
</script>

<template>
  <div>
    <div v-if="errorMessage" class="upload-alert">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="alert-icon">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
      </svg>
      {{ errorMessage }}
    </div>

    <div v-if="isUploading" class="upload-panel">
      <div class="upload-content">
        <div class="spinner-wrapper">
          <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <div class="upload-heading">
          <h3 class="upload-title">{{ statusMessage }}</h3>
          <p class="upload-caption">ブラウザを閉じないでください</p>
        </div>

        <div class="progress-area">
          <div class="progress-labels">
            <span>Progress</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-bar"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <button
            v-if="isExtracting"
            @click="cancelExtraction"
            class="cancel-button"
          >
            キャンセル
          </button>
          <button
            v-if="extractionError && retryCount < 2"
            @click="() => retryExtraction(file)"
            class="retry-button"
          >
            再試行 ({{ retryCount }}/2)
          </button>
          <div
            v-if="extractionError"
            class="error-suggestion"
          >
            <div class="error-message">
              {{ getErrorMessage(extractionErrorType) }}
            </div>
            <div class="alternative-actions">
              <div class="alternative-title">代替手段:</div>
              <div class="alternative-options">
                <button 
                  @click="() => { errorMessage = null; }"
                  class="alt-button"
                >
                  別のファイルを選択
                </button>
                <div class="alt-text">
                  MP3やWAV形式の音声ファイルでアップロードすると、変換せずにすみやくに処理されます。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FileInput v-else @select="handleFileSelect" />
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.upload-alert {
  @apply mb-6 p-4 rounded-xl border flex items-center gap-3 bg-red-50 text-red-600 border-red-200;

  @media (prefers-color-scheme: dark) {
    @apply bg-red-900/20 text-red-400 border-red-800;
  }
}

.alert-icon {
  @apply w-5 h-5 flex-shrink-0;
}

.upload-panel {
  @apply bg-white rounded-xl border border-gray-200 p-6 md:p-12 flex flex-col items-center justify-center min-h-[400px] md:h-[40em];

  @media (prefers-color-scheme: dark) {
    @apply bg-stone-900 border-gray-800;
  }
}

.upload-content {
  @apply w-full max-w-md space-y-6 text-center;
}

.spinner-wrapper {
  @apply relative w-20 h-20 mx-auto;
}

.spinner {
  @apply animate-spin w-full h-full text-blue-500;
}

.spinner-circle {
  @apply opacity-25;
}

.spinner-path {
  @apply opacity-75;
}

.upload-heading {
  @apply space-y-1;
}

.upload-title {
  @apply text-xl font-semibold text-gray-900;

  @media (prefers-color-scheme: dark) {
    @apply text-white;
  }
}

.upload-caption {
  @apply text-gray-500 text-sm;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-400;
  }
}

.progress-area {
  @apply space-y-2;
}

.progress-labels {
  @apply flex justify-between text-sm font-medium text-gray-700;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-300;
  }
}

.progress-track {
  @apply w-full bg-gray-100 rounded-full h-2 overflow-hidden;

  @media (prefers-color-scheme: dark) {
    @apply bg-gray-800;
  }
}

.progress-bar {
  @apply bg-blue-500 h-full rounded-full transition-all duration-300 ease-out;
}

.cancel-button {
  @apply mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200;

  @media (prefers-color-scheme: dark) {
    @apply bg-gray-700 text-gray-200 hover:bg-gray-600;
  }
}

.retry-button {
  @apply mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200;
}

.error-suggestion {
  @apply mt-4 p-4 rounded-xl border bg-red-50 text-red-600 border-red-200 text-sm;

  @media (prefers-color-scheme: dark) {
    @apply bg-red-900/20 text-red-400 border-red-800;
  }
}

.error-message {
  @apply mb-3 font-medium;
}

.alternative-actions {
  @apply border-t border-red-200 pt-3 mt-3;

  @media (prefers-color-scheme: dark) {
    @apply border-red-800;
  }
}

.alternative-title {
  @apply text-sm font-medium mb-2 text-red-700;

  @media (prefers-color-scheme: dark) {
    @apply text-red-300;
  }
}

.alternative-options {
  @apply space-y-3;
}

.alt-button {
  @apply px-3 py-2 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors duration-200 text-red-600;

  @media (prefers-color-scheme: dark) {
    @apply bg-gray-800 border-red-700 text-red-300 hover:bg-gray-700;
  }
}

.alt-text {
  @apply text-xs text-gray-600;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-400;
  }
}
</style>