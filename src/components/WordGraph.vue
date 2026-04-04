<script setup lang="ts">
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import type { GraphLink, GraphNode } from '@/types/word'

const props = defineProps<{
  nodes: GraphNode[]
  links: GraphLink[]
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

const width = 920
const height = 620
const localNodes = ref<GraphNode[]>([])
const localLinks = ref<GraphLink[]>([])
let simulation: ReturnType<typeof forceSimulation<GraphNode>> | null = null

const positionedNodes = computed(() => localNodes.value)
const positionedLinks = computed(() => localLinks.value)

function stopSimulation() {
  simulation?.stop()
  simulation = null
}

function createSimulation() {
  stopSimulation()

  const groups = [...new Set(props.nodes.map((node) => node.primary_group).filter(Boolean))]

  localNodes.value = props.nodes.map((node, index) => ({
    ...node,
    x:
      node.isCenter
        ? width / 2
        : width / 2 +
          (node.primary_group === groups[0] ? -1 : 1) * (130 + (index % 3) * 48),
    y: node.isCenter ? height / 2 : height / 2 - 140 + (index % 6) * 58,
    fx: node.isCenter ? width / 2 : null,
    fy: node.isCenter ? height / 2 : null,
  }))

  localLinks.value = props.links.map((link) => ({ ...link }))

  simulation = forceSimulation(localNodes.value)
    .force(
      'link',
      forceLink<GraphNode, GraphLink>(localLinks.value)
        .id((d) => d.id)
        .distance((link) => 120 + (1 - link.strength) * 90)
        .strength((link) => 0.3 + link.strength * 0.4),
    )
    .force('charge', forceManyBody().strength(-320))
    .force('collide', forceCollide<GraphNode>().radius((node) => (node.isCenter ? 98 : 62)))
    .force(
      'group-x',
      forceX<GraphNode>((node) => {
        if (node.isCenter) {
          return width / 2
        }

        if (groups.length < 2) {
          return width / 2
        }

        return node.primary_group === groups[0] ? width * 0.28 : width * 0.72
      }).strength(0.2),
    )
    .force(
      'group-y',
      forceY<GraphNode>((node) => (node.isCenter ? height / 2 : height / 2)).strength(0.06),
    )
    .force('center', forceCenter(width / 2, height / 2))
    .alpha(1)
    .alphaDecay(0.06)
}

watch(
  () => [props.nodes, props.links],
  () => {
    createSimulation()
  },
  { deep: true, immediate: true },
)

onBeforeUnmount(() => {
  stopSimulation()
})
</script>

<template>
  <div class="graph-shell">
    <svg class="graph-canvas" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="词汇关系图谱">
      <defs>
        <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="rgba(117, 98, 83, 0.12)" />
        </filter>
      </defs>

      <line
        v-for="(link, index) in positionedLinks"
        :key="`${index}-${typeof link.source === 'object' ? link.source.id : link.source}`"
        class="graph-link"
        :x1="typeof link.source === 'object' ? link.source.x ?? 0 : width / 2"
        :y1="typeof link.source === 'object' ? link.source.y ?? 0 : height / 2"
        :x2="typeof link.target === 'object' ? link.target.x ?? 0 : 0"
        :y2="typeof link.target === 'object' ? link.target.y ?? 0 : 0"
      />

      <g
        v-for="node in positionedNodes"
        :key="node.id"
        class="graph-node"
        :class="{ 'is-center': node.isCenter }"
        :transform="`translate(${node.x ?? width / 2}, ${node.y ?? height / 2})`"
        @click="emit('select', node.id)"
      >
        <circle :r="node.isCenter ? 86 : 54" filter="url(#node-shadow)" />
        <text
          class="word-main"
          :class="{ 'is-center': node.isCenter }"
          text-anchor="middle"
          :dy="node.isCenter ? '-10' : '-6'"
        >
          {{ node.kanji }}
        </text>
        <text class="word-sub" :class="{ 'is-center': node.isCenter }" text-anchor="middle" :dy="node.isCenter ? '22' : '26'">
          {{ node.kana }}
        </text>
      </g>
    </svg>
  </div>
</template>
