import { DEFAULT_CENTER_WORD_POOL } from '@/config/centerWordPool'
import { wordBank } from '@/data/wordBank'
import type {
  DenseCenterWordCandidate,
  GraphLink,
  GraphNode,
  NetworkNeighbor,
  QueryType,
  SearchResponse,
  WordEntry,
  WordNetworkGroup,
  WordNetworkResponse,
} from '@/types/word'

const DEFAULT_CENTER_ID = DEFAULT_CENTER_WORD_POOL[0] ?? 1

function includesKanji(input: string) {
  return /[\u3400-\u4dbf\u4e00-\u9fff]/.test(input)
}

function includesKana(input: string) {
  return /[\u3040-\u309f]/.test(input)
}

function detectQueryType(query: string): QueryType {
  if (includesKanji(query) && !includesKana(query)) {
    return 'kanji'
  }

  if (includesKana(query) && !includesKanji(query)) {
    return 'kana'
  }

  if (/^[a-zA-Z\s-]+$/.test(query)) {
    return 'romaji'
  }

  return 'mixed'
}

function sharedKanji(a: WordEntry, b: WordEntry) {
  return a.kanji_chars.filter((char) => b.kanji_chars.includes(char))
}

function groupNeighborsByCenterKanji(center: WordEntry, neighbors: NetworkNeighbor[]): WordNetworkGroup[] {
  return center.kanji_chars
    .map((kanjiChar) => ({
      kanji_char: kanjiChar,
      neighbors: neighbors.filter((neighbor) => neighbor.shared_kanji.includes(kanjiChar)),
    }))
    .filter((group) => group.neighbors.length > 0)
}

export function getWordById(id: number): WordEntry | undefined {
  return wordBank.find((entry) => entry.id === id)
}

export function getInitialCenterWord(): WordEntry {
  return getWordById(DEFAULT_CENTER_ID) ?? wordBank[0]
}

export function getDefaultCenterWordPool(): WordEntry[] {
  return DEFAULT_CENTER_WORD_POOL
    .map((id) => getWordById(id))
    .filter((entry): entry is WordEntry => Boolean(entry))
}

export function searchWords(query: string): SearchResponse {
  const trimmed = query.trim()
  const queryType = detectQueryType(trimmed)
  const normalized = trimmed.toLowerCase()

  if (!trimmed) {
    return {
      query: trimmed,
      query_type: queryType,
      results: [],
    }
  }

  const results = wordBank.filter((entry) => {
    return (
      entry.kanji.includes(trimmed) ||
      entry.kana_normalized.includes(trimmed) ||
      entry.romaji_normalized.includes(normalized)
    )
  })

  return {
    query: trimmed,
    query_type: queryType,
    results,
  }
}

export function getWordNetwork(centerId: number, limit = 8): WordNetworkResponse {
  const center = getWordById(centerId) ?? getInitialCenterWord()

  const neighbors = wordBank
    .filter((entry) => entry.id !== center.id)
    .map((entry) => ({
      ...entry,
      shared_kanji: sharedKanji(center, entry),
    }))
    .filter((entry) => entry.shared_kanji.length > 0)
    .sort((a, b) => {
      return (
        b.shared_kanji.length - a.shared_kanji.length ||
        a.kanji.localeCompare(b.kanji, 'ja')
      )
    })
    .slice(0, limit)

  return { center, neighbors }
}

export function getWordNetworkGroups(centerId: number, limitPerGroup = 8): WordNetworkGroup[] {
  const network = getWordNetwork(centerId, wordBank.length)

  return groupNeighborsByCenterKanji(network.center, network.neighbors).map((group) => ({
    ...group,
    neighbors: group.neighbors.slice(0, limitPerGroup),
  }))
}

export function getDenseCenterWordCandidates(limit = 24): DenseCenterWordCandidate[] {
  return wordBank
    .map((word) => {
      const network = getWordNetwork(word.id, wordBank.length)
      const groups = groupNeighborsByCenterKanji(network.center, network.neighbors)
      const neighborCount = network.neighbors.length
      const groupCount = groups.length
      const balancedGroupBonus =
        groupCount > 1 ? Math.min(...groups.map((group) => group.neighbors.length)) : 0
      const score = neighborCount * 10 + groupCount * 6 + balancedGroupBonus * 4

      return {
        word,
        score,
        neighbor_count: neighborCount,
        group_count: groupCount,
        groups,
      }
    })
    .filter((candidate) => candidate.neighbor_count > 0 && candidate.group_count > 0)
    .sort((a, b) => {
      return (
        b.score - a.score ||
        b.neighbor_count - a.neighbor_count ||
        b.group_count - a.group_count ||
        a.word.id - b.word.id
      )
    })
    .slice(0, limit)
}

export function getRandomDenseCenterWord(poolSize = 12): WordEntry {
  const pool = getDefaultCenterWordPool().slice(0, poolSize)

  if (pool.length === 0) {
    return getInitialCenterWord()
  }

  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}

export function buildGraph(centerId: number, limit = 8): { nodes: GraphNode[]; links: GraphLink[] } {
  const groups = getWordNetworkGroups(centerId, Math.max(4, Math.ceil(limit / 2)))
  const center = getWordById(centerId) ?? getInitialCenterWord()
  const groupedNeighbors = groups.flatMap((group) =>
    group.neighbors.map((entry) => ({
      ...entry,
      primary_group: group.kanji_char,
    })),
  )

  const uniqueNeighbors = groupedNeighbors.filter(
    (entry, index, list) => list.findIndex((item) => item.id === entry.id) === index,
  )

  const nodes: GraphNode[] = [
    { ...center, isCenter: true, primary_group: undefined },
    ...uniqueNeighbors.map((entry) => ({
      ...entry,
      isCenter: false,
      shared_kanji: entry.shared_kanji,
    })),
  ]

  const links: GraphLink[] = uniqueNeighbors.map((neighbor) => ({
    source: center.id,
    target: neighbor.id,
    shared_kanji: neighbor.shared_kanji,
    strength: Math.min(1, 0.45 + neighbor.shared_kanji.length * 0.25),
  }))

  return { nodes, links }
}

export function getPathWords(ids: number[]): WordEntry[] {
  return ids
    .map((id) => getWordById(id))
    .filter((entry): entry is WordEntry => Boolean(entry))
}

export function getWordNeighbors(wordId: number): NetworkNeighbor[] {
  return getWordNetwork(wordId).neighbors
}
