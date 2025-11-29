<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in the template
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



const emit = defineEmits<{
  (e: 'delete', id: number): void;
}>();

// biome-ignore lint/correctness/noUnusedVariables: used in the template
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

    <div class="mt-6 flex justify-between items-center">
        <button 
          @click.prevent="$emit('delete', minuts.id)" 
          class="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 z-10 relative"
          title="削除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>

        <span class="text-sm font-medium text-mattya-600 dark:text-mattya-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
            詳細を見る
            <span class="text-lg">→</span>
        </span>
    </div>
  </NuxtLink>
</template>
