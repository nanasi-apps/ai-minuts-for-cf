<script setup lang="ts">
import StatusBadge from "@/app/components/minuts/StatusBadge.vue";
import { useDateFormat } from "@/app/composables/useDateFormat";

interface MinutsItem {
  id: number;
  title: string;
  status: string;
  createdAt: string | Date;
}

interface Props {
  minuts: MinutsItem;
}

defineProps<Props>();

const { formatDate } = useDateFormat();
</script>

<template>
  <NuxtLink 
    :to="`/minuts/${minuts.id}`"
    class="group bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-800 transition-all hover:-translate-y-1 relative overflow-hidden"
  >
    <div class="absolute top-0 right-0 p-4">
        <StatusBadge :status="minuts.status" />
    </div>
    
    <div class="mt-2">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-mattya-700 dark:group-hover:text-mattya-400 transition-colors">
            {{ minuts.title }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {{ formatDate(minuts.createdAt) }}
        </p>
    </div>

    <div class="mt-6 flex justify-end">
        <span class="text-sm font-medium text-mattya-600 dark:text-mattya-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
            詳細を見る
            <span class="text-lg">→</span>
        </span>
    </div>
  </NuxtLink>
</template>
