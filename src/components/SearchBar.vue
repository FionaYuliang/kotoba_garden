<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()
</script>

<template>
  <label class="search-shell">
    <span class="search-icon" aria-hidden="true">⌕</span>
    <input
      :value="modelValue"
      class="search-input"
      type="text"
      placeholder="搜索汉字 / 平假名 / 罗马音"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown.enter="emit('submit')"
    />
    <button class="search-tag" type="button" @click="emit('submit')">搜索</button>
  </label>
</template>
