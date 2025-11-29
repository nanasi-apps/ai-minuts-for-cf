<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Queue Test</h1>
    <div class="flex flex-col gap-4 max-w-md">
      <input type="file" @change="handleFileChange" class="border p-2 rounded" />
      <button 
        @click="upload" 
        :disabled="!file || uploading"
        class="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        {{ uploading ? 'Enqueueing...' : 'Enqueue Job' }}
      </button>
      
      <div v-if="result" class="mt-4 p-4 bg-gray-100 rounded">
        <h3 class="font-bold">Result:</h3>
        <pre>{{ result }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from "@/app/composable/useApi";

const file = ref<File | null>(null);
const uploading = ref(false);
const result = ref<any>(null);
const steps = ref<string[]>([]);
const api = useApi();

const handleFileChange = (e: Event) => {
	const target = e.target as HTMLInputElement;
	if (target.files && target.files.length > 0) {
		const f = target.files[0];
		if (f) {
			file.value = f;
		}
	}
};

const upload = async () => {
	if (!file.value) return;

	uploading.value = true;
	result.value = null;
	steps.value = [];

	try {
		// Step 1: Get Presigned URL
		steps.value.push("Getting upload URL...");
		const presignedData = await api.minuts.generatePresignedUrl({
			filename: file.value.name,
			contentType: file.value.type as "video/mp4" | "audio/mpeg", // Simple cast for demo
			fileSize: file.value.size,
		});

		steps.value.push(`Got URL. Minuts ID: ${presignedData.minutsId}`);

		// Step 2: Upload to R2
		steps.value.push("Uploading to R2...");
		await $fetch(presignedData.uploadUrl, {
			method: "PUT",
			body: file.value,
			headers: {
				"Content-Type": file.value.type,
			},
		});

		steps.value.push("Upload successful.");

		// Step 3: Enqueue Job (Process)
		steps.value.push("Enqueueing job...");
		const processData = await api.minuts.process({
			minutsId: presignedData.minutsId,
		});

		steps.value.push("Job enqueued successfully!");
		result.value = processData;
	} catch (e) {
		steps.value.push(`Error: ${e}`);
		result.value = e;
	} finally {
		uploading.value = false;
	}
};
</script>
