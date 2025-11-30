<script setup lang="ts">
import type { InferContractRouterOutputs } from "@orpc/contract";
import type { contract } from "#/orpc";
import Button from "@/app/components/general/Button.vue";
import PageContainer from "@/app/components/layout/PageContainer.vue";
import MediaPlayer from "@/app/components/minuts/MediaPlayer.vue";
import MinutsDetailSkeleton from "@/app/components/minuts/MinutsDetailSkeleton.vue";
import StatusBadge from "@/app/components/minuts/StatusBadge.vue";
import SummaryCard from "@/app/components/minuts/SummaryCard.vue";
import TranscriptCard from "@/app/components/minuts/TranscriptCard.vue";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog.vue";
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

export type Outputs = InferContractRouterOutputs<typeof contract>;

type Minuts = Outputs["minuts"]["get"];

const { data: minuts, status } = await useAsyncApi<Minuts>(() =>
	api.minuts.get({ minutsId }),
);

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
	try {
		await api.minuts.regenerateSummary({ minutsId });
		addToast("再要約を開始しました", "success");
	} catch (e) {
		addToast("再要約の開始に失敗しました", "error");
	}
};

const confirmDialog = ref<InstanceType<typeof ConfirmDialog> | null>(null);

const mediaPlayer = useTemplateRef("mediaPlayer");
const currentTime = ref(0);

const handleSeek = (time: number) => {
	mediaPlayer.value?.seekTo(time);
};

const handleTimeUpdate = (time: number) => {
	currentTime.value = time;
};

const handleDelete = () => {
	confirmDialog.value?.open();
};

const onConfirmDelete = async () => {
	try {
		await api.minuts.delete({ minutsId });
		addToast("削除しました", "success");
		navigateTo("/dashboard");
	} catch (e) {
		console.error(e);
		addToast("削除に失敗しました", "error");
	}
};

const isEditingTitle = ref(false);
const editingTitle = ref("");
const titleInput = ref<HTMLInputElement | null>(null);

const startEditingTitle = async () => {
	editingTitle.value = minuts.value?.title || "";
	isEditingTitle.value = true;
	await nextTick();
	titleInput.value?.focus();
};

const saveTitle = async () => {
	if (!editingTitle.value || !minuts.value) return;

	try {
		const result = await api.minuts.update({
			minutsId,
			title: editingTitle.value,
		});

		// Update local state
		minuts.value.title = result.minuts.title;
		isEditingTitle.value = false;
		addToast("タイトルを更新しました", "success");
	} catch (e) {
		console.error(e);
		addToast("タイトルの更新に失敗しました", "error");
	}
};

const cancelEditingTitle = () => {
	isEditingTitle.value = false;
};
</script>

<template>
    <MinutsDetailSkeleton v-if="status === 'pending'" />

    <div v-else-if="minuts" class="detail-content">
        <div class="detail-header">
            <div class="detail-title">
                <div v-if="!isEditingTitle" class="group flex items-center gap-2">
                    <h1 class="detail-heading">{{ minuts.title }}</h1>
                    <button 
                        @click="startEditingTitle" 
                        class="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="タイトルを編集"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                </div>
                <div v-else class="flex items-center gap-2 w-full max-w-2xl">
                    <input 
                        v-model="editingTitle" 
                        @keydown.enter="saveTitle"
                        @keydown.esc="cancelEditingTitle"
                        ref="titleInput"
                        type="text"
                        class="detail-heading bg-transparent border-b-2 border-primary-500 focus:outline-none w-full px-1 py-0.5"
                    />
                    <div class="flex shrink-0">
                        <button @click="saveTitle" class="p-1.5 text-green-600 hover:bg-green-50 rounded-md dark:text-green-400 dark:hover:bg-green-900/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        </button>
                        <button @click="cancelEditingTitle" class="p-1.5 text-red-600 hover:bg-red-50 rounded-md dark:text-red-400 dark:hover:bg-red-900/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                </div>
                <div class="detail-meta">
                    <span>{{ formatDate(minuts.createdAt) }}</span>
                    <StatusBadge :status="minuts.status" />
                </div>
            </div>

            <div class="flex gap-2">
                <Button
                    v-if="minuts.status === 'UPLOADING' || minuts.status === 'FAILED'"
                    @click="processMinuts"
                    variant="primary"
                >
                    議事録を作成する
                </Button>
                <Button
                    @click="handleDelete"
                    variant="secondary"
                    class="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                    削除
                </Button>
            </div>
        </div>

        <div class="content-section">
          <SummaryCard
              v-if="minuts.summary"
              :summary="minuts.summary"
              :is-processing="minuts.status === 'PROCESSING'"
              @regenerate="regenerateSummary"
              @seek="handleSeek"
              class="summary-card"
          />
          
          <div class="content-right">
            <MediaPlayer
                v-if="minuts.videoUrl"
                ref="mediaPlayer"
                :src="minuts.videoUrl"
                :subtitle="minuts.subtitle"
                @timeupdate="handleTimeUpdate"
                class="media-player"
            />
            <TranscriptCard
                v-if="minuts.transcript"
                :transcript="minuts.transcript"
                :current-time="currentTime"
                @seek="handleSeek"
                class="transcript-card"
            />
          </div>
        </div>


    </div>

    <ConfirmDialog
      ref="confirmDialog"
      title="議事録の削除"
      message="この議事録を削除してもよろしいですか？この操作は取り消せません。"
      confirm-text="削除する"
      type="danger"
      @confirm="onConfirmDelete"
    />
</template>

<style scoped>
@reference "@/app/assets/index.css";

.detail-content {
  @apply space-y-6 lg:space-y-8 h-full;
}

.detail-header {
  @apply flex flex-col md:flex-row justify-between items-start gap-4;
}

.detail-title {
  @apply space-y-2 w-full md:w-auto;
}

.detail-heading {
  @apply text-2xl md:text-3xl font-bold text-gray-900;

  @media (prefers-color-scheme: dark) {
    @apply text-white;
  }
}

.detail-meta {
  @apply flex flex-wrap items-center gap-4 text-sm text-gray-500;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-400;
  }
}

.content-section {
  @apply flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-12rem)];
}

.summary-card {
  @apply w-full lg:flex-1 h-[500px] lg:h-full overflow-y-auto;
}

.content-right {
  @apply flex flex-col gap-6 w-full lg:flex-1 h-auto lg:h-full overflow-hidden;
}

.media-player {
  @apply shrink-0;
}

.transcript-card {
  @apply w-full h-[500px] lg:flex-1 overflow-y-auto min-h-0;
}
</style>
