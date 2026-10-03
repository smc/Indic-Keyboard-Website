// Runs jquery.ime input methods exactly as a browser would: jQuery and jquery.ime load into
// jsdom, an IME is attached to a textarea, and key sequences are typed as keypress events.
// Nothing about the transliteration rules is reimplemented here.

const fs = require('fs')
const path = require('path')
const { JSDOM } = require('jsdom')

const IME_DIR = path.join(path.dirname(require.resolve('jquery.ime/package.json')), 'dist/jquery.ime')

function createIme () {
  const dom = new JSDOM('<!doctype html><textarea></textarea>', { runScripts: 'outside-only', url: 'https://indic.app/' })
  const w = dom.window
  w.eval(fs.readFileSync(require.resolve('jquery'), 'utf8'))
  w.eval(fs.readFileSync(path.join(IME_DIR, 'jquery.ime.js'), 'utf8'))
  const $ = w.jQuery
  const textarea = w.document.querySelector('textarea')
  const $textarea = $(textarea).ime({ showSelector: false })
  const ime = $textarea.data('ime')
  ime.enable()

  const load = (id, seen = new Set()) => {
    if ($.ime.inputmethods[id]) return true
    const source = $.ime.sources[id]
    if (!source || seen.has(id)) return false
    seen.add(id)
    if (source.depends && !load(source.depends, seen)) return false
    w.eval(fs.readFileSync(path.join(IME_DIR, source.source), 'utf8'))
    return !!$.ime.inputmethods[id]
  }

  return {
    // The jquery.ime rules file for an input method, e.g. "rules/ml/ml-transliteration.js".
    sourceOf: (id) => ($.ime.sources[id] || {}).source || null,

    // Load an input method from jquery.ime; returns its definition or null.
    load: (id) => (load(id) ? $.ime.inputmethods[id] : null),

    // Register an input method that is not part of jquery.ime (jquery.ime's own format).
    register: (definition) => $.ime.register(definition),

    // Type keys one by one; returns the text after each key.
    type (id, keys) {
      ime.setIM(id)
      ime.context = ''
      textarea.value = ''
      textarea.setSelectionRange(0, 0)
      const steps = []
      for (const key of keys) {
        const event = $.Event('keypress', { which: key.charCodeAt(0), keyCode: key.charCodeAt(0), charCode: key.charCodeAt(0) })
        $textarea.trigger(event)
        // jquery.ime lets unmatched keys through; a real text field would then insert them.
        if (!event.isDefaultPrevented()) {
          const at = textarea.selectionStart
          textarea.value = textarea.value.slice(0, at) + key + textarea.value.slice(textarea.selectionEnd)
          textarea.setSelectionRange(at + key.length, at + key.length)
        }
        steps.push(textarea.value)
      }
      return steps
    }
  }
}

module.exports = { createIme }
