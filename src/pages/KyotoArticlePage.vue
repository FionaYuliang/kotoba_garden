<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import SiteHeader from '@/components/SiteHeader.vue'
import { getKyotoArticleBySlug } from '@/config/kyotoArticles'

const route = useRoute()

const article = computed(() => getKyotoArticleBySlug(String(route.params.slug ?? '')))
</script>

<template>
  <div class="page-shell">
    <SiteHeader />

    <main class="home-main">
      <section v-if="article" class="hero-panel kyoto-article-panel">
        <RouterLink class="kyoto-backlink" to="/kyoto-sanpo">返回京都散策</RouterLink>

        <article class="kyoto-article">
          <header class="kyoto-article__header">
            <div class="kyoto-article__meta">
              <span>{{ article.season }}</span>
              <span>{{ article.location }}</span>
              <span>{{ article.readTime }}</span>
              <span>{{ article.date }}</span>
            </div>
            <h1>{{ article.title }}</h1>
            <p class="kyoto-article__subtitle">{{ article.subtitle }}</p>
          </header>

          <div class="kyoto-article__body">
            <p class="kyoto-article__lead">{{ article.lead }}</p>
            <p v-for="paragraph in article.paragraphs" :key="paragraph">
              {{ paragraph }}
            </p>
          </div>

          <footer class="kyoto-article__footer">
            <span
              v-for="tag in article.tags"
              :key="`${article.slug}-${tag}`"
              class="kyoto-article__tag"
            >
              {{ tag }}
            </span>
          </footer>
        </article>
      </section>

      <section v-else class="hero-panel kyoto-article-panel">
        <RouterLink class="kyoto-backlink" to="/kyoto-sanpo">返回京都散策</RouterLink>
        <div class="joyo-empty">这篇文章暂时没有找到。</div>
      </section>
    </main>
  </div>
</template>
