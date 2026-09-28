import { HtmlBasePlugin } from '@11ty/eleventy'

export default function (eleventyConfig) {
  // Rewrites absolute URLs when the site lives under a sub-path (github.io/<repo>/).
  eleventyConfig.addPlugin(HtmlBasePlugin)

  eleventyConfig.addPassthroughCopy({ 'src/static': '/' })
  eleventyConfig.addPassthroughCopy('src/assets')

  // Safe inside <script type="application/json">.
  eleventyConfig.addFilter('json', (value) => JSON.stringify(value).replace(/</g, '\\u003c'))
  eleventyConfig.addFilter('listJoin', (items) => items.length > 1
    ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
    : items.join(''))
}

export const config = {
  dir: { input: 'src', output: '_site' },
  pathPrefix: process.env.BASE_PATH || '/',
  htmlTemplateEngine: 'njk',
  markdownTemplateEngine: false
}
