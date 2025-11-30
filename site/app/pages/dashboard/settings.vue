<script setup lang="ts">
import Button from "@/app/components/general/Button.vue";
import StatePanel from "@/app/components/general/StatePanel.vue";
import { useApi, useAsyncApi } from "@/app/composable/useApi";

definePageMeta({
	title: "pages.settings.title",
	description: "pages.settings.description",
	layout: "dashboard",
	middleware: ["auth"],
});

const api = useApi();

const languageOptions = [
	{ value: "ja", label: "日本語" },
	{ value: "en", label: "English" },
];

const summaryPreference = ref("");
const minutesLanguage = ref("ja");
const isSaving = ref(false);
const saveMessage = ref("");
const saveError = ref("");

const { data, status, error, refresh } = useAsyncApi(
	(client) => client.users.getSettings(),
	{
		key: "api:users:getSettings",
		server: false,
		immediate: true,
	},
);

watchEffect(() => {
	if (!data.value) return;

	summaryPreference.value = data.value.summaryPreference;
	minutesLanguage.value = data.value.minutesLanguage;
});

const summaryError = computed(() => {
	return summaryPreference.value.trim().length > 120
		? "120文字以内で入力してください"
		: "";
});

const isLoading = computed(() => status.value === "pending");

const onSave = async () => {
	if (summaryError.value) return;

	isSaving.value = true;
	saveMessage.value = "";
	saveError.value = "";

	try {
		await api.users.updateSettings({
			summaryPreference: summaryPreference.value.trim(),
			minutesLanguage: minutesLanguage.value,
		});

		saveMessage.value = "設定を保存しました";
		await refresh();
	} catch (e) {
		console.error(e);
		saveError.value =
			"設定の保存に失敗しました。時間をおいて再度お試しください。";
	} finally {
		isSaving.value = false;
	}
};
</script>

<template>
  <div class="page">
    <header class="page__header">
      <div>
        <h1 class="page__title">ユーザー設定</h1>
        <p class="page__description">要約の希望や議事録の言語をユーザーごとに設定できます。</p>
      </div>
      <Button
        class="page__save"
        :disabled="isLoading || isSaving || !!summaryError"
        :shadow="true"
        @click="onSave"
      >
        {{ isSaving ? "保存中..." : "設定を保存" }}
      </Button>
    </header>

    <StatePanel
      v-if="status === 'error'"
      icon="⚠️"
      title="設定の取得に失敗しました"
      :description="error?.message ?? '時間をおいて再度お試しください。'"
      variant="error"
    >
      <template #actions>
        <Button variant="secondary" @click="refresh">再読み込み</Button>
      </template>
    </StatePanel>

    <div v-else class="panel">
      <div class="panel__section">
        <div class="panel__label">
          <h2>要約の希望</h2>
          <p>AIにどんな要約を求めるかを120文字以内で指定できます。</p>
        </div>
        <div class="panel__control">
          <textarea
            id="summaryPreference"
            v-model="summaryPreference"
            class="textarea"
            :maxlength="120"
            :disabled="isLoading"
            placeholder="例：重要な意思決定とアクションアイテムを中心に箇条書きでまとめてください"
          ></textarea>
          <div class="panel__helper">
            <span :class="['panel__counter', summaryError ? 'panel__counter--error' : '']">
              {{ summaryPreference.trim().length }} / 120
            </span>
            <span v-if="summaryError" class="panel__error">{{ summaryError }}</span>
          </div>
        </div>
      </div>

      <div class="panel__section">
        <div class="panel__label">
          <h2>議事録の言語</h2>
          <p>生成する議事録の言語をプルダウンから選択できます。</p>
        </div>
        <div class="panel__control">
          <label for="minutesLanguage" class="select__label">使用する言語</label>
          <select
            id="minutesLanguage"
            v-model="minutesLanguage"
            class="select"
            :disabled="isLoading"
            name="minutesLanguage"
          >
            <option v-for="option in languageOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="panel__footer">
        <div class="panel__status">
          <span v-if="saveMessage" class="panel__success">{{ saveMessage }}</span>
          <span v-else-if="saveError" class="panel__error">{{ saveError }}</span>
          <span v-else-if="isLoading">設定を読み込み中です...</span>
        </div>
        <div class="panel__actions">
          <Button
            :disabled="isLoading || isSaving || !!summaryError"
            :shadow="true"
            @click="onSave"
          >
            {{ isSaving ? "保存中..." : "保存する" }}
          </Button>
          <Button variant="secondary" :disabled="isLoading" @click="refresh">最新の状態を取得</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.page {
  @apply flex flex-col gap-6;
}

.page__header {
  @apply flex items-center justify-between gap-4;
}

.page__title {
  @apply text-2xl font-semibold text-stone-900 dark:text-white;
}

.page__description {
  @apply text-stone-600 dark:text-stone-300 mt-1;
}

.page__save {
  @apply min-w-[140px];
}

.panel {
  @apply bg-white dark:bg-stone-900 shadow-lg rounded-2xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col gap-8;
}

.panel__section {
  @apply flex flex-col md:flex-row md:items-start gap-4;
}

.panel__label {
  @apply w-full md:w-1/3;
}

.panel__label h2 {
  @apply text-lg font-semibold text-stone-900 dark:text-white;
}

.panel__label p {
  @apply text-sm text-stone-600 dark:text-stone-300 mt-1;
}

.panel__control {
  @apply w-full md:w-2/3 flex flex-col gap-2;
}

.textarea {
  @apply w-full min-h-[140px] px-4 py-3 rounded-xl border bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-mattya-400 focus:border-transparent transition-all duration-200;
  @apply border-stone-200 dark:border-stone-700;
}

.panel__helper {
  @apply flex items-center justify-between text-sm;
}

.panel__counter {
  @apply text-stone-500 dark:text-stone-300;
}

.panel__counter--error {
  @apply text-red-500;
}

.panel__error {
  @apply text-sm text-red-500;
}

.panel__success {
  @apply text-sm text-mattya-600 dark:text-mattya-300;
}

.select__label {
  @apply text-sm text-stone-700 dark:text-stone-200;
}

.select {
  @apply w-full px-4 py-3 rounded-xl border bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mattya-400 focus:border-transparent transition-all duration-200 border-stone-200 dark:border-stone-700;
}

.panel__footer {
  @apply border-t border-stone-200 dark:border-stone-800 pt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between;
}

.panel__status {
  @apply text-sm text-stone-600 dark:text-stone-300;
}

.panel__actions {
  @apply flex gap-3 flex-wrap;
}
</style>