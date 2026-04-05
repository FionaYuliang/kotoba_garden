<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'

import BottomToolbar from '@/components/BottomToolbar.vue'
import SearchBar from '@/components/SearchBar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import WordGraph from '@/components/WordGraph.vue'
import { WORD_CARD_DETAILS } from '@/config/wordCardDetails'
import { getWordById } from '@/services/wordService'
import { useGraphStore } from '@/stores/graph'

const graphStore = useGraphStore()
const { candidateResults, centerWord, graph, hasNoResults, historyWords, keyword, searchState } =
  storeToRefs(graphStore)

const hoveredWordId = ref<number | null>(null)
const showKanji = ref(true)

const previewWord = computed(() => {
  return getWordById(hoveredWordId.value ?? centerWord.value.id) ?? centerWord.value
})

const previewDetail = computed(() => {
  const detail = WORD_CARD_DETAILS[previewWord.value.kanji]

  return {
    pronunciation: `${previewWord.value.kana} / ${previewWord.value.romaji}`,
    meaning: detail?.meaning ?? '释义整理中',
    examples:
      detail?.examples?.length
        ? detail.examples
        : ['例句整理中', '例句整理中', '例句整理中'],
  }
})
</script>

<template>
  <div class="page-shell">
    <SiteHeader />

    <main class="home-main">
      <section class="hero-panel">
        <p class="hero-kicker">搜索汉字词，开始一场词汇漫游</p>

        <SearchBar :model-value="keyword" @update:model-value="graphStore.setKeyword"
          @submit="graphStore.submitSearch" />

        <div v-if="keyword && candidateResults.length" class="search-results">
          <button v-for="item in candidateResults" :key="item.id" class="search-result-pill" type="button"
            @click="graphStore.selectSearchResult(item.id)">
            <span>{{ item.kanji }}</span>
            <small>{{ item.kana }}</small>
          </button>
        </div>

        <p v-if="keyword && searchState.results.length === 1" class="search-feedback">
          唯一匹配词条，按回车或点“搜索”即可直接进入词汇网络。
        </p>

        <p v-if="hasNoResults" class="search-feedback is-empty">未找到相关词条</p>

        <div class="journey-layout">
          <div class="graph-stage">
            <label class="graph-switch">
              <span class="graph-switch__label">显示汉字</span>
              <button
                class="graph-switch__track"
                :class="{ 'is-on': showKanji }"
                type="button"
                :aria-pressed="showKanji"
                @click="showKanji = !showKanji"
              >
                <span class="graph-switch__thumb" />
              </button>
            </label>

            <WordGraph
              :nodes="graph.nodes"
              :links="graph.links"
              :show-kanji="showKanji"
              @select="graphStore.wanderTo"
              @hover="hoveredWordId = $event"
            />
          </div>

          <aside class="word-detail-card">
            <div class="word-detail-card__hero">
              <h3>{{ previewWord.kanji }}</h3>
              <span class="word-detail-card__level-pill">
                N{{ previewWord.jlpt_levels.join(' / N') }}
              </span>
            </div>
            <div class="word-detail-card__summary">
              <p class="word-detail-card__reading">
                <span>{{ previewWord.kana }}</span>
                <span>{{ previewWord.romaji }}</span>
              </p>
              <p class="word-detail-card__meaning">{{ previewDetail.meaning }}</p>
            </div>

            <div class="word-detail-related">
              <p class="word-detail-related__title">例句</p>
              <ol class="word-detail-examples">
                <li v-for="(example, index) in previewDetail.examples.slice(0, 5)" :key="`${previewWord.id}-${index}`"
                  class="word-detail-examples__item">
                  <span class="word-detail-examples__index">{{ index + 1 }}.</span>
                  <span class="word-detail-examples__text">{{ example }}</span>
                </li>
              </ol>
            </div>
          </aside>
        </div>

        <div class="path-preview">
          <span class="path-preview__label">探索路径</span>
          <span v-for="item in historyWords" :key="item.id" class="path-preview__item">
            {{ item.kanji }}
          </span>
        </div>

        <BottomToolbar @clear="graphStore.clearPath" @reset="graphStore.resetJourney" />
      </section>
    </main>
  </div>
</template>
