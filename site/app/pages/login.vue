<script setup lang="ts">
import { useStore } from "@tanstack/vue-store";
import AuthShell from "@/app/components/layout/AuthShell.vue";
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
  <AuthShell>
    <div class="auth-card">
      <div class="auth-card-header">
        <h1 class="auth-title">{{ $t('login.title') }}</h1>
        <p class="auth-subtitle">{{ $t('login.subtitle') }}</p>
      </div>
      <div class="auth-body">
          <Button
            variant="white"
            size="large"
            class="google-button"
            @click="handleGoogleLogin"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="google-icon" />
            {{ $t('login.google') }}
          </Button>
      </div>
    </div>
  </AuthShell>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.auth-card {
  @apply bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-stone-100 text-center;

  @media (prefers-color-scheme: dark) {
    @apply bg-stone-800 border-stone-700;
  }
}

.auth-card-header {
  @apply mb-8 space-y-2;
}

.auth-title {
  @apply text-3xl font-bold text-stone-900;

  @media (prefers-color-scheme: dark) {
    @apply text-white;
  }
}

.auth-subtitle {
  @apply text-stone-500;

  @media (prefers-color-scheme: dark) {
    @apply text-stone-400;
  }
}

.auth-body {
  @apply mt-8;
}

.google-button {
  @apply w-full justify-center flex items-center gap-3 border border-stone-200;

  @media (prefers-color-scheme: dark) {
    @apply border-stone-700;
  }
}

.google-icon {
  @apply w-5 h-5;
}
</style>
