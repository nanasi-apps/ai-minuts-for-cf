<template>
  <div class="detail-skeleton">
    <div class="detail-skeleton__line detail-skeleton__line--title"></div>
    <div class="detail-skeleton__line detail-skeleton__line--meta"></div>
    <div class="detail-skeleton__block">
      <div class="detail-skeleton__line"></div>
      <div class="detail-skeleton__line"></div>
      <div class="detail-skeleton__line detail-skeleton__line--short"></div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.detail-skeleton {
  @apply animate-pulse space-y-4;
}

.detail-skeleton__line {
  @apply bg-gray-200 rounded;

  @media (prefers-color-scheme: dark) {
    @apply bg-gray-700;
  }
}

.detail-skeleton__line--title {
  @apply h-8 w-1/3 mb-4;
}

.detail-skeleton__line--meta {
  @apply h-4 w-1/4 mb-8;
}

.detail-skeleton__line--short {
  @apply w-3/4;
}

.detail-skeleton__block {
  @apply space-y-4;
}
</style>
