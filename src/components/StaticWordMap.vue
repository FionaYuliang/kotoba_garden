<script setup lang="ts">
import { computed } from 'vue'

interface GroupedNode {
  id: number
  kanji: string
  kana: string
}

interface GroupedNodeSet {
  kanjiChar: string
  nodes: GroupedNode[]
}

const emit = defineEmits<{
  select: [id: number]
}>()

const props = defineProps<{
  center: {
    id: number
    kanji: string
    kana: string
  }
  groups: GroupedNodeSet[]
}>()

interface PositionedNode extends GroupedNode {
  top: string
  left: string
  lineWidth: string
  lineAngle: string
}

function buildArcLayout(nodes: GroupedNode[], side: 'left' | 'right'): PositionedNode[] {
  const centerX = 50
  const centerY = 52
  const radius = side === 'left' ? 31 : 33
  const startAngle = side === 'left' ? 210 : -30
  const endAngle = side === 'left' ? 150 : 30

  return nodes.map((node, index) => {
    const ratio = nodes.length === 1 ? 0.5 : index / (nodes.length - 1)
    const angle = startAngle + (endAngle - startAngle) * ratio
    const angleInRadians = (angle * Math.PI) / 180
    const x = centerX + Math.cos(angleInRadians) * radius
    const y = centerY + Math.sin(angleInRadians) * (radius * 0.82)
    const deltaX = x - centerX
    const deltaY = y - centerY
    const lineWidth = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const lineAngle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI

    return {
      ...node,
      top: `${y}%`,
      left: `${x}%`,
      lineWidth: `${lineWidth}%`,
      lineAngle: `${lineAngle}deg`,
    }
  })
}

const leftNodes = computed(() => buildArcLayout(props.groups[0]?.nodes ?? [], 'left'))
const rightNodes = computed(() => buildArcLayout(props.groups[1]?.nodes ?? [], 'right'))
</script>

<template>
  <div class="static-map">
    <div class="static-map__center">
      <span class="static-map__center-kanji">{{ center.kanji }}</span>
      <span class="static-map__center-kana">{{ center.kana }}</span>
    </div>

    <p v-if="groups[0]" class="static-map__group-label static-map__group-label--left">
      {{ groups[0].kanjiChar }}
    </p>
    <p v-if="groups[1]" class="static-map__group-label static-map__group-label--right">
      {{ groups[1].kanjiChar }}
    </p>

    <template v-for="node in leftNodes" :key="node.id">
      <span
        class="static-map__line"
        :style="{ width: node.lineWidth, transform: `translateY(-50%) rotate(${node.lineAngle})` }"
      ></span>
      <button
        class="static-map__node static-map__node--floating"
        type="button"
        :style="{ top: node.top, left: node.left }"
        @click="emit('select', node.id)"
      >
        <span class="static-map__node-kanji">{{ node.kanji }}</span>
        <span class="static-map__node-kana">{{ node.kana }}</span>
      </button>
    </template>

    <template v-for="node in rightNodes" :key="node.id">
      <span
        class="static-map__line"
        :style="{ width: node.lineWidth, transform: `translateY(-50%) rotate(${node.lineAngle})` }"
      ></span>
      <button
        class="static-map__node static-map__node--floating"
        type="button"
        :style="{ top: node.top, left: node.left }"
        @click="emit('select', node.id)"
      >
        <span class="static-map__node-kanji">{{ node.kanji }}</span>
        <span class="static-map__node-kana">{{ node.kana }}</span>
      </button>
    </template>
  </div>
</template>
