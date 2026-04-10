import fs from 'node:fs'
import path from 'node:path'

const rhymesDir = path.resolve(process.cwd(), 'src/config/onyomi/rhymes')
const outputPath = path.resolve(process.cwd(), 'src/config/onyomi/onyomiOrder.ts')

const files = fs
  .readdirSync(rhymesDir)
  .filter((file) => file.endsWith('.ts'))
  .sort((a, b) => a.localeCompare(b))

const objectBlockRe = /\{[\s\S]*?kanji:\s*'([^']+)'[\s\S]*?onyomi:\s*'([^']+)'[\s\S]*?\}/g
const onyomiToKanji = new Map()

for (const file of files) {
  const filePath = path.join(rhymesDir, file)
  const source = fs.readFileSync(filePath, 'utf8')
  let match

  while ((match = objectBlockRe.exec(source)) !== null) {
    const kanji = match[1]
    const onyomi = match[2]
    const existing = onyomiToKanji.get(onyomi) ?? new Set()
    existing.add(kanji)
    onyomiToKanji.set(onyomi, existing)
  }
}

const sorted = [...onyomiToKanji.entries()]
  .map(([onyomi, kanjiSet]) => ({ onyomi, count: kanjiSet.size }))
  .sort((a, b) => b.count - a.count || a.onyomi.localeCompare(b.onyomi, 'ja'))

const lines = [
  'export const onyomiOrderWithCounts = [',
  ...sorted.map((item) => `  { onyomi: '${item.onyomi}', count: ${item.count} },`),
  '] as const',
  '',
  'export const onyomiOrder = onyomiOrderWithCounts.map((item) => item.onyomi)',
  '',
  'export type OnyomiKey = (typeof onyomiOrder)[number]',
  '',
]

fs.writeFileSync(outputPath, lines.join('\n'))

console.log(
  JSON.stringify(
    {
      updated: path.relative(process.cwd(), outputPath),
      entries: sorted,
    },
    null,
    2,
  ),
)
