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
</script>

<template>
  <PageContainer size="narrow">
    <MinutsDetailSkeleton v-if="status === 'pending'" />

    <div v-else-if="minuts" class="detail-content">
        <div class="detail-header">
            <div class="detail-title">
                <h1 class="detail-heading">{{ minuts.title }}</h1>
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
              class="summary-card"
          />
          
          <div class="content-right">
            <MediaPlayer
                v-if="minuts.videoUrl"
                :src="minuts.videoUrl"
                :subtitle="minuts.subtitle"
                class="media-player"
            />
            <TranscriptCard
                v-if="minuts.transcript"
                :transcript="minuts.transcript"
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
  </PageContainer>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.detail-content {
  @apply space-y-8 h-full;
}

.detail-header {
  @apply flex justify-between items-start;
}

.detail-title {
  @apply space-y-2;
}

.detail-heading {
  @apply text-3xl font-bold text-gray-900;

  @media (prefers-color-scheme: dark) {
    @apply text-white;
  }
}

.detail-meta {
  @apply flex items-center gap-4 text-sm text-gray-500;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-400;
  }
}

.content-section {
  @apply flex gap-6 h-[calc(100vh-12rem)];
}

.summary-card {
  @apply flex-1 h-full overflow-y-auto;
}

.content-right {
  @apply flex flex-col gap-6 flex-1 h-full overflow-hidden;
}

.media-player {
  @apply shrink-0;
}

.transcript-card {
  @apply flex-1 overflow-y-auto min-h-0;
}
</style>
