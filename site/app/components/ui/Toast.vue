<script setup lang="ts">
import type { Toast } from "@/app/composables/useToast";

const props = defineProps<{
	toast: Toast;
}>();

// biome-ignore lint/correctness/noUnusedVariables: used in the template
const emit = defineEmits<(e: "close", id: number) => void>();

// biome-ignore lint/correctness/noUnusedVariables: used in the template
const typeClasses = computed(() => {
	switch (props.toast.type) {
		case "success":
			return "bg-green-500 text-white";
		case "error":
			return "bg-red-500 text-white";
		default:
			return "bg-blue-500 text-white";
	}
});
</script>

<template>
  <div
    class="toast"
    :class="typeClasses"
    @click="emit('close', toast.id)"
  >
    <span>{{ toast.message }}</span>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.toast {
  @apply px-4 py-2 rounded shadow-lg cursor-pointer transition-all duration-300 mb-2;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
