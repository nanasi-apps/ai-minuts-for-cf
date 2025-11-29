<script setup lang="ts">
interface Props {
  status: string;
}

const props = defineProps<Props>();

const statusConfig = computed(() => {
  switch (props.status) {
    case "COMPLETED":
      return {
        label: "完了",
        classes: "bg-mattya-100 text-mattya-800 border-mattya-200 dark:bg-mattya-900/30 dark:text-mattya-300 dark:border-mattya-800"
      };
    case "PROCESSING":
      return {
        label: "処理中",
        classes: "bg-blue-50 text-blue-700 border-blue-200 animate-pulse dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
      };
    case "FAILED":
      return {
        label: "失敗",
        classes: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
      };
    case "UPLOADING":
      return {
        label: "アップロード中",
        classes: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
      };
    default:
      return {
        label: props.status,
        classes: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
      };
  }
});
</script>

<template>
  <span 
    class="text-xs font-medium px-2.5 py-1 rounded-full border"
    :class="statusConfig.classes"
  >
    {{ statusConfig.label }}
  </span>
</template>
