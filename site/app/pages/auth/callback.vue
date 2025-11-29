<script setup lang="ts">
import AuthShell from "@/app/components/layout/AuthShell.vue";
import { setUser } from "@/app/stores/auth";

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();

onMounted(async () => {
	const token = route.query.token as string;

	if (token) {
		// Save token to localStorage
		localStorage.setItem("session_token", token);

		// Redirect to dashboard with hard reload to ensure clean state and auth initialization
		window.location.href = "/";
	} else {
		router.push("/login");
	}
});
</script>

<template>
  <AuthShell>
    <div class="callback-card">
      <div class="spinner"></div>
      <p class="callback-text">Authenticating...</p>
    </div>
  </AuthShell>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.callback-card {
  @apply text-center space-y-4;
}

.spinner {
  @apply animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto;
}

.callback-text {
  @apply text-gray-600;

  @media (prefers-color-scheme: dark) {
    @apply text-gray-400;
  }
}
</style>
