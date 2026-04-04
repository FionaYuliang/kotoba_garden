import fs from 'node:fs'
import path from 'node:path'

const wordsPath = path.resolve(process.cwd(), 'src/mock/n2-words.json')
const outputPath = path.resolve(process.cwd(), 'src/config/centerWordPool.ts')
const poolSize = Number(process.argv[2] ?? 16)

const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'))

function sharedKanji(a, b) {
  return a.kanji_chars.filter((char) => b.kanji_chars.includes(char))
}

function getWordNetwork(center, bank) {
  const neighbors = bank
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

  return { center, neighbors }
}

function groupNeighborsByCenterKanji(center, neighbors) {
  return center.kanji_chars
    .map((kanjiChar) => ({
      kanji_char: kanjiChar,
      neighbors: neighbors.filter((neighbor) => neighbor.shared_kanji.includes(kanjiChar)),
    }))
    .filter((group) => group.neighbors.length > 0)
}

function getDenseCenterWordCandidates(limit = 24) {
  return words
    .map((word) => {
      const network = getWordNetwork(word, words)
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
      }
    })
    .filter(
      (candidate) =>
        candidate.word.kanji_chars.length === 2 &&
        candidate.neighbor_count > 0 &&
        candidate.group_count > 0,
    )
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

const pool = getDenseCenterWordCandidates(poolSize)
const lines = [
  'export const DEFAULT_CENTER_WORD_POOL = [',
  ...pool.map((candidate) => `  ${candidate.word.id}, // ${candidate.word.kanji}`),
  '] as const',
  '',
]

fs.writeFileSync(outputPath, lines.join('\n'))

console.log(
  JSON.stringify(
    {
      poolSize: pool.length,
      ids: pool.map((candidate) => candidate.word.id),
      words: pool.map((candidate) => ({
        id: candidate.word.id,
        kanji: candidate.word.kanji,
        score: candidate.score,
        neighbors: candidate.neighbor_count,
        groups: candidate.group_count,
      })),
    },
    null,
    2,
  ),
)
