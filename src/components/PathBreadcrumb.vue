<script setup lang="ts">
import { computed } from 'vue'

import { getWordById } from '@/services/wordService'

const props = defineProps<{
  ids: number[]
}>()

const items = computed(() =>
  props.ids
    .map((id) => getWordById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item)),
)
</script>

<template>
  <div class="path-shell">
    <span v-for="(item, index) in items" :key="item.id" class="path-item">
      <span>{{ item.kanji }}</span>
      <span v-if="index < items.length - 1" class="path-arrow">×</span>
    </span>
  </div>
</template>
