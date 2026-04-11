export type OnyomiExample = {
  id: string
  rhyme: string
  pinyin: string
  kanji: string
  onyomi: string
  japaneseWords: string[]
  isSpecial?: boolean
}

export type OnyomiRhymeDataset = {
  key: string
  label: string
  aliases?: string[]
  examples: OnyomiExample[]
}
