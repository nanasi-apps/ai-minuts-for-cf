<script setup lang="ts">
import { useStore } from "@tanstack/vue-store";
import Button from "@/app/components/general/Button.vue";
import { authStore } from "@/app/stores/auth";

const user = useStore(authStore, (state) => state.user);
const router = useRouter();

watchEffect(() => {
	if (user.value) {
		router.push("/");
	}
});

const handleGoogleLogin = () => {
	// Navigate to Google login route
	window.location.href = "/auth/google/login";
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white dark:bg-stone-800 rounded-3xl shadow-xl p-8 md:p-10 border border-stone-100 dark:border-stone-700">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-stone-900 dark:text-white mb-2">{{ $t('login.title') }}</h1>
          <p class="text-stone-500 dark:text-stone-400">{{ $t('login.subtitle') }}</p>
        </div>
        <div class="mt-8">
            <Button 
              variant="white" 
              size="large" 
              class="w-full justify-center flex items-center gap-3 border border-stone-200 dark:border-stone-700"
              @click="handleGoogleLogin"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-5 h-5" />
              {{ $t('login.google') }}
            </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";
</style>
