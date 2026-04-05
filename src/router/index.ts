import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/pages/AboutPage.vue'),
    },
    {
      path: '/joyo-kanji',
      name: 'joyo-kanji',
      component: () => import('@/pages/JoyoKanjiPage.vue'),
    },
    {
      path: '/bookshelf',
      name: 'bookshelf',
      component: () => import('@/pages/BookshelfPage.vue'),
    },
    {
      path: '/kyoto-sanpo',
      name: 'kyoto-sanpo',
      component: () => import('@/pages/KyotoSanpoPage.vue'),
    },
    {
      path: '/kyoto-sanpo/:slug',
      name: 'kyoto-article',
      component: () => import('@/pages/KyotoArticlePage.vue'),
    },
  ],
})

export default router
