<script setup lang="ts">
import Toast from "./Toast.vue";

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="list">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @close="removeToast"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

.toast-container {
  @apply fixed bottom-4 right-4 z-50 flex flex-col items-end;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
