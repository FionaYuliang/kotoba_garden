<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand-block">
        <p class="brand-kicker">KANJI WONDERLAND</p>
        <h1 class="brand-title">日语汉字漫游</h1>
      </div>

      <nav class="topnav" aria-label="Primary">
        <RouterLink class="topnav-link" active-class="is-active" to="/">汉字词游戏</RouterLink>
        <a class="topnav-link" href="#">2136 当用汉字</a>
        <a class="topnav-link" href="#">散文专栏</a>
        <RouterLink class="topnav-link" active-class="is-active" to="/about">关于我</RouterLink>
      </nav>
    </div>
  </header>
</template>
