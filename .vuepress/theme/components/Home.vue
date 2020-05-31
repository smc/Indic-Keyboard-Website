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

      <h2>Download</h2>
      <p
        v-if="data.action && data.action.length"
        class="action"
      >
        <NavLink
          class="action-button"
          v-for="(e, index) in data.action"
          :key="index"
          :item="e"
        />
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
    img
      max-width: 100%
      max-height 280px
      display block
      margin 3rem auto 1.5rem
    h1
      font-size 3rem
      text-align center
    h1, .description, .action
      margin 1.8rem auto
    .description
      font-size 1.5rem
      line-height 1.3
    .action
      display flex
    .action-button
      width 50%
      font-size 1.2rem
      text-align center
      font-weight 700
      color #fff
      background-color $accentColor
      padding 0.8rem 1.6rem
      border-radius 4px
      transition background-color .1s ease
      box-sizing border-box
      border-bottom 1px solid darken($accentColor, 10%)
      &:hover
        background-color lighten($accentColor, 10%)
      &:not(:last-child)
        margin-right 1rem
      .outbound
        display none
    .links
      text-align center
    .search-box
      margin-bottom 1.5em

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
