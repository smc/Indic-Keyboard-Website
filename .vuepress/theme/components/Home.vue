<template>
  <main
    class="home theme-default-content"
    aria-labelledby="main-title"
  >
    <header class="hero">
      <RouterLink
        :to="$localePath"
        class="home-link"
      >
        <img
          v-if="$site.themeConfig.logo"
          :src="$withBase($site.themeConfig.logo) || $withBase(data.heroImage)"
          :alt="$siteTitle || data.heroText"
        />
      </RouterLink>

      <h1
        v-if="$siteTitle"
        id="main-title"
      >
        {{ $siteTitle || data.heroText || $title }}
      </h1>

      <div class="links">
        <SearchBox v-if="$site.themeConfig.search !== false && $page.frontmatter.search !== false" />
        <NavLinks/>
      </div>

      <p
        v-if="data.tagline !== null"
        class="description"
      >
        <Content slot-key="description"/>
      </p>
    </header>
  </main>
</template>

<script>
import NavLink from '@theme/components/NavLink.vue'
import SearchBox from '@SearchBox'
import NavLinks from '@theme/components/NavLinks.vue'

export default {
  name: 'Home',

  components: {
    NavLink,
    NavLinks,
    SearchBox
  },

  computed: {
    data () {
      return this.$page.frontmatter
    }
  }
}
</script>

<style lang="stylus">
.home
  padding $navbarHeight 2rem 0
  max-width $homePageWidth
  margin 0px auto
  display block
  .hero
    margin-top 0 !important
    img
      max-width 100%
      max-height 150px
      display block
      margin 1.5rem auto
    h1
      font-size 3rem
      text-align center
    h1, .description
      margin 1.8rem auto
    .description
      font-size 1.5rem
      line-height 1.3
    .links
      text-align center
    .search-box
      margin-bottom 1.5em
      z-index 99

@media (max-width: $MQMobileNarrow)
  .home
    padding-left 1.5rem
    padding-right 1.5rem
    .hero
      img
        max-height 210px
        margin 2rem auto 1.2rem
      h1
        font-size 2rem
      h1, .description, .action
        margin 1.2rem auto
      .description
        font-size 1.2rem
      .action-button
        font-size 1rem
        padding 0.6rem 1.2rem
</style>
