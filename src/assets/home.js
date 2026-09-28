// Home page behaviour: the animated hero keyboard and the language explorer.
// The page is fully rendered without this script; it only adds motion and filtering.

(function () {
  const TICK_MS = 260
  const HOLD_TICKS = 9
  const INITIAL_LANGUAGES = 12

  function graphemes (word) {
    if (window.Intl && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word), (s) => s.segment)
    }
    return Array.from(word)
  }

  function initHero (root) {
    const hero = JSON.parse(root.querySelector('[data-hero-data]').textContent)
    const label = root.querySelector('[data-hero-label]')
    const field = root.querySelector('[data-hero-field]')
    const typed = root.querySelector('[data-hero-typed]')
    const strip = root.querySelector('[data-hero-strip]').children
    const rows = root.querySelector('[data-hero-rows]')
    const space = root.querySelector('[data-hero-space]')
    const dots = root.querySelector('[data-hero-dots]')
    let index = 0
    let parts = graphemes(hero[0].native)
    let step = parts.length
    let keys = []

    function renderLanguage () {
      const h = hero[index]
      const around = (offset) => hero[(index + offset + hero.length) % hero.length]
      parts = graphemes(h.native)
      label.textContent = h.layout ? `${h.name} · ${h.layout}` : h.name
      field.lang = h.language
      field.dir = h.dir
      strip[0].textContent = around(-1).native
      strip[1].textContent = h.native
      strip[1].lang = h.language
      strip[2].textContent = around(1).native
      space.textContent = h.native
      space.lang = h.language
      rows.replaceChildren(...h.rows.map((row) => {
        const div = document.createElement('div')
        div.className = 'hero-keyboard__row'
        div.append(...row.map((key) => {
          const span = document.createElement('span')
          span.className = 'hero-keyboard__key'
          span.lang = h.language
          span.textContent = key
          return span
        }))
        return div
      }))
      keys = Array.from(rows.querySelectorAll('.hero-keyboard__key'))
      Array.from(dots.children).forEach((dot, i) => dot.setAttribute('aria-pressed', i === index ? 'true' : 'false'))
    }

    function renderStep () {
      typed.textContent = parts.slice(0, Math.min(step, parts.length)).join('')
      const active = step >= 1 && step <= parts.length ? parts[step - 1] : ''
      keys.forEach((k) => k.classList.toggle('is-hit', !!active && active.includes(k.textContent)))
    }

    function select (i) {
      index = i
      step = 0
      renderLanguage()
      renderStep()
    }

    dots.hidden = false
    Array.from(dots.children).forEach((dot, i) => dot.addEventListener('click', () => select(i)))
    renderLanguage()

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setInterval(() => {
      step += 1
      if (step > parts.length + HOLD_TICKS) select((index + 1) % hero.length)
      else renderStep()
    }, TICK_MS)
  }

  function initExplorer (root) {
    const controls = root.querySelector('[data-explorer-controls]')
    const buttons = Array.from(root.querySelectorAll('[data-filter]'))
    const search = root.querySelector('[data-explorer-search]')
    const cards = Array.from(root.querySelectorAll('.lang-card'))
    const more = root.querySelector('[data-explorer-more]')
    const empty = root.querySelector('[data-explorer-empty]')
    let filter = 'all'
    let showAll = false

    function update () {
      const q = search.value.trim().toLowerCase()
      const matches = cards.filter((c) => {
        const inFilter = filter === 'all' || (filter === 'new' ? c.dataset.new === 'true' : c.dataset.region === filter)
        return inFilter && (!q || c.dataset.search.includes(q))
      })
      const collapsed = filter === 'all' && !q && !showAll
      const visible = new Set(collapsed ? matches.slice(0, INITIAL_LANGUAGES) : matches)
      cards.forEach((c) => { c.hidden = !visible.has(c) })
      more.hidden = visible.size === matches.length
      empty.hidden = matches.length > 0
    }

    buttons.forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.filter
      buttons.forEach((x) => {
        x.classList.toggle('is-on', x === b)
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false')
      })
      update()
    }))
    search.addEventListener('input', update)
    more.addEventListener('click', () => { showAll = true; update() })
    controls.hidden = false
    update()
  }

  document.querySelectorAll('[data-hero]').forEach(initHero)
  document.querySelectorAll('[data-explorer]').forEach(initExplorer)
})()
