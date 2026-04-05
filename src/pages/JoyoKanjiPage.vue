<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import SiteHeader from '@/components/SiteHeader.vue'
import type { JoyoKanjiEntry } from '@/config/joyoKanjiShowcase'

const showIndex = ref(true)
const keyword = ref('')
const entries = ref<JoyoKanjiEntry[]>([])
const isLoading = ref(true)
const currentPage = ref(1)
const pageSize = 20
const activeIndexGroup = ref('あ行')
const focusedEntryId = ref<number | null>(null)

const GOJUON_ROWS = [
  { label: 'あ行', chars: ['あ', 'い', 'う', 'え', 'お'] },
  { label: 'か行', chars: ['か', 'き', 'く', 'け', 'こ'] },
  { label: 'さ行', chars: ['さ', 'し', 'す', 'せ', 'そ'] },
  { label: 'た行', chars: ['た', 'ち', 'つ', 'て', 'と'] },
  { label: 'な行', chars: ['な', 'に', 'ぬ', 'ね', 'の'] },
  { label: 'は行', chars: ['は', 'ひ', 'ふ', 'へ', 'ほ'] },
  { label: 'ま行', chars: ['ま', 'み', 'む', 'め', 'も'] },
  { label: 'や行', chars: ['や', 'ゆ', 'よ'] },
  { label: 'ら行', chars: ['ら', 'り', 'る', 'れ', 'ろ'] },
  { label: 'わ行', chars: ['わ', 'を', 'ん'] },
] as const

onMounted(async () => {
  const module = await import('@/config/joyoKanjiShowcase')
  entries.value = module.JOYO_KANJI_SHOWCASE as JoyoKanjiEntry[]
  isLoading.value = false
})

async function jumpToEntry(entryId: number) {
  const targetIndex = entries.value.findIndex((entry) => entry.id === entryId)

  if (targetIndex < 0) {
    return
  }

  keyword.value = ''
  currentPage.value = Math.floor(targetIndex / pageSize) + 1
  showIndex.value = false
  focusedEntryId.value = entryId

  await nextTick()
  await nextTick()

  const target = document.getElementById(`joyo-kanji-${entryId}`)
  if (target) {
    const headerOffset = 112
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({
      top,
      behavior: 'smooth',
    })
  }

  window.setTimeout(() => {
    if (focusedEntryId.value === entryId) {
      focusedEntryId.value = null
    }
  }, 2200)
}

function toHiragana(value: string) {
  return value.replace(/[\u30a1-\u30f6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  )
}

function getGojuonRow(reading: string) {
  const first = toHiragana(reading).trim().charAt(0)
  return GOJUON_ROWS.find((row) => (row.chars as readonly string[]).includes(first))?.label ?? '其他'
}

const kanjiIndexGroups = computed(() => {
  if (!showIndex.value) {
    return []
  }

  return GOJUON_ROWS
    .map((row) => ({
      label: row.label,
      items: entries.value.filter((entry) =>
        getGojuonRow(entry.official_readings[0] ?? '') === row.label,
      ),
    }))
    .filter((group) => group.items.length > 0)
})

const activeIndexItems = computed(() => {
  return kanjiIndexGroups.value.find((group) => group.label === activeIndexGroup.value)?.items ?? []
})

const filteredEntries = computed(() => {
  const query = keyword.value.trim()

  if (!query) {
    return entries.value
  }

  return entries.value.filter((entry) => {
    const pool = [
      entry.kanji,
      entry.variant ?? '',
      ...entry.official_readings,
      ...entry.official_examples,
      ...entry.redbook_readings.flatMap((group) => [group.reading, ...group.examples]),
    ]

    return pool.some((item) => item.includes(query))
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredEntries.value.length / pageSize))
})

const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredEntries.value.slice(start, start + pageSize)
})

const visiblePageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const start = Math.max(1, current - 2)
  const end = Math.min(total, start + 4)
  const adjustedStart = Math.max(1, end - 4)

  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index)
})

watch(keyword, () => {
  currentPage.value = 1
})

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})
</script>

<template>
  <div class="page-shell">
    <SiteHeader />

    <main class="home-main">
      <section class="hero-panel joyo-panel">
        <div class="joyo-intro">
          <p class="joyo-intro__eyebrow">2136 Joyo Kanji</p>
          <h2>2136当用汉字</h2>
          <p class="joyo-intro__lead">按汉字、音训或例词检索，浏览文化厅常用汉字表与红宝书词例。</p>
        </div>

        <div class="joyo-search">
          <input
            v-model="keyword"
            class="joyo-search__input"
            type="search"
            placeholder="搜索汉字 / 音训 / 例词"
          >
        </div>

        <button class="joyo-index-affix" type="button" :aria-pressed="showIndex" @click="showIndex = !showIndex">
          <span>索引</span>
          <small>{{ showIndex ? '收起' : '展开' }}</small>
        </button>

        <Transition name="joyo-index-pop">
          <section v-if="showIndex" class="joyo-index-popover">
            <div class="joyo-index-panel">
              <p class="joyo-index-panel__label">索引</p>
              <div class="joyo-index-tabs">
                <button
                  v-for="group in kanjiIndexGroups"
                  :key="group.label"
                  class="joyo-index-tabs__item"
                  :class="{ 'is-active': group.label === activeIndexGroup }"
                  type="button"
                  @click="activeIndexGroup = group.label"
                >
                  <span>{{ group.label }}</span>
                  <small>{{ group.items.length }}</small>
                </button>
              </div>

              <section class="joyo-index-group">
                <h3 class="joyo-index-group__title">{{ activeIndexGroup }}</h3>
                <div class="joyo-index-panel__grid">
                  <button
                    v-for="entry in activeIndexItems"
                    :key="entry.id"
                    class="joyo-index-panel__item"
                    type="button"
                    @click="jumpToEntry(entry.id)"
                  >
                    <small>{{ entry.id }}</small>
                    <strong>{{ entry.kanji }}</strong>
                  </button>
                </div>
              </section>
            </div>
          </section>
        </Transition>

        <div v-if="isLoading" class="joyo-empty">正在载入当用汉字数据…</div>

        <div v-else-if="!filteredEntries.length" class="joyo-empty">没有找到匹配的汉字或词例。</div>

        <div v-else class="joyo-grid">
          <article
            v-for="entry in paginatedEntries"
            :id="`joyo-kanji-${entry.id}`"
            :key="entry.id"
            class="joyo-card"
            :class="{ 'is-focused': focusedEntryId === entry.id }"
          >
            <header class="joyo-card__header">
              <div>
                <p class="joyo-card__index">{{ entry.id }}</p>
                <h3>
                  {{ entry.kanji }}
                  <small v-if="entry.variant">（{{ entry.variant }}）</small>
                </h3>
              </div>
              <div class="joyo-card__readings">
                <!-- <span v-for="reading in entry.official_readings" :key="reading" class="joyo-pill">
                  {{ reading }}
                </span> -->
              </div>
            </header>

            <div class="joyo-card__body">
              <section class="joyo-card__section">
                <p class="joyo-card__label">汉字表 · 例</p>
                <div class="joyo-chip-list">
                  <span v-for="example in entry.official_examples" :key="example" class="joyo-chip">
                    {{ example }}
                  </span>
                </div>
              </section>

              <section class="joyo-card__section">
                <p class="joyo-card__label">音训/例词</p>
                <div class="joyo-reading-list">
                  <article v-for="group in entry.redbook_readings" :key="`${entry.kanji}-${group.reading}`"
                    class="joyo-reading-row">
                    <p class="joyo-reading-row__reading">{{ group.reading }}</p>
                    <div class="joyo-reading-row__examples">
                      <span v-for="example in group.examples" :key="`${group.reading}-${example}`"
                        class="joyo-reading-row__example">
                        {{ example }}
                      </span>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </article>

          <nav class="joyo-pagination" aria-label="分页">
            <button
              class="joyo-pagination__button joyo-pagination__button--wide"
              type="button"
              :disabled="currentPage === 1"
              @click="currentPage = 1"
            >
              首页
            </button>

            <button
              class="joyo-pagination__button"
              type="button"
              :disabled="currentPage === 1"
              @click="currentPage -= 1"
            >
              上一页
            </button>

            <button
              v-for="page in visiblePageNumbers"
              :key="page"
              class="joyo-pagination__button"
              :class="{ 'is-active': page === currentPage }"
              type="button"
              @click="currentPage = page"
            >
              {{ page }}
            </button>

            <button
              class="joyo-pagination__button"
              type="button"
              :disabled="currentPage === totalPages"
              @click="currentPage += 1"
            >
              下一页
            </button>

            <span class="joyo-pagination__meta">
              第 {{ currentPage }} / {{ totalPages }} 页
            </span>
          </nav>
        </div>
      </section>
    </main>
  </div>
</template>
