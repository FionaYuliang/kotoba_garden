export type JlptLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
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
  source: string
  created_at: string
  updated_at: string
}

export interface SearchResponse {
  query: string
  query_type: QueryType
  results: WordEntry[]
}

export interface NetworkNeighbor extends WordEntry {
  shared_kanji: string[]
}

export interface WordNetworkResponse {
  center: WordEntry
  neighbors: NetworkNeighbor[]
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
}

export interface GraphLink {
  source: string | number | GraphNode
  target: string | number | GraphNode
  shared_kanji: string[]
  strength: number
}
