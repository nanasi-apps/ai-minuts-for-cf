<script setup lang="ts">
import type { InferContractRouterOutputs } from "@orpc/contract";
import type { contract } from "#/orpc";
import Button from "@/app/components/general/Button.vue";
import { useAsyncApi } from "@/app/composable/useApi";

export type Outputs = InferContractRouterOutputs<typeof contract>;

type MinutsList = Outputs["minuts"]["list"];

definePageMeta({
	layout: "dashboard",
	middleware: ["auth"],
});

const {
	data: minutsList,
	status,
	refresh,
} = useAsyncApi<MinutsList>((api) => api.minuts.list());

const minutsLists = computed(() => minutsList.value ?? []);

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const getStatusColor = (status: string) => {
	switch (status) {
		case "COMPLETED":
			return "status-completed";
		case "PROCESSING":
			return "status-processing";
		case "FAILED":
			return "status-failed";
		default:
			return "status-default";
	}
};

const getStatusLabel = (status: string) => {
	switch (status) {
		case "COMPLETED":
			return "完了";
		case "PROCESSING":
			return "処理中";
		case "FAILED":
			return "失敗";
		case "UPLOADING":
			return "アップロード中";
		default:
			return status;
	}
};
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{{ $t('dashboard.overview') }}</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">議事録の管理と閲覧ができます</p>
      </div>
      <NuxtLink to="/dashboard/minuts" class="bg-mattya-600 hover:bg-mattya-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
        <span class="text-xl">+</span>
        新規作成
      </NuxtLink>
    </div>

    <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-48 animate-pulse">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-2"></div>
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4"></div>
      </div>
    </div>

    <div v-else-if="minutsLists && minutsLists.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink 
        v-for="minuts in minutsLists" 
        :key="minuts.id" 
        :to="`/minuts/${minuts.id}`"
        class="group bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-800 transition-all hover:-translate-y-1 relative overflow-hidden"
      >
        <div class="absolute top-0 right-0 p-4">
            <span :class="['status-badge', getStatusColor(minuts.status)]">
                {{ getStatusLabel(minuts.status) }}
            </span>
        </div>
        
        <div class="mt-2">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-mattya-700 dark:group-hover:text-mattya-400 transition-colors">
                {{ minuts.title }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {{ formatDate(minuts.createdAt) }}
            </p>
        </div>

        <div class="mt-6 flex justify-end">
            <span class="text-sm font-medium text-mattya-600 dark:text-mattya-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                詳細を見る
                <span class="text-lg">→</span>
            </span>
        </div>
      </NuxtLink>
    </div>

    <div v-else-if="status === 'error'" class="text-center py-20 bg-red-50 dark:bg-red-900/20 rounded-3xl border border-red-200 dark:border-red-800">
      <div class="text-6xl mb-4">⚠️</div>
      <h3 class="text-xl font-bold text-red-900 dark:text-red-400 mb-2">読み込みに失敗しました</h3>
      <p class="text-red-700 dark:text-red-300 mb-6">データの取得中にエラーが発生しました。</p>
      <Button @click="refresh" variant="secondary" class="text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40">
        再読み込み
      </Button>
    </div>

    <div v-else class="text-center py-20 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
      <div class="text-6xl mb-4">📝</div>
      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">まだ議事録がありません</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">新しい会議の録音をアップロードして、議事録を作成しましょう</p>
      <NuxtLink to="/dashboard/minuts" class="text-mattya-600 dark:text-mattya-400 font-medium hover:text-mattya-700 dark:hover:text-mattya-300 hover:underline">
        議事録を作成する →
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.status-badge {
  @apply text-xs font-medium px-2.5 py-1 rounded-full border;
}

.status-completed {
  @apply bg-mattya-100 text-mattya-800 border-mattya-200 dark:bg-mattya-900/30 dark:text-mattya-300 dark:border-mattya-800;
}

.status-processing {
  @apply bg-blue-50 text-blue-700 border-blue-200 animate-pulse dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800;
}

.status-failed {
  @apply bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800;
}

.status-default {
  @apply bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700;
}
</style>