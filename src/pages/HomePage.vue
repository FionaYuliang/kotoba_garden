<script setup lang="ts">
import { storeToRefs } from 'pinia'

import BottomToolbar from '@/components/BottomToolbar.vue'
import PathBreadcrumb from '@/components/PathBreadcrumb.vue'
import SearchBar from '@/components/SearchBar.vue'
import StaticWordMap from '@/components/StaticWordMap.vue'
import { useGraphStore } from '@/stores/graph'

const graphStore = useGraphStore()
const { centerWord, candidateResults, hasNoResults, history, keyword, network, searchState } =
  storeToRefs(graphStore)

const staticNodes = [
  { kanji: '功名', kana: 'こうみょう', className: 'is-top' },
  { kanji: '達成', kana: 'たっせい', className: 'is-right-top' },
  { kanji: '勝利', kana: 'しょうり', className: 'is-right-bottom' },
  { kanji: '功績', kana: 'こうせき', className: 'is-left-bottom' },
  { kanji: '成長', kana: 'せいちょう', className: 'is-left-top' },
]
</script>

<template>
  <div class="page-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <div>
          <p class="brand-eyebrow">Kanji Wonderland</p>
          <h1 class="brand-title">日语汉字词漫游</h1>
        </div>
      </div>
    </header>

    <main class="home-main">
      <section class="hero-panel">
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
        <p class="preview-note">首页静态预览版，下一步再把中间词汇谱图替换成动态漫游图。</p>

        <StaticWordMap
          :center="{ kanji: centerWord.kanji, kana: centerWord.kana }"
          :nodes="staticNodes"
        />

        <div class="hero-links">
          <button class="ghost-link" type="button">探索路径</button>
          <button class="ghost-link" type="button">漫游历史</button>
        </div>

        <PathBreadcrumb :ids="history" />

        <BottomToolbar @clear="graphStore.clearPath" @reset="graphStore.resetJourney" />
      </section>
    </main>

    <footer class="footer">
      <span>2026</span>
      <span>作者：Stitch</span>
      <span>专注于日语汉字词的沉浸式探索</span>
    </footer>
  </div>
</template>
