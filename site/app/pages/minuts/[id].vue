<script setup lang="ts">
import Button from "@/app/components/general/Button.vue";
import PageContainer from "@/app/components/layout/PageContainer.vue";
import StatusBadge from "@/app/components/minuts/StatusBadge.vue";
import MinutsDetailSkeleton from "@/app/components/minuts/MinutsDetailSkeleton.vue";
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
  </PageContainer>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.detail-content {
  @apply space-y-8;
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
</style>
