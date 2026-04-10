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

type OnyomiGraphNode = {
  id: string
  label: string
  type: 'rhyme' | 'pinyin' | 'kanji' | 'onyomi'
  selectKey?: string
  itemCount?: number
  x?: number
  y?: number
  vx?: number
  vy?: number
}

type OnyomiGraphLink = {
  source: string | OnyomiGraphNode
  target: string | OnyomiGraphNode
}

const props = defineProps<{
  nodes: OnyomiGraphNode[]
  links: OnyomiGraphLink[]
  selectedKeys: string[]
  clickableType: 'onyomi' | 'pinyin'
  mode: 'mode1' | 'mode2'
}>()

const emit = defineEmits<{
  selectKey: [key: string]
}>()

const width = 1320
const height = 680
const localNodes = ref<OnyomiGraphNode[]>([])
const localLinks = ref<OnyomiGraphLink[]>([])
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const isDragging = ref(false)
const dragOrigin = ref({ x: 0, y: 0, startX: 0, startY: 0 })
let simulation: ReturnType<typeof forceSimulation<OnyomiGraphNode>> | null = null

const positionedNodes = computed(() => localNodes.value)
const positionedLinks = computed(() => localLinks.value)
const viewportTransform = computed(
  () => `translate(${offsetX.value} ${offsetY.value}) scale(${scale.value})`,
)

function stopSimulation() {
  simulation?.stop()
  simulation = null
}

function createSimulation() {
  stopSimulation()

  const columnX =
    props.mode === 'mode1'
      ? {
          rhyme: width * 0.14,
          pinyin: width * 0.34,
          kanji: width * 0.58,
          onyomi: width * 0.82,
        }
      : {
          rhyme: width * 0.12,
          onyomi: width * 0.18,
          kanji: width * 0.5,
          pinyin: width * 0.82,
        }

  localNodes.value = props.nodes.map((node, index) => ({
    ...node,
    x: columnX[node.type] + ((index % 2) - 0.5) * 42,
    y: 110 + ((index * 58) % (height - 210)),
  }))

  localLinks.value = props.links.map((link) => ({ ...link }))

  simulation = forceSimulation(localNodes.value)
    .force(
      'link',
      forceLink<OnyomiGraphNode, OnyomiGraphLink>(localLinks.value)
        .id((node) => node.id)
        .distance((link) => {
          const sourceType = typeof link.source === 'object' ? link.source.type : 'pinyin'
          return sourceType === 'kanji' ? 140 : 126
        })
        .strength(0.8),
    )
    .force('charge', forceManyBody().strength(-320))
    .force(
      'collide',
      forceCollide<OnyomiGraphNode>().radius((node) => {
        if (node.type === 'rhyme') return 48
        if (node.type === 'onyomi') return 44
        return 38
      }),
    )
    .force('center', forceCenter(width / 2, height / 2))
    .force('x', forceX<OnyomiGraphNode>((node) => columnX[node.type]).strength(0.55))
    .force('y', forceY<OnyomiGraphNode>(height / 2).strength(0.08))
    .alpha(1)
    .alphaDecay(0.08)
}

watch(
  () => [props.nodes, props.links, props.mode],
  () => {
    createSimulation()
  },
  { deep: true, immediate: true },
)

onBeforeUnmount(() => {
  stopSimulation()
})

function handleWheel(event: WheelEvent) {
  event.preventDefault()
  const next = Math.min(2.1, Math.max(0.6, scale.value + (event.deltaY > 0 ? -0.08 : 0.08)))
  scale.value = Number(next.toFixed(2))
}

function startDrag(event: MouseEvent) {
  isDragging.value = true
  dragOrigin.value = {
    x: event.clientX,
    y: event.clientY,
    startX: offsetX.value,
    startY: offsetY.value,
  }
}

function moveDrag(event: MouseEvent) {
  if (!isDragging.value) {
    return
  }

  offsetX.value = dragOrigin.value.startX + (event.clientX - dragOrigin.value.x)
  offsetY.value = dragOrigin.value.startY + (event.clientY - dragOrigin.value.y)
}

function endDrag() {
  isDragging.value = false
}

function resetViewport() {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
}
</script>

<template>
  <div class="onyomi-graph">
    <div class="onyomi-graph__hud">
      <button class="onyomi-graph__hud-button" type="button" @click="scale = Math.min(2.1, Number((scale + 0.1).toFixed(2)))">
        放大
      </button>
      <button class="onyomi-graph__hud-button" type="button" @click="scale = Math.max(0.6, Number((scale - 0.1).toFixed(2)))">
        缩小
      </button>
      <button class="onyomi-graph__hud-button" type="button" @click="resetViewport">
        复位
      </button>
    </div>

    <svg
      class="onyomi-graph__canvas"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      aria-label="音读关系图谱"
      @wheel="handleWheel"
      @mousedown="startDrag"
      @mousemove="moveDrag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
    >
      <g :transform="viewportTransform">
        <line
          v-for="(link, index) in positionedLinks"
          :key="`${index}-${typeof link.source === 'object' ? link.source.id : link.source}`"
          class="onyomi-graph__link"
          :x1="typeof link.source === 'object' ? link.source.x ?? 0 : 0"
          :y1="typeof link.source === 'object' ? link.source.y ?? 0 : 0"
          :x2="typeof link.target === 'object' ? link.target.x ?? 0 : 0"
          :y2="typeof link.target === 'object' ? link.target.y ?? 0 : 0"
        />

        <g
          v-for="node in positionedNodes"
          :key="node.id"
          class="onyomi-graph__node"
          :class="[
            `is-${node.type}`,
            {
              'is-selected': node.selectKey && props.selectedKeys.includes(node.selectKey),
              'is-clickable': node.type === props.clickableType,
            },
          ]"
          :transform="`translate(${node.x ?? 0}, ${node.y ?? 0})`"
          @click="node.type === props.clickableType && node.selectKey ? emit('selectKey', node.selectKey) : undefined"
        >
          <circle :r="node.type === 'rhyme' ? 30 : node.type === 'onyomi' ? 28 : 24" />
          <text class="onyomi-graph__label" text-anchor="middle" dy="4">
            {{ node.label }}
          </text>
          <text
            v-if="node.type === props.clickableType && node.itemCount"
            class="onyomi-graph__count"
            text-anchor="middle"
            dy="42"
          >
            {{ node.itemCount }}组
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>
