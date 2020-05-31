<template>
  <div
    class="theme-container"
    :class="pageClasses">
    <Navbar v-if="shouldShowNavbar" />

    <Home v-if="$page.frontmatter.home" />

    <Page>
      <template #top>
        <slot name="page-top" />
      </template>
      <template #bottom>
        <slot name="page-bottom" />
      </template>
    </Page>

    <main class="theme-default-content">
      <div class="footer">
        <Content slot-key="footer"/>
      </div>
    </main>
  </div>
</template>

<script>
import Home from '@theme/components/Home.vue'
import Navbar from '@theme/components/Navbar.vue'
import Page from '@theme/components/Page.vue'

export default {
  name: 'Layout',

  components: {
    Home,
    Page,
    Navbar
  },

  computed: {
    shouldShowNavbar () {
      const { themeConfig } = this.$site
      const { frontmatter } = this.$page
      if (
        frontmatter.navbar === false
        || themeConfig.navbar === false) {
        return false
      }
      return (
        this.$title
        || themeConfig.logo
        || themeConfig.repo
        || themeConfig.nav
        || this.$themeLocaleConfig.nav
      )
    },

    pageClasses () {
      const userPageClass = this.$page.frontmatter.pageClass
      return [
        {
          'no-navbar': !this.shouldShowNavbar
        },
        userPageClass
      ]
    }
  }
}
</script>

<style lang="stylus">
  .footer
    padding 2.5rem
    border-top 1px solid $borderColor
    text-align center
    color lighten($textColor, 25%)
</style>
