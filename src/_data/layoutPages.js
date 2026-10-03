// One entry per layout, for generating a page per layout from layouts.json.
const { languages } = require('./layouts.json')

module.exports = languages.flatMap((language) => language.layouts.map((layout) => ({
  language,
  layout,
  others: language.layouts.filter((x) => x.url !== layout.url)
})))
