<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import OnyomiGraph from '@/components/OnyomiGraph.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { ONYOMI_ALL_RHYMES, ONYOMI_EXAMPLES, ONYOMI_MODES, ONYOMI_RHYMES } from '@/config/onyomiMap'

const activeMode = ref<(typeof ONYOMI_MODES)[number]>('mode1')
const activeRhyme = ref<(typeof ONYOMI_RHYMES)[number]>('ang')
const activeOnyomi = ref('all')
const selectedKeys = ref<string[]>([])
const answers = reactive<Record<string, string>>({})
const showRhymePanel = ref(false)
const showOnyomiPanel = ref(false)
const practiceEnabled = ref(false)

const filteredExamples = computed(() => {
  if (activeMode.value === 'mode1') {
    if (activeRhyme.value === 'all') {
      return ONYOMI_EXAMPLES
    }

    return ONYOMI_EXAMPLES.filter((item) => item.rhyme === activeRhyme.value)
  }

  if (activeOnyomi.value === 'all') {
    return ONYOMI_EXAMPLES
  }

  return ONYOMI_EXAMPLES.filter((item) => item.onyomi === activeOnyomi.value)
})

const onyomiFilters = computed(() => {
  return ['all', ...new Set(ONYOMI_EXAMPLES.map((item) => item.onyomi))]
})

const availableRhymes = computed(() => new Set(ONYOMI_EXAMPLES.map((item) => item.rhyme)))

const currentRhymeLabel = computed(() => (activeRhyme.value === 'all' ? '全部韵母' : activeRhyme.value))
const currentOnyomiLabel = computed(() => (activeOnyomi.value === 'all' ? '全部音读' : activeOnyomi.value))

const groupedByOnyomi = computed(() => {
  const groups = new Map<
    string,
    {
      onyomi: string
      rhymes: Set<string>
      pinyins: Set<string>
      kanjis: Set<string>
      exampleCount: number
    }
  >()

  for (const item of filteredExamples.value) {
    const existing = groups.get(item.onyomi)

    if (existing) {
      existing.rhymes.add(item.rhyme)
      existing.pinyins.add(item.pinyin)
      existing.kanjis.add(item.kanji)
      existing.exampleCount += 1
      continue
    }

    groups.set(item.onyomi, {
      onyomi: item.onyomi,
      rhymes: new Set([item.rhyme]),
      pinyins: new Set([item.pinyin]),
      kanjis: new Set([item.kanji]),
      exampleCount: 1,
    })
  }

  return [...groups.values()]
})

const graphData = computed(() => {
  const nodesMap = new Map<string, { id: string; label: string; type: 'rhyme' | 'pinyin' | 'kanji' | 'onyomi'; selectKey?: string; itemCount?: number }>()
  const links: { source: string; target: string }[] = []
  const linkKeys = new Set<string>()

  function pushLink(source: string, target: string) {
    const key = `${source}->${target}`
    if (linkKeys.has(key)) {
      return
    }

    linkKeys.add(key)
    links.push({ source, target })
  }

  if (activeMode.value === 'mode1') {
    for (const group of groupedByOnyomi.value) {
      const onyomiId = `onyomi:${group.onyomi}`
      const pinyinId = `pinyin-group:${group.onyomi}`
      const kanjiId = `kanji-group:${group.onyomi}`

      nodesMap.set(pinyinId, {
        id: pinyinId,
        label: [...group.pinyins].sort().join(' / '),
        type: 'pinyin',
      })
      nodesMap.set(kanjiId, {
        id: kanjiId,
        label: [...group.kanjis].sort().join(' / '),
        type: 'kanji',
      })
      nodesMap.set(onyomiId, {
        id: onyomiId,
        label: group.onyomi,
        type: 'onyomi',
        selectKey: group.onyomi,
        itemCount: group.exampleCount,
      })

      pushLink(pinyinId, kanjiId)
      pushLink(kanjiId, onyomiId)
    }
  } else {
    for (const group of groupedByOnyomi.value) {
      const onyomiId = `onyomi:${group.onyomi}`
      const kanjiId = `kanji-group:${group.onyomi}`
      const pinyinId = `pinyin-group:${group.onyomi}`

      nodesMap.set(onyomiId, {
        id: onyomiId,
        label: group.onyomi,
        type: 'onyomi',
      })
      nodesMap.set(kanjiId, {
        id: kanjiId,
        label: [...group.kanjis].sort().join(' / '),
        type: 'kanji',
      })
      nodesMap.set(pinyinId, {
        id: pinyinId,
        label: [...group.pinyins].sort().join(' / '),
        type: 'pinyin',
        selectKey: group.onyomi,
        itemCount: group.pinyins.size,
      })

      pushLink(onyomiId, kanjiId)
      pushLink(kanjiId, pinyinId)
    }
  }

  return {
    nodes: [...nodesMap.values()],
    links,
  }
})

const selectedExamples = computed(() => {
  return filteredExamples.value.filter((item) => selectedKeys.value.includes(item.onyomi))
})

const practiceChoices = computed(() => {
  if (activeMode.value === 'mode1') {
    return [...new Set(selectedExamples.value.map((item) => item.onyomi))]
  }

  return [...new Set(selectedExamples.value.map((item) => item.pinyin))]
})

function toggleSelection(key: string) {
  if (selectedKeys.value.includes(key)) {
    selectedKeys.value = selectedKeys.value.filter((item) => item !== key)
    const matched = selectedExamples.value.filter((item) => item.onyomi === key)

    for (const example of matched) {
      delete answers[example.id]
    }
    return
  }

  selectedKeys.value = [...selectedKeys.value, key]
}

function chooseAnswer(exampleId: string, value: string) {
  answers[exampleId] = value
}

function clearPractice() {
  selectedKeys.value = []
  for (const key of Object.keys(answers)) {
    delete answers[key]
  }
}
</script>

<template>
  <div class="page-shell">
    <SiteHeader />

    <main class="home-main">
      <section class="hero-panel onyomi-panel">
        <section class="onyomi-hero">
          <div class="onyomi-hero__copy">
            <p class="about-section__eyebrow">Onyomi Relationship Map</p>
            <h2>音读关系图谱</h2>
            <p class="onyomi-hero__lead">
              在“拼音 → 音读”和“音读 → 拼音”之间切换，观察汉语拼音与日语音读的对应规律
            </p>
          </div>
        </section>

        <div class="onyomi-mode-switch" role="tablist" aria-label="学习模式切换">
          <button v-for="mode in ONYOMI_MODES" :key="mode" class="onyomi-mode-switch__option"
            :class="{ 'is-active': activeMode === mode }" type="button" @click="
              activeMode = mode;
            activeRhyme = 'ang';
            activeOnyomi = 'all';
            showRhymePanel = false;
            showOnyomiPanel = false;
            clearPractice();
            ">
            <span class="onyomi-mode-switch__title">
              {{ mode === 'mode1' ? '模式一' : '模式二' }}
            </span>
            <span class="onyomi-mode-switch__subtitle">
              {{ mode === 'mode1' ? '拼音 → 音读' : '音读 → 拼音' }}
            </span>
          </button>
        </div>

        <div class="onyomi-toolbar">

          <div v-if="activeMode === 'mode1'" class="onyomi-toolbar__group">
            <div class="onyomi-selector">
              <div class="onyomi-selector__summary">
                <span class="onyomi-selector__label">当前韵母</span>
                <strong class="onyomi-selector__value">{{ currentRhymeLabel }}</strong>
              </div>

              <button class="onyomi-filter onyomi-filter--expand" type="button" :aria-expanded="showRhymePanel"
                @click="showRhymePanel = !showRhymePanel">
                {{ showRhymePanel ? '收起面板' : '展开韵母面板' }}
              </button>
            </div>
          </div>

          <div v-else class="onyomi-toolbar__group">
            <div class="onyomi-selector">
              <div class="onyomi-selector__summary">
                <span class="onyomi-selector__label">当前音读</span>
                <strong class="onyomi-selector__value">{{ currentOnyomiLabel }}</strong>
              </div>

              <button class="onyomi-filter onyomi-filter--expand" type="button" :aria-expanded="showOnyomiPanel"
                @click="showOnyomiPanel = !showOnyomiPanel">
                {{ showOnyomiPanel ? '收起面板' : '展开音读面板' }}
              </button>
            </div>
          </div>

        </div>

        <div v-if="activeMode === 'mode1' && showRhymePanel" class="onyomi-rhyme-panel">
          <button class="onyomi-filter onyomi-filter--panel" :class="{ 'is-active': activeRhyme === 'all' }"
            type="button" @click="activeRhyme = 'all'; showRhymePanel = false; clearPractice()">
            全部
          </button>
          <button v-for="rhyme in ONYOMI_ALL_RHYMES" :key="rhyme" class="onyomi-filter onyomi-filter--panel" :class="{
            'is-active': activeRhyme === rhyme,
            'is-disabled': !availableRhymes.has(rhyme),
          }" type="button" :disabled="!availableRhymes.has(rhyme)"
            @click="activeRhyme = rhyme as typeof activeRhyme; showRhymePanel = false; clearPractice()">
            {{ rhyme }}
          </button>
        </div>

        <div v-if="activeMode === 'mode2' && showOnyomiPanel" class="onyomi-rhyme-panel">
          <button class="onyomi-filter onyomi-filter--panel" :class="{ 'is-active': activeOnyomi === 'all' }"
            type="button" @click="activeOnyomi = 'all'; showOnyomiPanel = false; clearPractice()">
            全部
          </button>
          <button v-for="onyomi in onyomiFilters.filter((item) => item !== 'all')" :key="onyomi"
            class="onyomi-filter onyomi-filter--panel" :class="{ 'is-active': activeOnyomi === onyomi }" type="button"
            @click="activeOnyomi = onyomi; showOnyomiPanel = false; clearPractice()">
            {{ onyomi }}
          </button>
        </div>

        <div class="onyomi-top-actions">
          <label class="onyomi-practice-switch">
            <span class="onyomi-practice-switch__label">开启练习</span>
            <button
              class="graph-switch__track"
              :class="{ 'is-on': practiceEnabled }"
              type="button"
              :aria-pressed="practiceEnabled"
              @click="practiceEnabled = !practiceEnabled"
            >
              <span class="graph-switch__thumb" />
            </button>
          </label>
        </div>

        <div class="onyomi-workspace" :class="{ 'is-practice-off': !practiceEnabled }">
          <section class="onyomi-stage">
            <OnyomiGraph :nodes="graphData.nodes" :links="graphData.links" :selected-keys="selectedKeys"
              :clickable-type="activeMode === 'mode1' ? 'onyomi' : 'pinyin'" :mode="activeMode"
              @select-key="toggleSelection" />
          </section>

          <aside v-if="practiceEnabled" class="onyomi-practice">
            <div class="onyomi-practice__header">
              <div>
                <p class="onyomi-practice__eyebrow">
                  {{ activeMode === 'mode1' ? '模式一 · 拼音 → 音读' : '模式二 · 音读 → 拼音' }}
                </p>
                <h3>练习区</h3>
              </div>

              <div class="onyomi-practice__pool">
                <span v-for="key in selectedKeys" :key="key" class="onyomi-practice__reading">
                  {{ key }}
                </span>
              </div>
            </div>

            <div class="onyomi-practice__actions">
              <button class="onyomi-clear" type="button" @click="clearPractice">
                清空练习区
              </button>
            </div>

            <div v-if="!selectedExamples.length" class="onyomi-practice__empty">
              {{ activeMode === 'mode1'
                ? '点击左侧黄色“音读”节点，把对应规律加入练习区。'
                : '点击左侧蓝色“拼音组”节点，把对应规律加入练习区。' }}
            </div>

            <div v-else class="onyomi-practice__list">
              <article v-for="example in selectedExamples" :key="example.id" class="onyomi-practice__card">
                <div class="onyomi-practice__prompt">
                  <p class="onyomi-practice__meta">
                    {{ activeMode === 'mode1' ? `${example.rhyme} · ${example.pinyin}` : `${example.onyomi} ·
                    ${example.rhyme}` }}
                  </p>
                  <h4>{{ example.kanji }}</h4>
                  <p class="onyomi-practice__words">{{ example.japaneseWords.join(' / ') }}</p>
                </div>

                <div class="onyomi-practice__choices">
                  <button v-for="choice in practiceChoices" :key="`${example.id}-${choice}`" class="onyomi-choice" :class="{
                    'is-correct': answers[example.id] === choice && choice === (activeMode === 'mode1' ? example.onyomi : example.pinyin),
                    'is-wrong': answers[example.id] === choice && choice !== (activeMode === 'mode1' ? example.onyomi : example.pinyin),
                  }" type="button" @click="chooseAnswer(example.id, choice)">
                    {{ choice }}
                  </button>
                </div>
              </article>
            </div>
          </aside>
        </div>
      </section>
    </main>
  </div>
</template>
