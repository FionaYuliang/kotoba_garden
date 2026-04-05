<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue'
import { KYOTO_ARTICLES } from '@/config/kyotoArticles'
</script>

<template>
  <div class="page-shell">
    <SiteHeader />

    <main class="home-main">
      <section class="hero-panel kyoto-panel">
        <section class="kyoto-hero">
          <div class="kyoto-hero__copy">
            <p class="about-section__eyebrow">Kyoto Sanpo</p>
            <h2>京都散策</h2>
            <p class="kyoto-hero__lead">
              
            </p>
          </div>
        </section>

        <section class="kyoto-list">
          <RouterLink
            v-for="article in KYOTO_ARTICLES"
            :key="article.slug"
            class="kyoto-card"
            :to="`/kyoto-sanpo/${article.slug}`"
          >
          
            <h3>{{ article.title }}</h3>
            <p class="kyoto-card__subtitle">{{ article.subtitle }}</p>
            <p class="kyoto-card__excerpt">{{ article.excerpt }}</p>

         
          </RouterLink>
        </section>
      </section>
    </main>
  </div>
</template>
