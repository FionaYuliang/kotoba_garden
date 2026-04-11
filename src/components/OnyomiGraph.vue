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
  isSpecial?: boolean
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
const baseHeight = 680
const maxCanvasHeight = 920
const minScale = 0.55
const maxScale = 3.2
const localNodes = ref<OnyomiGraphNode[]>([])
const localLinks = ref<OnyomiGraphLink[]>([])
const svgRef = ref<SVGSVGElement | null>(null)
const viewportTransformState = ref<ZoomTransform>(zoomIdentity)
const canvasHeight = ref(baseHeight)
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

function getNodeVisualHeight(node: OnyomiGraphNode) {
  if (node.type === 'pinyin' || node.type === 'kanji') {
    return getNodeBlockSize(node).height
  }

  return getNodeRadius(node) * 2
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

function getBaseOnyomiKey(nodeId: string) {
  if (nodeId.startsWith('onyomi:')) {
    return nodeId.slice('onyomi:'.length)
  }

  if (nodeId.startsWith('kanji-group:')) {
    return nodeId.slice('kanji-group:'.length).split(':')[0]
  }

  if (nodeId.startsWith('pinyin-group:')) {
    return nodeId.slice('pinyin-group:'.length).split(':')[0]
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
          onyomi: width * 0.16,
          pinyin: width * 0.48,
          kanji: width * 0.8,
        }

  const sortedNodes = [...props.nodes].sort((a, b) => {
    const keyA = getGroupKey(a.id)
    const keyB = getGroupKey(b.id)
    return keyA.localeCompare(keyB)
  })

  const uniqueGroups = [...new Set(sortedNodes.map((node) => getGroupKey(node.id)))]
  const topPadding = 78
  const bottomPadding = 78
  const groupY = new Map<string, number>()
  const groupHeights = uniqueGroups.map((group) => {
    const groupNodes = sortedNodes.filter((node) => getGroupKey(node.id) === group)
    const tallestNode = Math.max(...groupNodes.map((node) => getNodeVisualHeight(node)), 56)
    return tallestNode + 26
  })

  const totalContentHeight = groupHeights.reduce((sum, value) => sum + value, 0)
  canvasHeight.value = Math.min(maxCanvasHeight, Math.max(baseHeight, topPadding + bottomPadding + totalContentHeight))

  let cursorY = topPadding
  uniqueGroups.forEach((group, index) => {
    const groupHeight = groupHeights[index]
    groupY.set(group, cursorY + groupHeight / 2)
    cursorY += groupHeight
  })

  const nodes = sortedNodes.map((node) => {
    let y = groupY.get(getGroupKey(node.id)) ?? canvasHeight.value / 2

    if (node.type === 'onyomi') {
      const relatedYs = sortedNodes
        .filter((item) => item.type !== 'onyomi' && getBaseOnyomiKey(item.id) === node.id.slice('onyomi:'.length))
        .map((item) => groupY.get(getGroupKey(item.id)))
        .filter((value): value is number => typeof value === 'number')

      if (relatedYs.length > 0) {
        y = relatedYs.reduce((sum, value) => sum + value, 0) / relatedYs.length
      }
    }

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

async function downloadAsImage(filename = 'onyomi-graph.png') {
  if (!svgRef.value) {
    return
  }

  const sourceSvg = svgRef.value
  const clonedSvg = sourceSvg.cloneNode(true) as SVGSVGElement
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clonedSvg.setAttribute('width', String(width))
  clonedSvg.setAttribute('height', String(canvasHeight.value))

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `
    .onyomi-graph__link {
      stroke: rgba(181, 164, 149, 0.52);
      stroke-width: 1.4;
    }
    .onyomi-graph__link.is-selected {
      stroke: rgba(95, 79, 67, 0.78);
      stroke-width: 2.6;
    }
    .onyomi-graph__node circle,
    .onyomi-graph__node rect {
      stroke: rgba(117, 98, 83, 0.12);
      stroke-width: 1.2;
    }
    .onyomi-graph__node.is-rhyme circle {
      fill: rgba(241, 203, 154, 0.88);
    }
    .onyomi-graph__node.is-pinyin circle,
    .onyomi-graph__node.is-pinyin rect {
      fill: rgba(178, 204, 234, 0.88);
    }
    .onyomi-graph__node.is-pinyin.is-special circle,
    .onyomi-graph__node.is-pinyin.is-special rect {
      fill: rgba(231, 171, 160, 0.92);
    }
    .onyomi-graph__node.is-kanji circle,
    .onyomi-graph__node.is-kanji rect {
      fill: rgba(197, 220, 183, 0.9);
    }
    .onyomi-graph__node.is-kanji.is-special circle,
    .onyomi-graph__node.is-kanji.is-special rect {
      fill: rgba(239, 182, 160, 0.94);
    }
    .onyomi-graph__node.is-onyomi circle {
      fill: rgba(244, 229, 144, 0.92);
    }
    .onyomi-graph__node.is-onyomi.is-special circle {
      fill: rgba(247, 196, 146, 0.95);
    }
    .onyomi-graph__node.is-selected circle,
    .onyomi-graph__node.is-selected rect {
      stroke: rgba(95, 79, 67, 0.5);
      stroke-width: 2;
    }
    .onyomi-graph__node.is-link-active circle,
    .onyomi-graph__node.is-link-active rect {
      stroke: rgba(95, 79, 67, 0.62);
      stroke-width: 2.4;
    }
    .onyomi-graph__label {
      fill: #4f4036;
      font-size: 16px;
      font-weight: 600;
      text-anchor: middle;
      dominant-baseline: middle;
      font-family: "Hiragino Sans GB", "PingFang SC", "Noto Sans CJK SC", sans-serif;
    }
  `

  clonedSvg.insertBefore(style, clonedSvg.firstChild)

  const serialized = new XMLSerializer().serializeToString(clonedSvg)
  const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('failed to load graph image'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = canvasHeight.value * 2

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    context.scale(2, 2)
    context.fillStyle = '#fffaf5'
    context.fillRect(0, 0, width, canvasHeight.value)
    context.drawImage(image, 0, 0, width, canvasHeight.value)

    const downloadUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    link.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}

onMounted(() => {
  setupZoom()
})

defineExpose({
  downloadAsImage,
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
      :viewBox="`0 0 ${width} ${canvasHeight}`"
      :style="{ height: `${canvasHeight}px` }"
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
              'is-special': node.isSpecial,
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
