<script setup lang="ts">
interface Props {
	modelValue: string;
	label?: string;
	type?: string;
	placeholder?: string;
	id?: string;
	error?: string;
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	type: "text",
	disabled: false,
});

const emit = defineEmits<(e: "update:modelValue", value: string) => void>();

const updateValue = (event: Event) => {
	const target = event.target as HTMLInputElement;
	emit("update:modelValue", target.value);
};
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-full px-4 py-3 rounded-xl border bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-mattya-400 focus:border-transparent transition-all duration-200"
        :class="[
          error 
            ? 'border-red-500 focus:ring-red-200' 
            : 'border-stone-200 dark:border-stone-700 hover:border-mattya-300',
          disabled ? 'opacity-50 cursor-not-allowed bg-stone-50' : ''
        ]"
        @input="updateValue"
      />
    </div>
    <p v-if="error" class="mt-1.5 text-sm text-red-500">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";
</style>