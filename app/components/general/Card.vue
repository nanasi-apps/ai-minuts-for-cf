<script setup lang="ts">

</script>

<template>
  <div class="card">
    <slot />
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.card {
  @apply bg-white p-6 rounded-2xl shadow-md;

  @media (prefers-color-scheme: dark) {
    @apply bg-stone-800 text-white;
  }
}
</style>