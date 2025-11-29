<script setup lang="ts">
import Button from "@/app/components/general/Button.vue";
import StatusBadge from "@/app/components/minuts/StatusBadge.vue";
import SummaryCard from "@/app/components/minuts/SummaryCard.vue";
import TranscriptCard from "@/app/components/minuts/TranscriptCard.vue";
import { useApi, useAsyncApi } from "@/app/composable/useApi";
import { useDateFormat } from "@/app/composables/useDateFormat";
import { useToast } from "@/app/composables/useToast";

definePageMeta({
	layout: "dashboard",
	middleware: ["auth"],
});

const route = useRoute();
const minutsId = Number(route.params.id);

const api = useApi();
const { formatDate } = useDateFormat();
const { addToast } = useToast();

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
		addToast("処理を開始しました", "success");
	} catch (e) {
		console.error(e);
		addToast("処理の開始に失敗しました", "error");
	}
};

const regenerateSummary = async () => {
	console.log("regenerateSummary clicked");
	try {
		console.log("Calling api.minuts.regenerateSummary...");
		await api.minuts.regenerateSummary({ minutsId });
		console.log("API call success");
		refresh();
		addToast("再要約を開始しました", "success");
	} catch (e) {
		console.error("API call failed", e);
		addToast("再要約の開始に失敗しました", "error");
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
                    <span>{{ formatDate(minuts.createdAt) }}</span>
                    <StatusBadge :status="minuts.status" />
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

        <SummaryCard 
            v-if="minuts.summary" 
            :summary="minuts.summary" 
            :is-processing="minuts.status === 'PROCESSING'"
            @regenerate="regenerateSummary"
        />

        <TranscriptCard 
            v-if="minuts.transcript" 
            :transcript="minuts.transcript" 
        />
    </div>
  </div>
</template>
