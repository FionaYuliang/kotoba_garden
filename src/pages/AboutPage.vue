<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue'
import wechatQrImage from '@/assets/wechat-qr.jpeg'

const wechatContact = '请替换为你的微信号'
</script>

<template>
  <div class="page-shell">
    <SiteHeader />

    <main class="home-main">
      <section class="hero-panel about-panel">
        <section class="about-section">
          <div class="about-section__heading">
            <p class="about-section__eyebrow">About The Creator</p>
            <h3>关于我</h3>
          </div>

          <div class="about-creator" tabindex="0">
            <div class="about-wechat-card">
              <div class="about-wechat-card__qr">
                <img :src="wechatQrImage" alt="微信二维码" />
              </div>
            </div>

            <article class="about-card about-card--wide">
              <h3>@言葉の羽音</h3>
              <p>
                主业码农，喜欢汉字和日语语言文化，自然博物爱好者。
              </p>
            </article>

            <!-- <aside class="about-card about-contact">
              <h3>联系与关注</h3>
              <p>微信：这里后续可填写你的个人微信</p>
              <p>公众号：这里后续可填写公众号名称</p>
              <p>备注：也可以放邮箱、个人简介或一句想说的话</p>
            </aside> -->
          </div>
        </section>
        <section class="about-section">
          <div class="about-section__heading">
            <p class="about-section__eyebrow">About The Site</p>
            <h3>关于网站</h3>
          </div>

          <div class="about-grid">
            <article class="about-card">
              <h3>WHY</h3>
              <p>
                汉字词之间天然存在结构联系。我想把这些联系可视化，让词与词之间不再只是单独的个体，而是一张可以点击、延展、漫游的词汇地图，让学习更像探索，而不是枯燥无趣的背诵。
              </p>
            </article>

            <article class="about-card">
              <h3>AFTER</h3>
              <p>
                后续会逐步开发更多丰富有趣的内容，敬请关注。
              </p>
            </article>
          </div>
        </section>


      </section>
    </main>
  </div>
</template>
