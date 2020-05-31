<template>
  <main class="page">
    <slot name="top" />

    <div class="theme-default-content page-title">
      <h1
        v-if="data.title !== null"
      >
        {{ data.title }}
      </h1>
    </div>

    <Content class="theme-default-content" />
    <PageEdit />

    <PageNav v-bind="{ sidebarItems }" />

    <slot name="bottom" />
  </main>
</template>

<script>
import PageEdit from '@theme/components/PageEdit.vue'
import PageNav from '@theme/components/PageNav.vue'

export default {
  components: { PageEdit, PageNav },
  props: ['sidebarItems'],
  computed: {
    data () {
      return this.$page.frontmatter
    }
  }
}
</script>

<style lang="stylus">
@require '../styles/wrapper.styl'

.page
  padding-bottom 2rem
  display block
  .page-title
    margin-top 3rem
    padding-bottom 0

</style>
