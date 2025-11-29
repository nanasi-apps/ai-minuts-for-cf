<script setup lang="ts">
import FileInput from "@/app/components/dashboard/FileInput.vue";
import PageContainer from "@/app/components/layout/PageContainer.vue";
import SectionHeader from "@/app/components/layout/SectionHeader.vue";
import { useApi } from "@/app/composable/useApi";
import { useToast } from "@/app/composables/useToast";

definePageMeta({
	title: "minuts",
	layout: "dashboard",
	middleware: ["auth"],
});

const api = useApi();
const { addToast } = useToast();
const router = useRouter();
const isUploading = ref(false);
const uploadProgress = ref(0);
const errorMessage = ref<string | null>(null);

const handleFileSelect = async (file: File) => {
	if (isUploading.value) return;

	// Validate file type client-side as well
	if (!["video/mp4", "audio/mpeg"].includes(file.type)) {
		errorMessage.value =
			"対応していないファイル形式です。MP4またはMP3を選択してください。";
		return;
	}

	errorMessage.value = null;
	isUploading.value = true;
	uploadProgress.value = 0;

	try {
		// 1. Generate Presigned URL
		const { uploadUrl, minutsId } = await api.minuts.generatePresignedUrl({
			filename: file.name,
			contentType: file.type as "video/mp4" | "audio/mpeg",
			fileSize: file.size,
		});

		// 2. Upload to R2
		await uploadToR2(uploadUrl, file);

		// 3. Process
		await api.minuts.process({ minutsId });

		// 4. Notify success
		addToast("アップロードが完了しました！", "success");

		// 5. Redirect
		router.push(`/minuts/${minutsId}`);
	} catch (e: any) {
		console.error(e);
		errorMessage.value = e.message || "アップロードに失敗しました";
		addToast("アップロードに失敗しました", "error");
	} finally {
		isUploading.value = false;
	}
};

const uploadToR2 = (url: string, file: File): Promise<void> => {
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
		xhr.setRequestHeader("Content-Type", file.type);
		xhr.send(file);
	});
};
</script>

<template>
  <PageContainer size="narrow">
    <SectionHeader
      title="動画・音声をアップロード"
      description="AIが自動で議事録を作成します。MP4またはMP3ファイルに対応しています。"
    />

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
          <h3 class="upload-title">アップロード中...</h3>
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

    <FileInput v-else @select="handleFileSelect" />
  </PageContainer>
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
  @apply bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center h-[40em];

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