<script setup lang="ts">
import { storeToRefs } from 'pinia'

import BottomToolbar from '@/components/BottomToolbar.vue'
import SearchBar from '@/components/SearchBar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import WordGraph from '@/components/WordGraph.vue'
import { useGraphStore } from '@/stores/graph'

const graphStore = useGraphStore()
const { candidateResults, graph, hasNoResults, historyWords, keyword, searchState } =
  storeToRefs(graphStore)
</script>

<template>
  <div class="page-shell">
    <SiteHeader />

    <main class="home-main">
      <section class="hero-panel">
        <p class="hero-kicker">搜索汉字词，开始一场词汇漫游</p>

        <SearchBar
          :model-value="keyword"
          @update:model-value="graphStore.setKeyword"
          @submit="graphStore.submitSearch"
        />

        <div v-if="keyword && candidateResults.length" class="search-results">
          <button
            v-for="item in candidateResults"
            :key="item.id"
            class="search-result-pill"
            type="button"
            @click="graphStore.selectSearchResult(item.id)"
          >
            <span>{{ item.kanji }}</span>
            <small>{{ item.kana }}</small>
          </button>
        </div>

        <p v-if="keyword && searchState.results.length === 1" class="search-feedback">
          唯一匹配词条，按回车或点“搜索”即可直接进入词汇网络。
        </p>

        <p v-if="hasNoResults" class="search-feedback is-empty">未找到相关词条</p>

        <WordGraph :nodes="graph.nodes" :links="graph.links" @select="graphStore.wanderTo" />

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
