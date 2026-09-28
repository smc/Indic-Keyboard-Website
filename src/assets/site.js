// Floating "back to top" button, shown once the page has scrolled past the first screen.
(function () {
  const button = document.querySelector('[data-to-top]')
  if (!button) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  button.hidden = false
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  })

  let ticking = false
  const update = () => {
    button.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8)
    ticking = false
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(update)
    }
  }, { passive: true })
  update()
})()
