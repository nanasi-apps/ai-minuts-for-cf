<script setup lang="ts">
import { useStore } from "@tanstack/vue-store";
// biome-ignore lint/correctness/noUnusedImports: used in the template
import Button from "@/app/components/general/Button.vue";
import { authStore, logout } from "@/app/stores/auth";

const router = useRouter();

// biome-ignore lint/correctness/noUnusedVariables: used in the template
const user = useStore(authStore, (state) => state.user);
// biome-ignore lint/correctness/noUnusedVariables: used in the template
const isLoading = useStore(authStore, (state) => state.isLoading);

// biome-ignore lint/correctness/noUnusedVariables: used in the template
const goToLogin = () => {
	router.push("/login");
};

// biome-ignore lint/correctness/noUnusedVariables: used in the template
const goToDashboard = () => {
	router.push("/dashboard");
};

// biome-ignore lint/correctness/noUnusedVariables: used in the template
const handleLogout = () => {
	logout();
	window.location.href = "/login";
};
</script>

<template>
    <header class="fixed top-0 w-full z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-mattya-100 dark:border-stone-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold text-mattya-800 dark:text-mattya-400 tracking-tight">{{ $t('header.title') }}</span>
        </div>
        <nav class="hidden md:flex gap-6 text-sm font-medium text-stone-600 dark:text-stone-400">
          <NuxtLink href="/#features" class="hover:text-mattya-600 dark:hover:text-mattya-300 transition-colors">{{ $t('header.nav.features') }}</NuxtLink>
          <NuxtLink href="/#pricing" class="hover:text-mattya-600 dark:hover:text-mattya-300 transition-colors">{{ $t('header.nav.pricing') }}</NuxtLink>
          <NuxtLink href="/#about" class="hover:text-mattya-600 dark:hover:text-mattya-300 transition-colors">{{ $t('header.nav.about') }}</NuxtLink>
        </nav>
        <div class="flex gap-3 items-center">
          <template v-if="isLoading">
            <div class="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse"></div>
          </template>
          <template v-else-if="user">
            <Button variant="secondary" @click="goToDashboard" class="!px-3 !py-1 !text-xs">{{ $t('header.gotoDashboard')}}</Button>
            <img v-if="user.picture" :src="user.picture" alt="User Avatar" class="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700" />
            <div v-else class="w-8 h-8 rounded-full bg-mattya-100 dark:bg-mattya-900 flex items-center justify-center text-mattya-600 dark:text-mattya-400 font-bold">
              {{ user.name.charAt(0) }}
            </div>
            <Button variant="secondary" @click="handleLogout" class="!px-3 !py-1 !text-xs">{{ $t('header.logout') }}</Button>
          </template>
          <template v-else>
            <Button @click="goToLogin()">{{ $t('header.login') }}</Button>
          </template>
        </div>
      </div>
    </header>
</template>
