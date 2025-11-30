<script setup lang="ts">
import Sidebar from "@/app/components/dashboard/sidebar/Sidebar.vue";
import PageContainer from "@/app/components/layout/PageContainer.vue";
import SectionHeader from "@/app/components/layout/SectionHeader.vue";
import UiToastContainer from "@/app/components/ui/ToastContainer.vue";

const route = useRoute();
const { t } = useI18n();

const sidebarItems = computed(() => [
	{
		name: t("sidebar.overview"),
		icon: "mdi-view-dashboard",
		route: "/dashboard",
	},
	{ name: t("minuts"), icon: "mdi-file-chart", route: "/dashboard/minuts" },
	{
		name: t("sidebar.settings"),
		icon: "mdi-cog",
		route: "/dashboard/settings",
	},
]);

const title = computed(() =>
	route.meta?.title ? t(route.meta.title as string) : undefined,
);
const description = computed(() =>
	route.meta?.description ? t(route.meta.description as string) : undefined,
);
const pageSize = computed(
	() => (route.meta?.pageSize as "narrow" | "wide" | undefined) ?? "wide",
);
</script>

<template>
  <div class="root">
    <Sidebar :items="sidebarItems" />
    <main>
      <PageContainer :size="pageSize">
          <SectionHeader
            v-if="title || description"
            :title="title"
            :description="description"
          />
          <slot />
      </PageContainer>
    </main>
    <UiToastContainer />
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.root {
  @apply min-h-screen font-sans w-full flex gap-3 ;
}

@media (prefers-color-scheme: light) {
  .root {
    @apply bg-stone-50 text-stone-800;
    
    ::selection {
      @apply bg-mattya-200;
    }
  }
}

@media (prefers-color-scheme: dark) {
  .root {
    @apply bg-stone-950 text-stone-200;

    ::selection {
      @apply bg-mattya-900;
    }
  }
}

main {
  @apply flex-1 p-4;
}

.title {
  @apply text-2xl font-bold mb-4;
}
</style>