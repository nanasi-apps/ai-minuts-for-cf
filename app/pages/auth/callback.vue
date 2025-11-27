<script setup lang="ts">
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
  <div class="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p class="text-gray-600 dark:text-gray-400">Authenticating...</p>
    </div>
  </div>
</template>
