<script setup lang="ts">
defineEmits<{
  clear: []
  reset: []
}>()
</script>

<template>
  <nav class="toolbar-shell" aria-label="Graph actions">
    <button class="toolbar-button" type="button" @click="$emit('clear')">
      <span class="toolbar-icon">⌁</span>
      <span>清空路径</span>
    </button>
    <button class="toolbar-button is-active" type="button">
      <span class="toolbar-icon">✦</span>
      <span>正在漫游</span>
    </button>
    <button class="toolbar-button" type="button" @click="$emit('reset')">
      <span class="toolbar-icon">◌</span>
      <span>重新开始</span>
    </button>
  </nav>
</template>
