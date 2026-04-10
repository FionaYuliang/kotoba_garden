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
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
const minScale = 0.55
const maxScale = 3.2
const localNodes = ref<OnyomiGraphNode[]>([])
const localLinks = ref<OnyomiGraphLink[]>([])
const svgRef = ref<SVGSVGElement | null>(null)
const viewportTransformState = ref<ZoomTransform>(zoomIdentity)
let simulation: ReturnType<typeof forceSimulation<OnyomiGraphNode>> | null = null
let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null

const positionedNodes = computed(() => localNodes.value)
const positionedLinks = computed(() => localLinks.value)
const viewportTransform = computed(() => viewportTransformState.value.toString())

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
  if (svgRef.value) {
    select(svgRef.value).on('.zoom', null)
  }
})

function setupZoom() {
  if (!svgRef.value) {
    return
  }

  zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([minScale, maxScale])
    .filter((event) => {
      if (event.type === 'dblclick') {
        return false
      }

      if (event.type === 'mousedown') {
        return event.button === 0
      }

      return true
    })
    .on('zoom', (event) => {
      viewportTransformState.value = event.transform
    })

  const svgSelection = select(svgRef.value)
  svgSelection.call(zoomBehavior)
  svgSelection.on('dblclick.zoom', null)
}

function zoomBy(factor: number) {
  if (!svgRef.value || !zoomBehavior) {
    return
  }

  select(svgRef.value).call(zoomBehavior.scaleBy, factor)
}

function resetViewport() {
  if (!svgRef.value || !zoomBehavior) {
    return
  }

  select(svgRef.value).call(zoomBehavior.transform, zoomIdentity)
}

onMounted(() => {
  setupZoom()
})
</script>

<template>
  <div class="onyomi-graph">
    <div class="onyomi-graph__hud">
      <button class="onyomi-graph__hud-button" type="button" @click="zoomBy(1.18)">
        放大
      </button>
      <button class="onyomi-graph__hud-button" type="button" @click="zoomBy(1 / 1.18)">
        缩小
      </button>
      <button class="onyomi-graph__hud-button" type="button" @click="resetViewport">
        复位
      </button>
    </div>

    <svg
      ref="svgRef"
      class="onyomi-graph__canvas"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      aria-label="音读关系图谱"
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
