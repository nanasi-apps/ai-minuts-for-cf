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

import { extractAudioFromVideo } from "@/app/utils/audio";

const api = useApi();
const { addToast } = useToast();
const router = useRouter();
const isUploading = ref(false);
const uploadProgress = ref(0);
const errorMessage = ref<string | null>(null);
const statusMessage = ref("アップロード中...");
const meetingStartTime = ref("");

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

	try {
		let audioBlob: Blob | null = null;
		let audioFileName: string | null = null;
		let audioContentType: "audio/mpeg" | null = null;

		// Extract audio if video
		if (file.type.startsWith("video/")) {
			statusMessage.value = "動画から音声を抽出中...";
			try {
				audioBlob = await extractAudioFromVideo(file);
				audioFileName = `${file.name.replace(/\.[^/.]+$/, "")}.mp3`;
				audioContentType = "audio/mpeg";
				addToast("音声の抽出に成功しました", "success");
			} catch (e) {
				console.error("Audio extraction failed:", e);
				addToast(
					"音声抽出に失敗しました。動画のみアップロードします。",
					"info",
				);
			}
		}

		statusMessage.value = "アップロード中...";

		// 1. Generate Presigned URL
		const { uploadUrl, minutsId, audioUploadUrl } =
			await api.minuts.generatePresignedUrl({
				filename: file.name,
				contentType: file.type as "video/mp4" | "audio/mpeg" | "audio/wav",
				fileSize: file.size,
				meetingStartTime: meetingStartTime.value.trim() || undefined,
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
				uploadProgress.value = Math.round((event.loaded / event.total) * 100);
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
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
          会議開始時刻（任意）
        </label>
        <input
          v-model="meetingStartTime"
          type="datetime-local"
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-stone-900 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          入力した時刻を基準にタイムラインを実時刻へ変換します。
        </p>
      </div>
      <FileInput @select="handleFileSelect" />
    </div>
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
</style>
