import type { OnyomiRhymeDataset } from '../types'

export const uangDataset: OnyomiRhymeDataset = {
  key: 'uang',
  label: 'uang',
  examples: [
    {
      id: 'uang-wang-王',
      rhyme: 'uang',
      pinyin: 'wang',
      kanji: '王',
      onyomi: 'おう',
      japaneseWords: ['王国', '王子'],
    },
    {
      id: 'uang-wang-望',
      rhyme: 'uang',
      pinyin: 'wang',
      kanji: '望',
      onyomi: 'ぼう',
      japaneseWords: ['希望', '願望'],
    },
  ],
}
