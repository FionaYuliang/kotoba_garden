<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue'

const favoriteDictionaries = [
  {
    title: '新明解国語辞典',
    accent: 'ink',
  },
  {
    title: '明鏡国語辞典',
    accent: 'mist',
  },


]
</script>

<template>
  <div class="page-shell">
    <SiteHeader />

    <main class="home-main">
      <section class="hero-panel bookshelf-panel">
        <section class="bookshelf-hero">
          <div class="bookshelf-hero__copy">
            <p class="about-section__eyebrow">Dictionary Shelf</p>
            <h2>词典书架</h2>
            <p class="bookshelf-hero__lead">
              <!-- 这里收集我喜欢和珍藏的日语词典。它们不只是工具，更像一排可以反复走近的书脊，帮助我理解词义、语感、发音与汉字之间细微但真实的差别。 -->
            </p>
          </div>


        </section>

        <section class="bookshelf-gallery">
          <article v-for="book in favoriteDictionaries" :key="book.title" class="bookshelf-book">
            <div class="bookshelf-book__cover" :class="`is-${book.accent}`">


            </div>
            <p class="bookshelf-book__name">{{ book.title }}</p>
          </article>
        </section>
      </section>
    </main>
  </div>
</template>
