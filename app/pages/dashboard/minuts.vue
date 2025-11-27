<script setup lang="ts">
import FileInput from "@/app/components/dashboard/FileInput.vue";
import { useApi } from "@/app/composable/useApi";

definePageMeta({
	title: "minuts",
	layout: "dashboard",
	middleware: ["auth"],
});

const api = useApi();
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
		const { uploadUrl } = await api.minuts.generatePresignedUrl({
			filename: file.name,
			contentType: file.type as "video/mp4" | "audio/mpeg",
			fileSize: file.size,
		});

		// 2. Upload to R2
		await uploadToR2(uploadUrl, file);

		// 3. Notify success
		// TODO: Navigate to details page or show success state
		alert("アップロードが完了しました！");
	} catch (e: any) {
		console.error(e);
		errorMessage.value = e.message || "アップロードに失敗しました";
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
  <div class="p-8 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">動画・音声をアップロード</h1>
      <p class="text-gray-500 dark:text-gray-400">
        AIが自動で議事録を作成します。MP4またはMP3ファイルに対応しています。
      </p>
    </div>
    
    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 flex-shrink-0">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
      </svg>
      {{ errorMessage }}
    </div>

    <div v-if="isUploading" class="bg-white dark:bg-stone-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 flex flex-col items-center justify-center h-[40em]">
      <div class="w-full max-w-md space-y-6 text-center">
        <div class="relative w-20 h-20 mx-auto">
          <svg class="animate-spin w-full h-full text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">アップロード中...</h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm">ブラウザを閉じないでください</p>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>Progress</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div 
              class="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out" 
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <FileInput v-else @select="handleFileSelect" />
  </div>
</template>

<style scoped>
/* No additional styles needed with Tailwind */
</style>