<script setup lang="ts">
</script>

<template>
    <footer class="bg-stone-50 dark:bg-stone-950 py-12 border-t border-stone-200 dark:border-stone-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="text-stone-500 dark:text-stone-500 text-sm">
          {{ $t('footer.copyright') }}
        </div>
        <div class="flex gap-6 text-stone-500 dark:text-stone-500 text-sm">
          <a href="#" class="hover:text-mattya-700 dark:hover:text-mattya-400">{{ $t('footer.privacy') }}</a>
          <a href="#" class="hover:text-mattya-700 dark:hover:text-mattya-400">{{ $t('footer.terms') }}</a>
          <a href="#" class="hover:text-mattya-700 dark:hover:text-mattya-400">{{ $t('footer.contact') }}</a>
        </div>
      </div>
    </footer>
</template>
