<script setup lang="ts">
import Button from "@/app/components/general/Button.vue";
import { useApi, useAsyncApi } from "@/app/composable/useApi";

definePageMeta({
	layout: "dashboard",
	middleware: ["auth"],
});

const route = useRoute();
const minutsId = Number(route.params.id);

// const {
//     data: minuts,
//     status,
//     refresh,
// } = useAsyncApi(() => api.minuts.get({ id: minutsId }));

const api = useApi();

const {
	data: minuts,
	status,
	refresh,
} = useAsyncApi(() => api.minuts.get({ id: minutsId }), {
	server: false,
});

const processMinuts = async () => {
	try {
		await api.minuts.process({ minutsId });
		alert("処理を開始しました");
	} catch (e) {
		console.error(e);
		alert("処理の開始に失敗しました");
	}
};

const regenerateSummary = async () => {
	console.log("regenerateSummary clicked");
	try {
		console.log("Calling api.minuts.regenerateSummary...");
		await api.minuts.regenerateSummary({ minutsId });
		console.log("API call success");
		refresh();
		alert("再要約を開始しました");
	} catch (e) {
		console.error("API call failed", e);
		alert("再要約の開始に失敗しました");
	}
};
</script>

<template>
  <div class="p-8 max-w-4xl mx-auto">
    <div v-if="status === 'pending'" class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
        <div class="space-y-4">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
    </div>

    <div v-else-if="minuts" class="space-y-8">
        <div class="flex justify-between items-start">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ minuts.title }}</h1>
                <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{{ new Date(minuts.createdAt).toLocaleString() }}</span>
                    <span class="px-2 py-1 rounded-full text-xs font-medium border" :class="{
                        'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800': minuts.status === 'COMPLETED',
                        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800': minuts.status === 'PROCESSING',
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800': minuts.status === 'FAILED',
                        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700': minuts.status === 'UPLOADING'
                    }">
                        {{ minuts.status }}
                    </span>
                </div>
            </div>
            
            <Button 
                v-if="minuts.status === 'UPLOADING' || minuts.status === 'FAILED'"
                @click="processMinuts"
                variant="primary"
            >
                議事録を作成する
            </Button>
        </div>

        <div v-if="minuts.summary" class="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>📝</span> 要約
                </h2>
                <Button 
                    @click="regenerateSummary" 
                    variant="secondary" 
                    :disabled="minuts.status === 'PROCESSING'"
                >
                    再要約
                </Button>
            </div>
            <div class="prose dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {{ minuts.summary }}
            </div>
        </div>

        <div v-if="minuts.transcript" class="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <span>💬</span> 文字起こし
            </h2>
            <div class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-mono text-sm bg-gray-50 dark:bg-stone-950 p-4 rounded-xl">
                {{ minuts.transcript }}
            </div>
        </div>
    </div>
  </div>
</template>
