<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in the template
import Button from "@/app/components/general/Button.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import PageContainer from "@/app/components/layout/PageContainer.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import MinutsDetailSkeleton from "@/app/components/minuts/MinutsDetailSkeleton.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import StatusBadge from "@/app/components/minuts/StatusBadge.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import SummaryCard from "@/app/components/minuts/SummaryCard.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
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
// biome-ignore lint/correctness/noUnusedVariables: used in the template
const { formatDate } = useDateFormat();
const { addToast } = useToast();

const {
	// biome-ignore lint/correctness/noUnusedVariables: used in the template
	data: minuts,
	// biome-ignore lint/correctness/noUnusedVariables: used in the template
	status,
	refresh,
} = useAsyncApi(() => api.minuts.get({ id: minutsId }), {
	key: `api:minuts:${minutsId}`,
	server: true,
});

// biome-ignore lint/correctness/noUnusedVariables: used in the template
const processMinuts = async () => {
	try {
		await api.minuts.process({ minutsId });
		addToast("処理を開始しました", "success");
	} catch (e) {
		console.error(e);
		addToast("処理の開始に失敗しました", "error");
	}
};

// biome-ignore lint/correctness/noUnusedVariables: used in the template
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
