<script setup lang="ts">
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
  activeLinkKey: string
  clickableType: 'onyomi' | 'pinyin'
  mode: 'mode1' | 'mode2'
}>()

const emit = defineEmits<{
  selectKey: [key: string]
  selectKanjiGroup: [key: string]
}>()

const width = 1320
const height = 680
const minScale = 0.55
const maxScale = 3.2
const localNodes = ref<OnyomiGraphNode[]>([])
const localLinks = ref<OnyomiGraphLink[]>([])
const svgRef = ref<SVGSVGElement | null>(null)
const viewportTransformState = ref<ZoomTransform>(zoomIdentity)
let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null

const positionedNodes = computed(() => localNodes.value)
const positionedLinks = computed(() => localLinks.value)
const viewportTransform = computed(() => viewportTransformState.value.toString())

function getNodeLabelLines(node: OnyomiGraphNode) {
  const segments = node.label.split(' / ')
  if (segments.length <= 1) {
    return [node.label]
  }

  const chunkSize = node.type === 'kanji' ? 6 : 3
  const lines: string[] = []

  for (let index = 0; index < segments.length; index += chunkSize) {
    lines.push(segments.slice(index, index + chunkSize).join(' / '))
  }

  return lines
}

function getNodeBlockSize(node: OnyomiGraphNode) {
  const lines = getNodeLabelLines(node)
  const longestLineLength = Math.max(...lines.map((line) => line.length))

  if (node.type === 'pinyin') {
    return {
      width: Math.min(280, Math.max(120, longestLineLength * 8 + 42)),
      height: 42 + Math.max(0, lines.length - 1) * 16,
    }
  }

  if (node.type === 'kanji') {
    return {
      width: Math.min(280, Math.max(110, longestLineLength * 11 + 38)),
      height: 42 + Math.max(0, lines.length - 1) * 16,
    }
  }

  return { width: 0, height: 0 }
}

function getNodeRadius(node: OnyomiGraphNode) {
  if (node.type === 'rhyme') return 30
  if (node.type === 'onyomi') return 28
  return 24
}

function getLabelLineOffset(index: number, total: number) {
  const baseline = (total - 1) * 9
  return index * 18 - baseline
}

function getGroupKey(nodeId: string) {
  if (nodeId.startsWith('onyomi:')) {
    return nodeId.slice('onyomi:'.length)
  }

  if (nodeId.startsWith('kanji-group:')) {
    return nodeId.slice('kanji-group:'.length)
  }

  if (nodeId.startsWith('pinyin-group:')) {
    return nodeId.slice('pinyin-group:'.length)
  }

  return nodeId
}

function getLinkKey(link: OnyomiGraphLink) {
  const sourceId = typeof link.source === 'object' ? link.source.id : link.source
  const targetId = typeof link.target === 'object' ? link.target.id : link.target

  return getGroupKey(sourceId || targetId)
}

function isNodeInActiveLink(node: OnyomiGraphNode) {
  if (props.mode !== 'mode1' || !props.activeLinkKey) {
    return false
  }

  return getGroupKey(node.id) === props.activeLinkKey
}

function handleNodeClick(node: OnyomiGraphNode) {
  if (node.type === props.clickableType && node.selectKey) {
    emit('selectKey', node.selectKey)
  }

  if (props.mode === 'mode1' && node.type === 'kanji') {
    emit('selectKanjiGroup', getGroupKey(node.id))
  }
}

function createLayout() {
  const columnX =
    props.mode === 'mode1'
      ? {
          rhyme: width * 0.12,
          pinyin: width * 0.24,
          kanji: width * 0.52,
          onyomi: width * 0.8,
        }
      : {
          rhyme: width * 0.12,
          onyomi: width * 0.18,
          kanji: width * 0.5,
          pinyin: width * 0.82,
        }

  const sortedNodes = [...props.nodes].sort((a, b) => {
    const keyA = getGroupKey(a.id)
    const keyB = getGroupKey(b.id)
    return keyA.localeCompare(keyB)
  })

  const uniqueGroups = [...new Set(sortedNodes.map((node) => getGroupKey(node.id)))]
  const topPadding = 78
  const bottomPadding = 78
  const availableHeight = Math.max(120, height - topPadding - bottomPadding)
  const groupSpacing = uniqueGroups.length > 1 ? availableHeight / (uniqueGroups.length - 1) : 0
  const groupY = new Map<string, number>()

  uniqueGroups.forEach((group, index) => {
    groupY.set(group, topPadding + index * groupSpacing)
  })

  const nodes = sortedNodes.map((node) => {
    const y = groupY.get(getGroupKey(node.id)) ?? height / 2
    return {
      ...node,
      x: columnX[node.type],
      y,
    }
  })

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const links: OnyomiGraphLink[] = []
  for (const link of props.links) {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    const targetId = typeof link.target === 'object' ? link.target.id : link.target
    const sourceNode = nodeById.get(sourceId)
    const targetNode = nodeById.get(targetId)
    if (!sourceNode || !targetNode) {
      continue
    }

    links.push({
      source: sourceNode,
      target: targetNode,
    })
  }

  localNodes.value = nodes
  localLinks.value = links
}

watch(
  () => [props.nodes, props.links, props.mode],
  () => {
    createLayout()
  },
  { deep: true, immediate: true },
)

onBeforeUnmount(() => {
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
          :class="{
            'is-selected': props.mode === 'mode1' && getLinkKey(link) === props.activeLinkKey,
          }"
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
              'is-link-active': isNodeInActiveLink(node),
              'is-clickable': node.type === props.clickableType,
              'is-group-clickable': props.mode === 'mode1' && node.type === 'kanji',
            },
          ]"
          :transform="`translate(${node.x ?? 0}, ${node.y ?? 0})`"
          @click="handleNodeClick(node)"
        >
          <template v-if="node.type === 'pinyin' || node.type === 'kanji'">
            <rect
              :x="-(getNodeBlockSize(node).width / 2)"
              :y="-(getNodeBlockSize(node).height / 2)"
              :width="getNodeBlockSize(node).width"
              :height="getNodeBlockSize(node).height"
              rx="18"
              ry="18"
            />
          </template>
          <template v-else>
            <circle :r="getNodeRadius(node)" />
          </template>

          <text class="onyomi-graph__label" text-anchor="middle">
            <tspan
              v-for="(line, lineIndex) in getNodeLabelLines(node)"
              :key="`${node.id}-${lineIndex}`"
              x="0"
              :dy="lineIndex === 0 ? getLabelLineOffset(lineIndex, getNodeLabelLines(node).length) : 18"
            >
              {{ line }}
            </tspan>
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>
