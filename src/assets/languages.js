// Languages page: filter layouts by type and search. Without this script every layout is listed.

(function () {
  const controls = document.querySelector('[data-layouts-controls]')
  if (!controls) return
  const buttons = Array.from(controls.querySelectorAll('[data-type-filter]'))
  const search = controls.querySelector('[data-layouts-search]')
  const groups = Array.from(document.querySelectorAll('[data-layout-group]'))
  const empty = document.querySelector('[data-layouts-empty]')
  let type = 'All'

  function update () {
    const q = search.value.trim().toLowerCase()
    let shown = 0
    groups.forEach((group) => {
      const rows = Array.from(group.querySelectorAll('[data-layout-row]'))
      let visible = 0
      rows.forEach((row) => {
        const match = (type === 'All' || row.dataset.type === type) && (!q || row.dataset.search.includes(q))
        row.hidden = !match
        if (match) visible += 1
      })
      group.hidden = visible === 0
      shown += visible
    })
    empty.hidden = shown > 0
  }

  buttons.forEach((b) => b.addEventListener('click', () => {
    type = b.dataset.typeFilter
    buttons.forEach((x) => {
      x.classList.toggle('is-on', x === b)
      x.setAttribute('aria-pressed', x === b ? 'true' : 'false')
    })
    update()
  }))
  search.addEventListener('input', update)
  controls.hidden = false
  update()
})()
