<template>
  <div
    class="theme-container"
    :class="pageClasses">
    <Home />

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
        <Content :page-key="$site.pages.find(p => p.path === '/footer.html').key"/>
      </div>
    </main>
  </div>
</template>

<script>
import Home from '@theme/components/Home.vue'
import Page from '@theme/components/Page.vue'

export default {
  name: 'Layout',

  components: {
    Home,
    Page
  },

  computed: {
    pageClasses () {
      const userPageClass = this.$page.frontmatter.pageClass
      return [
        {
          'no-navbar': true
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
