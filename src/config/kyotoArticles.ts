export type KyotoArticle = {
  slug: string
  title: string
  subtitle: string
  date: string
  season: string
  readTime: string
  location: string
  excerpt: string
  tags: string[]
  lead: string
  paragraphs: string[]
}

export const KYOTO_ARTICLES: KyotoArticle[] = [
  {
    slug: 'philosophers-path-april-light',
    title: '哲学之道的四月白光',
    subtitle: '在银阁寺与若王子之间，散步像一场缓慢而安静的呼吸。',
    date: '2026.04.05',
    season: '春',
    readTime: '6 min',
    location: '哲学之道',
    excerpt:
      '京都的好，常常不在目的地，而在一段不被催促的路上。沿着水渠向前，樱花的影子落在石边，连脚步都变得轻了。',
    tags: ['散步', '樱花', '城市观察'],
    lead:
      '如果京都有一种最温和的说话方式，大概就是哲学之道这样的路径。它不强调戏剧性，也不急着把风景推到人眼前，只是让光、树和流水慢慢并排出现。',
    paragraphs: [
      '早晨的游客还不算多，路边店铺也没有完全醒来。沿渠走的时候，能听见树梢很轻的摩擦声，偶尔夹着自行车经过的铃响。这样的声音很像京都给人的第一印象，不喧闹，但不会让人觉得空。',
      '我总觉得，京都适合“散策”这个词，而不只是“观光”。因为它的趣味往往在视线的边角处，在一段院墙的灰色纹理、在门前一盆修剪得刚好的植物、在小桥旁边那一块被雨水浸润得更深的石头。',
      '走在哲学之道上，会自然想起很多和季节有关的词。花见、木漏れ日、そよ風，这些词并不只是词典里的意思，而像是在景色里逐渐站稳了位置。语言在这时有一点像植物，它不是被解释出来的，而是被看见、被感受、被慢慢养出来的。',
    ],
  },
  {
    slug: 'kamogawa-evening-wind',
    title: '鸭川傍晚的风',
    subtitle: '天色落下来以后，城市的边缘感反而更清楚了。',
    date: '2026.04.05',
    season: '初夏',
    readTime: '7 min',
    location: '鸭川',
    excerpt:
      '坐在河边的时候，京都不像一座观光城市，更像一个有人认真生活着的地方。风从水面过来，把白天的热气一点点带走。',
    tags: ['河流', '傍晚', '城市感受'],
    lead:
      '鸭川最迷人的时刻，往往不是照片里最亮的那个时刻。真正让人记住它的，反而是傍晚一点点靠近时，那种介于日常与风景之间的过渡。',
    paragraphs: [
      '有人坐着聊天，有人沿河跑步，也有人只是把便利店买来的饮料放在旁边，安静地看水。这个场景没有什么戏剧性，却很容易让人记住，因为它像一种城市真正的呼吸。',
      '河岸两边的距离恰到好处，不会太宽，也不会逼仄。你能看见对岸的人，但不一定能听清他们说的话。这样的距离给了人一点安全感，也给了城市一点温柔。',
      '如果以后“京都散策”真的慢慢写下去，我想鸭川会是最常出现的地方之一。因为这里能提醒我，所谓喜欢一座城市，不是因为它每一处都精致，而是因为它总会给人留一点能安静坐下来的空间。',
    ],
  },
]

export function getKyotoArticleBySlug(slug: string) {
  return KYOTO_ARTICLES.find((article) => article.slug === slug)
}
