<script setup lang="ts">
import { useTemplateRef } from "vue";

const dialogRef = useTemplateRef("dialogRef");

interface Props {
	title?: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
	type?: "info" | "warning" | "danger";
}

const props = withDefaults(defineProps<Props>(), {
	title: "確認",
	message: "本当に実行しますか？",
	confirmText: "OK",
	cancelText: "キャンセル",
	type: "info",
});

const emit = defineEmits<{
	(e: "confirm"): void;
	(e: "cancel"): void;
}>();

const isClosing = ref(false);

const open = () => {
	isClosing.value = false;
	dialogRef.value?.showModal();
};

const close = () => {
	isClosing.value = true;
	setTimeout(() => {
		dialogRef.value?.close();
		isClosing.value = false;
	}, 300);
};

const onConfirm = () => {
	emit("confirm");
	close();
};

const onCancel = () => {
	emit("cancel");
	close();
};

defineExpose({
	open,
	close,
});
</script>

<template>
  <dialog 
    ref="dialogRef" 
    class="rounded-xl p-0 shadow-xl dark:bg-stone-900 dark:text-white border border-gray-200 dark:border-gray-800"
    :class="{ closing: isClosing }"
    @cancel.prevent="onCancel"
  >
    <div class="p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-2" :class="{
            'text-red-600 dark:text-red-400': type === 'danger',
            'text-yellow-600 dark:text-yellow-400': type === 'warning',
            'text-gray-900 dark:text-white': type === 'info'
        }">{{ title }}</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">{{ message }}</p>
        
        <div class="flex justify-end gap-3">
            <button @click="onCancel" class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                {{ cancelText }}
            </button>
            <button @click="onConfirm" class="px-4 py-2 rounded-lg text-white transition-colors shadow-sm" :class="{
                'bg-red-600 hover:bg-red-700': type === 'danger',
                'bg-yellow-600 hover:bg-yellow-700': type === 'warning',
                'bg-mattya-600 hover:bg-mattya-700': type === 'info'
            }">
                {{ confirmText }}
            </button>
        </div>
    </div>
  </dialog>
</template>

<style scoped>
dialog {
    margin: auto;
}

dialog[open] {
    animation: dialog-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

dialog.closing {
    animation: dialog-exit 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

dialog::backdrop {
    background-color: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0);
}

dialog[open]::backdrop {
    animation: backdrop-enter 0.3s ease forwards;
}

dialog.closing::backdrop {
    animation: backdrop-exit 0.3s ease forwards;
}

@keyframes dialog-enter {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes dialog-exit {
    from { opacity: 1; transform: scale(1) translateY(0); }
    to { opacity: 0; transform: scale(0.95) translateY(10px); }
}

@keyframes backdrop-enter {
    from { background-color: rgba(0, 0, 0, 0); backdrop-filter: blur(0); }
    to { background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); }
}

@keyframes backdrop-exit {
    from { background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); }
    to { background-color: rgba(0, 0, 0, 0); backdrop-filter: blur(0); }
}
</style>
