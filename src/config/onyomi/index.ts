import { rhymeOrder } from './rhymeOrder'
import { onyomiOrder, onyomiOrderWithCounts } from './onyomiOrder'
import type { OnyomiExample, OnyomiRhymeDataset } from './types'
import { aDataset } from './rhymes/a'
import { aiDataset } from './rhymes/ai'
import { anDataset } from './rhymes/an'
import { angDataset } from './rhymes/ang'
import { aoDataset } from './rhymes/ao'
import { eDataset } from './rhymes/e'
import { eiDataset } from './rhymes/ei'
import { enDataset } from './rhymes/en'
import { engDataset } from './rhymes/eng'
import { erDataset } from './rhymes/er'
import { iDataset } from './rhymes/i'
import { iaDataset } from './rhymes/ia'
import { ianDataset } from './rhymes/ian'
import { iangDataset } from './rhymes/iang'
import { iaoDataset } from './rhymes/iao'
import { ieDataset } from './rhymes/ie'
import { ingDataset } from './rhymes/ing'
import { inDataset } from './rhymes/in'
import { iongDataset } from './rhymes/iong'
import { iuDataset } from './rhymes/iu'
import { oDataset } from './rhymes/o'
import { ongDataset } from './rhymes/ong'
import { ouDataset } from './rhymes/ou'
import { oUmlautDataset } from './rhymes/ö'
import { uDataset } from './rhymes/u'
import { uaDataset } from './rhymes/ua'
import { uaiDataset } from './rhymes/uai'
import { uanDataset } from './rhymes/uan'
import { uangDataset } from './rhymes/uang'
import { uiDataset } from './rhymes/ui'
import { unDataset } from './rhymes/un'
import { uoDataset } from './rhymes/uo'
import { yuDataset } from './rhymes/ü'
import { yuanDataset } from './rhymes/üan'
import { yueDataset } from './rhymes/üe'
import { yunDataset } from './rhymes/ün'

export type { OnyomiKey } from './onyomiOrder'
export type { OnyomiExample, OnyomiRhymeDataset } from './types'
export { onyomiOrder, onyomiOrderWithCounts } from './onyomiOrder'
export { rhymeOrder } from './rhymeOrder'

const rhymeDatasets: OnyomiRhymeDataset[] = [
  angDataset,
  uangDataset,
  iangDataset,
  engDataset,
  ongDataset,
  iongDataset,
  ingDataset,
  aoDataset,
  iaoDataset,
  ouDataset,
  iuDataset,
  anDataset,
  uanDataset,
  ianDataset,
  yuanDataset,
  enDataset,
  unDataset,
  yunDataset,
  inDataset,
  aiDataset,
  uaiDataset,
  eiDataset,
  uiDataset,
  aDataset,
  iaDataset,
  uaDataset,
  oDataset,
  uoDataset,
  eDataset,
  ieDataset,
  yueDataset,
  uDataset,
  yuDataset,
  iDataset,
  oUmlautDataset,
  erDataset,
]

export const ONYOMI_RHYME_DATASETS = rhymeDatasets
export const ONYOMI_ALL_RHYMES = rhymeOrder
export const ONYOMI_EXAMPLES: OnyomiExample[] = rhymeDatasets.flatMap((dataset) =>
  dataset.examples.map((example) => ({
    ...example,
    japaneseWords: example.japaneseWords.map((word) => word.replace(/[~〜]/g, '')),
  })),
)
export const ONYOMI_RHYMES = ['all', ...rhymeDatasets.filter((dataset) => dataset.examples.length > 0).map((dataset) => dataset.key)] as const
export const ONYOMI_MODES = ['mode1', 'mode2'] as const
