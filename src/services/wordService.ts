import { wordBank } from '@/data/wordBank'
import type {
  GraphLink,
  GraphNode,
  NetworkNeighbor,
  QueryType,
  SearchResponse,
  WordEntry,
  WordNetworkResponse,
} from '@/types/word'

const DEFAULT_CENTER_ID = 101

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

export function getWordById(id: number): WordEntry | undefined {
  return wordBank.find((entry) => entry.id === id)
}

export function getInitialCenterWord(): WordEntry {
  return getWordById(DEFAULT_CENTER_ID) ?? wordBank[0]
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

export function buildGraph(centerId: number, limit = 8): { nodes: GraphNode[]; links: GraphLink[] } {
  const network = getWordNetwork(centerId, limit)

  const nodes: GraphNode[] = [
    { ...network.center, isCenter: true },
    ...network.neighbors.map((entry) => ({
      ...entry,
      isCenter: false,
      shared_kanji: entry.shared_kanji,
    })),
  ]

  const links: GraphLink[] = network.neighbors.map((neighbor) => ({
    source: network.center.id,
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
