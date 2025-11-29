<script setup lang="ts">
import type { InferContractRouterOutputs } from "@orpc/contract";
import type { contract } from "#/orpc";
import Button from "@/app/components/general/Button.vue";
import MinutsCard from "@/app/components/minuts/MinutsCard.vue";
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
      <MinutsCard 
        v-for="minuts in minutsLists" 
        :key="minuts.id" 
        :minuts="minuts" 
      />
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
</style>