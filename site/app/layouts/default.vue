<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in the template
import Footer from "@/app/components/layout/Footer.vue";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import Header from "@/app/components/layout/Header.vue";

const nowUrl = useRoute().fullPath;
// biome-ignore lint/correctness/noUnusedVariables: used in the template
const isExcluded = !nowUrl.startsWith("/dashboard");
</script>

<template>
  <div class="min-h-screen bg-mattya-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 font-sans selection:bg-mattya-200 dark:selection:bg-mattya-900">
    <Header v-if="isExcluded" />
    <main class="min-h-[calc(100vh-4rem)]" :class="isExcluded ? 'pt-16' : ''">
      <slot />
    </main>
    <Footer v-if="isExcluded" />
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";


</style>