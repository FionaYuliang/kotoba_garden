<script setup lang="ts">
interface StaticNode {
  kanji: string
  kana: string
  className: string
}

defineProps<{
  center: {
    kanji: string
    kana: string
  }
  nodes: StaticNode[]
}>()
</script>

<template>
  <div class="static-map">
    <div class="static-map__center">
      <span class="static-map__center-kanji">{{ center.kanji }}</span>
      <span class="static-map__center-kana">{{ center.kana }}</span>
    </div>

    <div
      v-for="node in nodes"
      :key="`${node.className}-${node.kanji}`"
      class="static-map__node"
      :class="node.className"
    >
      <span class="static-map__node-kanji">{{ node.kanji }}</span>
      <span class="static-map__node-kana">{{ node.kana }}</span>
    </div>

    <span class="static-map__line top"></span>
    <span class="static-map__line right-top"></span>
    <span class="static-map__line right-bottom"></span>
    <span class="static-map__line left-bottom"></span>
    <span class="static-map__line left-top"></span>
  </div>
</template>
