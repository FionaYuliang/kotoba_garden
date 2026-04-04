import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import {
  buildGraph,
  getInitialCenterWord,
  getWordById,
  getWordNeighbors,
  getWordNetwork,
  searchWords,
} from '@/services/wordService'

const STORAGE_KEY = 'kanji-wonderland-journey'

interface PersistedJourney {
  centerWordId: number
  history: number[]
}

function loadPersistedJourney(): PersistedJourney | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedJourney) : null
  } catch {
    return null
  }
}

export const useGraphStore = defineStore('graph', () => {
  const initial = loadPersistedJourney()
  const fallbackId = getInitialCenterWord().id
  const centerWordId = ref(initial?.centerWordId ?? fallbackId)
  const keyword = ref('')
  const history = ref<number[]>(
    initial?.history?.length ? initial.history : [centerWordId.value],
  )

  const graph = computed(() => buildGraph(centerWordId.value))
  const centerWord = computed(() => getWordById(centerWordId.value) ?? getInitialCenterWord())
  const network = computed(() => getWordNetwork(centerWordId.value))
  const searchState = computed(() => searchWords(keyword.value))
  const hasSearchQuery = computed(() => keyword.value.trim().length > 0)
  const hasNoResults = computed(() => hasSearchQuery.value && searchState.value.results.length === 0)
  const hasSingleResult = computed(() => searchState.value.results.length === 1)
  const candidateResults = computed(() =>
    hasSingleResult.value ? [] : searchState.value.results.slice(0, 8),
  )
  const canWander = computed(() => getWordNeighbors(centerWordId.value).length > 0)

  function persistJourney() {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        centerWordId: centerWordId.value,
        history: history.value,
      }),
    )
  }

  function setKeyword(value: string) {
    keyword.value = value
  }

  function wanderTo(wordId: number) {
    if (wordId === centerWordId.value) {
      return
    }

    centerWordId.value = wordId
    history.value = [...history.value, wordId]
  }

  function selectSearchResult(wordId: number) {
    keyword.value = ''
    wanderTo(wordId)
  }

  function submitSearch() {
    if (!hasSearchQuery.value) {
      return
    }

    if (searchState.value.results.length === 1) {
      selectSearchResult(searchState.value.results[0].id)
    }
  }

  function resetJourney() {
    centerWordId.value = fallbackId
    keyword.value = ''
    history.value = [fallbackId]
  }

  function clearPath() {
    history.value = [centerWordId.value]
  }

  watch([centerWordId, history], persistJourney, { deep: true })

  return {
    canWander,
    candidateResults,
    centerWord,
    graph,
    hasNoResults,
    hasSearchQuery,
    history,
    keyword,
    network,
    searchState,
    setKeyword,
    wanderTo,
    clearPath,
    resetJourney,
    selectSearchResult,
    submitSearch,
  }
})
