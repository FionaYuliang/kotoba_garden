export const onyomiOrderWithCounts = [
  { onyomi: 'こう', count: 12 },
  { onyomi: 'しょう', count: 12 },
  { onyomi: 'じょう', count: 8 },
  { onyomi: 'ぼう', count: 6 },
  { onyomi: 'きょう', count: 5 },
  { onyomi: 'よう', count: 5 },
  { onyomi: 'ちょう', count: 4 },
  { onyomi: 'りょう', count: 4 },
  { onyomi: 'そう', count: 3 },
  { onyomi: 'ぞう', count: 3 },
  { onyomi: 'とう', count: 3 },
  { onyomi: 'ほう', count: 3 },
  { onyomi: 'おう', count: 2 },
  { onyomi: 'ごう', count: 1 },
  { onyomi: 'どう', count: 1 },
  { onyomi: 'ろう', count: 1 },
] as const

export const onyomiOrder = onyomiOrderWithCounts.map((item) => item.onyomi)

export type OnyomiKey = (typeof onyomiOrder)[number]
