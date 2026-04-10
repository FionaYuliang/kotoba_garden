<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand-block">
        <p class="brand-kicker">Kotoba Garden</p>
        <h1 class="brand-title">日语文字漫游</h1>
      </div>

      <nav class="topnav" aria-label="Primary">
        <RouterLink class="topnav-link" active-class="is-active" to="/">汉字词游戏</RouterLink>
        <RouterLink class="topnav-link" active-class="is-active" to="/onyomi-map">音读关系图谱</RouterLink>
        <RouterLink class="topnav-link" active-class="is-active" to="/joyo-kanji">2136 当用汉字</RouterLink>
        <!-- 和语词根词源入口暂时隐藏，后续仅对付费用户开放 -->
        <!-- <RouterLink class="topnav-link" active-class="is-active" to="/bookshelf">词典书架</RouterLink> -->
        <RouterLink class="topnav-link" active-class="is-active" to="/about">关于我</RouterLink>
      </nav>
    </div>
  </header>
</template>
