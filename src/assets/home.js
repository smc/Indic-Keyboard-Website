// Home page behaviour: the hero keyboard screenshots and the language explorer.
// The page is fully rendered without this script; it only adds motion and filtering.

(function () {
  const ROTATE_MS = 3200
  const INITIAL_LANGUAGES = 12

  // Hero: cycles through screenshots of real layouts. Pauses while hovered or focused.
  function initHero (root) {
    const hero = JSON.parse(root.querySelector('[data-hero-data]').textContent)
    const label = root.querySelector('[data-hero-label]')
    const native = root.querySelector('[data-hero-native]')
    const shots = Array.from(root.querySelectorAll('[data-hero-shot]'))
    const dots = root.querySelector('[data-hero-dots]')
    const buttons = Array.from(dots.children)
    let index = 0
    let paused = false

    function show (i) {
      index = i
      const h = hero[i]
      label.textContent = h.layout ? `${h.name} · ${h.layout}` : h.name
      native.textContent = h.native
      native.lang = h.language
      native.dir = h.dir
      shots.forEach((img, n) => {
        img.classList.toggle('is-active', n === i)
        if (n === i) img.removeAttribute('aria-hidden')
        else img.setAttribute('aria-hidden', 'true')
      })
      buttons.forEach((b, n) => b.setAttribute('aria-pressed', n === i ? 'true' : 'false'))
    }

    dots.hidden = false
    buttons.forEach((b, i) => b.addEventListener('click', () => show(i)))
    root.addEventListener('mouseenter', () => { paused = true })
    root.addEventListener('mouseleave', () => { paused = false })
    root.addEventListener('focusin', () => { paused = true })
    root.addEventListener('focusout', () => { paused = false })

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setInterval(() => {
      if (!paused && !document.hidden) show((index + 1) % hero.length)
    }, ROTATE_MS)
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
