<template>
  <div class="auth-shell">
    <div class="auth-shell-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.auth-shell {
  @apply min-h-screen flex items-center justify-center bg-stone-50 p-4;

  @media (prefers-color-scheme: dark) {
    @apply bg-stone-900;
  }
}

.auth-shell-content {
  @apply w-full max-w-md;
}
</style>
