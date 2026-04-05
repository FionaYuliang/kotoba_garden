export type JlptLevel = 1 | 2 | 3 | 4 | 5
export type QueryType = 'kanji' | 'kana' | 'romaji' | 'mixed'

export interface WordEntry {
  id: number
  kanji: string
  kana: string
  romaji: string
  kana_normalized: string
  romaji_normalized: string
  kanji_chars: string[]
  has_kanji: boolean
  jlpt_levels: JlptLevel[]
  source: number
  created_at: string
  updated_at: string
}

export interface SearchResponse {
  query: string
  query_type: QueryType
  results: WordEntry[]
}

export interface WordCardDetail {
  pronunciation: string
  meaning: string
  examples: string[]
}

export interface NetworkNeighbor extends WordEntry {
  shared_kanji: string[]
}

export interface WordNetworkResponse {
  center: WordEntry
  neighbors: NetworkNeighbor[]
}

export interface WordNetworkGroup {
  kanji_char: string
  neighbors: NetworkNeighbor[]
}

export interface DenseCenterWordCandidate {
  word: WordEntry
  score: number
  neighbor_count: number
  group_count: number
  groups: WordNetworkGroup[]
}

export interface GraphNode extends WordEntry {
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
  isCenter?: boolean
  shared_kanji?: string[]
  primary_group?: string
}

export interface GraphLink {
  source: string | number | GraphNode
  target: string | number | GraphNode
  shared_kanji: string[]
  strength: number
}
