<script setup lang="ts">
const fileInput = useTemplateRef<HTMLInputElement>("fileInput");

const openFileDialog = () => {
	fileInput.value?.click();
};
</script>

<template>
  <div>
    <button @click="openFileDialog">
      ファイルを選択
    </button>
    <input ref="fileInput" type="file" />
  </div>
</template>

<style scoped>
@reference "@/app/assets/index.css";

input {
  @apply hidden;
}

button {
  @apply rounded w-full h-[40em] cursor-pointer border-dashed border-2 border-gray-300 bg-gray-50 text-gray-600 p-4 ;
  
  :hover {
    @apply border-gray-400 bg-gray-100;
  }
  
  :focus {
    @apply outline-none ring-2 ring-blue-500;
  }
}



@media (prefers-color-scheme: dark) {
  button {
    @apply border-gray-600 bg-stone-900 text-gray-300 opacity-50 ;
  }
}
</style>