import fs from 'node:fs'
import path from 'node:path'

const targetArg = process.argv[2] ?? 'src/mock/n2-words.json'
const targetPath = path.resolve(process.cwd(), targetArg)

const HANJI_RE = /[一-龯々]/
const HANJI_GLOBAL_RE = /[一-龯々]/g
const HIRAGANA_RE = /^[ぁ-ゖーゝゞ\s]+$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/

function normalizeKana(value) {
  return value.trim()
}

function normalizeRomaji(value) {
  return value.trim().toLowerCase()
}

function extractKanjiChars(value) {
  return [...new Set(value.match(HANJI_GLOBAL_RE) ?? [])]
}

function isValidDate(value) {
  return typeof value === 'string' && ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value))
}

function pushIssue(bucket, index, word, message) {
  bucket.push(`#${index + 1} id=${word?.id ?? '?'} kanji=${word?.kanji ?? '(empty)'}: ${message}`)
}

let words

try {
  words = JSON.parse(fs.readFileSync(targetPath, 'utf8'))
} catch (error) {
  console.error(`Failed to read ${targetArg}`)
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

if (!Array.isArray(words)) {
  console.error(`Expected an array in ${targetArg}`)
  process.exit(1)
}

const errors = []
const warnings = []
const seenIds = new Map()
const seenKanji = new Map()

words.forEach((word, index) => {
  if (!word || typeof word !== 'object') {
    errors.push(`#${index + 1}: entry is not an object`)
    return
  }

  if (!Number.isInteger(word.id) || word.id <= 0) {
    pushIssue(errors, index, word, 'id must be a positive integer')
  } else if (seenIds.has(word.id)) {
    pushIssue(errors, index, word, `duplicate id with entry #${seenIds.get(word.id)}`)
  } else {
    seenIds.set(word.id, index + 1)
  }

  if (typeof word.kanji !== 'string' || !word.kanji.trim()) {
    pushIssue(errors, index, word, 'kanji is required')
  } else if (!HANJI_RE.test(word.kanji)) {
    pushIssue(errors, index, word, 'kanji must contain at least one kanji character')
  } else if (seenKanji.has(word.kanji)) {
    pushIssue(errors, index, word, `duplicate kanji with entry #${seenKanji.get(word.kanji)}`)
  } else {
    seenKanji.set(word.kanji, index + 1)
  }

  if (typeof word.kana !== 'string' || !word.kana.trim()) {
    pushIssue(errors, index, word, 'kana is required')
  } else if (!HIRAGANA_RE.test(word.kana)) {
    pushIssue(warnings, index, word, 'kana contains characters outside hiragana range')
  }

  if (typeof word.romaji !== 'string' || !word.romaji.trim()) {
    pushIssue(errors, index, word, 'romaji is required')
  }

  const expectedKanaNormalized = normalizeKana(word.kana ?? '')
  if (word.kana_normalized !== expectedKanaNormalized) {
    pushIssue(
      warnings,
      index,
      word,
      `kana_normalized should be "${expectedKanaNormalized}"`,
    )
  }

  const expectedRomajiNormalized = normalizeRomaji(word.romaji ?? '')
  if (word.romaji_normalized !== expectedRomajiNormalized) {
    pushIssue(
      warnings,
      index,
      word,
      `romaji_normalized should be "${expectedRomajiNormalized}"`,
    )
  }

  const expectedKanjiChars = extractKanjiChars(word.kanji ?? '')
  if (!Array.isArray(word.kanji_chars)) {
    pushIssue(errors, index, word, 'kanji_chars must be an array')
  } else if (JSON.stringify(word.kanji_chars) !== JSON.stringify(expectedKanjiChars)) {
    pushIssue(
      warnings,
      index,
      word,
      `kanji_chars should be ${JSON.stringify(expectedKanjiChars)}`,
    )
  }

  const expectedHasKanji = HANJI_RE.test(word.kanji ?? '')
  if (word.has_kanji !== expectedHasKanji) {
    pushIssue(warnings, index, word, `has_kanji should be ${expectedHasKanji}`)
  }

  if (!Array.isArray(word.jlpt_levels) || word.jlpt_levels.length === 0) {
    pushIssue(errors, index, word, 'jlpt_levels must be a non-empty array')
  } else {
    const invalidLevels = word.jlpt_levels.filter(
      (level) => !Number.isInteger(level) || level < 1 || level > 5,
    )
    if (invalidLevels.length > 0) {
      pushIssue(errors, index, word, `invalid jlpt_levels: ${invalidLevels.join(', ')}`)
    }
  }

  if (!Number.isInteger(word.source)) {
    pushIssue(errors, index, word, 'source must be an integer')
  }

  if (!isValidDate(word.created_at)) {
    pushIssue(errors, index, word, 'created_at must be a valid ISO datetime string')
  }

  if (!isValidDate(word.updated_at)) {
    pushIssue(errors, index, word, 'updated_at must be a valid ISO datetime string')
  }
})

const sortedIds = words
  .map((word) => word.id)
  .filter((id) => Number.isInteger(id))
  .sort((a, b) => a - b)

for (let index = 1; index < sortedIds.length; index += 1) {
  if (sortedIds[index] !== sortedIds[index - 1] + 1) {
    warnings.push(
      `ID sequence gap between ${sortedIds[index - 1]} and ${sortedIds[index]}`,
    )
  }
}

console.log(`Validated ${words.length} words from ${targetArg}`)

if (warnings.length > 0) {
  console.log(`\nWarnings (${warnings.length})`)
  warnings.forEach((warning) => console.log(`- ${warning}`))
}

if (errors.length > 0) {
  console.error(`\nErrors (${errors.length})`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log('\nNo blocking errors found.')
