<script setup lang="ts">
import type { InferContractRouterOutputs } from "@orpc/contract";
import type { contract } from "#/orpc";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import Button from "@/app/components/general/Button.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import StatePanel from "@/app/components/general/StatePanel.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import PageContainer from "@/app/components/layout/PageContainer.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import SectionHeader from "@/app/components/layout/SectionHeader.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import MinutsCard from "@/app/components/minuts/MinutsCard.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import MinutsSkeletonGrid from "@/app/components/minuts/MinutsSkeletonGrid.vue";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog.vue";
import { useApi, useAsyncApi } from "@/app/composable/useApi";

export type Outputs = InferContractRouterOutputs<typeof contract>;

type MinutsList = Outputs["minuts"]["list"];

definePageMeta({
	layout: "dashboard",
	middleware: ["auth"],
});

const api = useApi();

const {
	data: minutsList,
	// biome-ignore lint/correctness/noUnusedVariables: used in the template
	status,
	// biome-ignore lint/correctness/noUnusedVariables: used in the template
	refresh,
} = useAsyncApi<MinutsList>((api) => api.minuts.list(), {
	key: "api:minuts:list",
	server: false,
	dedupe: "defer",
});

// biome-ignore lint/correctness/noUnusedVariables: used in the template
const minutsLists = computed(() => minutsList.value ?? []);

const confirmDialog = ref<InstanceType<typeof ConfirmDialog> | null>(null);
const deletingId = ref<number | null>(null);

const onDeleteClick = (id: number) => {
  deletingId.value = id;
  confirmDialog.value?.open();
};

const onConfirmDelete = async () => {
  if (deletingId.value === null) return;
  
  try {
    await api.minuts.delete({ id: deletingId.value });
    refresh();
  } catch (e) {
    console.error(e);
  } finally {
    deletingId.value = null;
  }
};
</script>

<template>
  <PageContainer>
    <SectionHeader
      :title="$t('dashboard.overview')"
      description="議事録の管理と閲覧ができます"
    >
      <template #actions>
        <NuxtLink to="/dashboard/minuts" class="create-button">
          <span class="create-button__icon">+</span>
          新規作成
        </NuxtLink>
      </template>
    </SectionHeader>

    <MinutsSkeletonGrid v-if="status === 'pending'" />

    <div v-else-if="minutsLists && minutsLists.length > 0" class="card-grid">
      <MinutsCard
        v-for="minuts in minutsLists"
        :key="minuts.id"
        :minuts="minuts"
        @delete="onDeleteClick"
      />
    </div>

    <StatePanel
      v-else-if="status === 'error'"
      icon="⚠️"
      title="読み込みに失敗しました"
      description="データの取得中にエラーが発生しました。"
      variant="error"
    >
      <template #actions>
        <Button @click="refresh" variant="secondary" class="retry-button">
          再読み込み
        </Button>
      </template>
    </StatePanel>

    <StatePanel
      v-else
      icon="📝"
      title="まだ議事録がありません"
      description="新しい会議の録音をアップロードして、議事録を作成しましょう"
    >
      <template #actions>
        <NuxtLink to="/dashboard/minuts" class="link-button">
          議事録を作成する →
        </NuxtLink>
      </template>
    </StatePanel>

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

.create-button {
  @apply bg-mattya-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2;

  @media (prefers-color-scheme: dark) {
    @apply hover:bg-mattya-700;
  }
}

.create-button__icon {
  @apply text-xl;
}

.card-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.retry-button {
  @apply text-red-700 hover:bg-red-100;

  @media (prefers-color-scheme: dark) {
    @apply text-red-400 hover:bg-red-900/40;
  }
}

.link-button {
  @apply text-mattya-600 font-medium hover:text-mattya-700 hover:underline;

  @media (prefers-color-scheme: dark) {
    @apply text-mattya-400 hover:text-mattya-300;
  }
}
</style>