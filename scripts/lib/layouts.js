// Layout details for the layout pages: keyboards drawn from the app's key files, key mappings
// and combinations found by typing through jquery.ime, and references.

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { createIme } = require('./ime')
const { sampleRegex } = require('./regex-sample')

const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const VOWELS = new Set('aeiouAEIOU')
const PRINTABLE = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i))
const PAIR_FIRST = LETTERS + '0123456789/\\'
const PAIR_SECOND = LETTERS + '#/_~\\'
const INVISIBLE = { '‌': 'ZWNJ', '‍': 'ZWJ' }

const isConsonantKey = (k) => LETTERS.includes(k) && !VOWELS.has(k)
// Visible units in a string: letters, digits and symbols, not combining marks or joiners.
const units = (s) => [...s].filter((c) => !/[\p{M}\u200c\u200d]/u.test(c)).length
// A sequence is worth listing when it types fewer units than its parts typed one after another
// (kh gives one letter, not two), and does more than put a sign on the letter already there
// (k then a or R only swaps the virama for a vowel sign).
const addsOnlySigns = (whole, first) => {
  const base = first.replace(/\p{M}+$/u, '')
  return whole.startsWith(base) && /^\p{M}+$/u.test(whole.slice(base.length))
}
const combines = (whole, first, second) => whole !== first + second &&
  !hasLatinLetter(whole) &&
  units(whole) < units(first) + units(second) &&
  !addsOnlySigns(whole, first)
const hasLatinLetter = (s) => /[A-Za-z]/.test(s)
const display = (s) => (/^[‌‍]+$/.test(s) ? [...s].map((c) => INVISIBLE[c]).join(' ') : s)
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function createLayoutBuilder ({ repo, xmlDir, rulesDir, meta, decode, stripComments, rowkeyFiles, keySpecs, warn }) {
  const ime = createIme()
  const imeCommit = (() => {
    try {
      return execFileSync('git', ['-C', path.join(repo, 'ime'), 'ls-tree', 'HEAD', 'libs/jquery.ime'], { encoding: 'utf8' }).split(/\s+/)[2]
    } catch (e) {
      return null
    }
  })()
  const installed = require('jquery.ime/package.json')
  const installedCommit = ((installed._resolved || '').match(/#([0-9a-f]{40})/) || [])[1] ||
    ((require('../../package.json').devDependencies['jquery.ime'] || '').match(/#([0-9a-f]{40})/) || [])[1]
  if (imeCommit && installedCommit && imeCommit !== installedCommit) {
    warn(`the app pins jquery.ime ${imeCommit.slice(0, 8)} but the site installs ${installedCommit.slice(0, 8)}; update package.json`)
  }

  const rulesFile = (method) => path.join(rulesDir, `${method.toLowerCase().replace(/-/g, '_')}.xml`)

  // The app's own copy of a rule set, in jquery.ime's format. The app has fixes that are not in
  // upstream jquery.ime, so the pages describe what the app types.
  const appMethods = new Map()
  function appMethod (method) {
    if (appMethods.has(method)) return appMethods.get(method)
    const file = rulesFile(method)
    if (!fs.existsSync(file)) {
      appMethods.set(method, null)
      return null
    }
    const xml = fs.readFileSync(file, 'utf8')
    const head = xml.match(/<inputmethod\b([^>]*)>/)[1]
    const get = (block, name) => {
      const m = block.match(new RegExp(`\\b${name}="([^"]*)"`))
      return m ? decode(m[1]) : undefined
    }
    const patterns = []
    const patternsX = []
    for (const [, p] of xml.matchAll(/<pattern\b([^>]*)\/>/g)) {
      const rule = [get(p, 'input')]
      if (get(p, 'context') !== undefined) rule.push(get(p, 'context'))
      rule.push(get(p, 'replacement'))
      ;(get(p, 'altGr') === 'true' ? patternsX : patterns).push(rule)
    }
    const definition = {
      id: `app:${method}`,
      name: get(head, 'name'),
      contextLength: Number(get(head, 'contextLength')) || 0,
      maxKeyLength: Number(get(head, 'maxKeyLength')) || 1,
      patterns,
      patterns_x: patternsX
    }
    ime.register(definition)
    appMethods.set(method, definition)
    return definition
  }

  // The rowkeys files of a layout set's alphabet keyboard (not its symbol pages).
  function alphabetFiles (layoutSet) {
    const setFile = path.join(xmlDir, `keyboard_layout_set_${layoutSet}.xml`)
    if (!fs.existsSync(setFile)) return []
    const set = stripComments(fs.readFileSync(setFile, 'utf8'))
    const element = [...set.matchAll(/<Element\b([^>]*)>/g)].map(([, a]) => a)
      .find((a) => /elementName="alphabet"/.test(a))
    const start = element && (element.match(/elementKeyboard="@xml\/([a-z0-9_]+)"/) || [])[1]
    if (!start) return []
    const seen = new Set()
    const found = []
    const visit = (name) => {
      if (seen.has(name)) return
      seen.add(name)
      const file = path.join(xmlDir, `${name}.xml`)
      if (!fs.existsSync(file)) return
      if (name.startsWith('rowkeys_')) found.push(file)
      const xml = stripComments(fs.readFileSync(file, 'utf8'))
      for (const [, ref] of xml.matchAll(/@xml\/([a-z0-9_]+)/g)) {
        if (/^(kbd|rows|rowkeys)_/.test(ref)) visit(ref)
      }
    }
    visit(start)
    return found
  }

  // Keys in each row, for the normal and shifted states of a layout.
  function keyboard (layoutSet) {
    const files = alphabetFiles(layoutSet)
    if (!files.length) return null
    const normal = []
    const shifted = []
    for (const file of files) {
      const xml = stripComments(fs.readFileSync(file, 'utf8'))
      const def = xml.match(/<default>([\s\S]*?)<\/default>/)
      const shift = [...xml.matchAll(/<case\b([^>]*)>([\s\S]*?)<\/case>/g)]
        .find(([, attrs]) => /alphabet(Manual|Automatic)?Shifted/.test(attrs))
      const row = keySpecs(def ? def[1] : xml)
      if (!row.length) continue
      normal.push(row)
      shifted.push(shift ? keySpecs(shift[2]) : row)
    }
    if (!normal.length) return null
    const hasShift = shifted.some((row, i) => row.join() !== normal[i].join())
    return { normal, shifted: hasShift ? shifted : null }
  }

  // What each key or short key sequence types, and a few worked combinations.
  function transliteration (method) {
    const id = `app:${method}`
    const cache = new Map()
    const out = (keys) => {
      if (!cache.has(keys)) {
        const steps = ime.type(id, keys)
        for (let i = 0; i < keys.length; i++) cache.set(keys.slice(0, i + 1), steps[i])
      }
      return cache.get(keys)
    }
    const mappings = []
    for (const k of PRINTABLE) {
      const o = out(k)
      if (o !== k && o !== '') mappings.push({ keys: k, out: o })
    }
    const pairs = []
    for (const x of PAIR_FIRST) {
      for (const y of PAIR_SECOND) {
        const xy = x + y
        const o = out(xy)
        if (!combines(o, out(x), out(y))) continue
        if (isConsonantKey(x) && VOWELS.has(y)) continue
        pairs.push({ keys: xy, out: o })
      }
    }
    const triples = []
    for (const p of pairs) {
      if (!LETTERS.includes(p.keys[0])) continue
      for (const z of LETTERS) {
        const xyz = p.keys + z
        const o = out(xyz)
        if (!combines(o, p.out, out(z))) continue
        if (VOWELS.has(z) && isConsonantKey(p.keys[1])) continue
        triples.push({ keys: xyz, out: o })
      }
    }
    mappings.push(...pairs, ...triples)
    mappings.sort((a, b) => a.keys.toLowerCase().localeCompare(b.keys.toLowerCase()) || a.keys.length - b.keys.length || a.keys.localeCompare(b.keys))

    return {
      mappings: mappings.map((m) => ({ keys: m.keys, out: display(m.out) })),
      rules: patternRules(appMethod(method))
    }
  }

  // Rules that work on whatever is already typed: the input has a class or group and the
  // replacement puts the captured text back ($1). Listed in file order, since the first match wins,
  // each with a worked example built from the rule itself.
  function patternRules (definition) {
    if (!definition) return []
    const visible = (s) => s.replace(/\u200c/g, '‹ZWNJ›').replace(/\u200d/g, '‹ZWJ›')
    return definition.patterns
      .filter((rule) => /[[(]/.test(rule[0]) && /\$\d/.test(rule[rule.length - 1]))
      .map((rule) => {
        const [input, replacement] = [rule[0], rule[rule.length - 1]]
        const context = rule.length === 3 ? rule[1] : null
        const sample = sampleRegex(input)
        const re = new RegExp(input + '$')
        let example = null
        // The typed keys at the end of the sample; Space and Enter are named.
        const typed = sample ? (sample.match(/[\x21-\x7e]+$|[ \r\n]$/) || [''])[0] : ''
        const keyName = { ' ': 'Space', '\r': 'Enter', '\n': 'Enter' }[typed] || typed
        if (sample && typed && re.test(sample)) {
          example = {
            before: visible(sample.slice(0, sample.length - typed.length)),
            keys: keyName,
            after: visible(sample.replace(re, replacement))
          }
        }
        return { input: visible(input), replacement: visible(replacement), context: context && visible(context), example }
      })
  }

  function reference (subtype, isPredictive) {
    const key = subtype.method || subtype.layoutSet || subtype.locale
    if (meta.layoutReferences && meta.layoutReferences[key]) return meta.layoutReferences[key]
    if (isPredictive) return { label: 'Varnam', url: 'https://github.com/varnamproject/govarnam' }
    const source = subtype.method && ime.sourceOf(subtype.method)
    if (source) {
      return {
        label: `jQuery.IME ${subtype.method}`,
        url: `https://github.com/wikimedia/jquery.ime/blob/${imeCommit || 'master'}/${source}`
      }
    }
    return null
  }

  function typeOf (subtype, name) {
    if (subtype.method.startsWith('varnam-')) return 'Predictive'
    if (subtype.method && subtype.layoutSet === 'qwerty') return 'Transliteration'
    if (/inscript/i.test(name)) return 'Inscript'
    if (/compact/i.test(name)) return 'Compact'
    if (/phonetic/i.test(name)) return 'Phonetic'
    return 'Other'
  }

  // Everything a layout page needs for one subtype.
  function build (subtype, { language, languageName, name, isNew, usedSlugs }) {
    const isPredictive = subtype.method.startsWith('varnam-')
    const isTransliteration = !!subtype.method && !isPredictive && subtype.layoutSet === 'qwerty'
    const layoutSet = subtype.layoutSet || (subtype.locale === 'en_US' ? 'qwerty' : languageName.toLowerCase())
    const rules = subtype.method && !isPredictive ? appMethod(subtype.method) : null
    if (subtype.method && !isPredictive && !rules) warn(`no rules file for ${subtype.method}`)

    let slug = slugify(subtype.method || subtype.layoutSet || subtype.locale)
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(subtype.method || subtype.layoutSet || subtype.locale)}-${n}`
    usedSlugs.add(slug)

    const detail = isTransliteration && rules ? transliteration(subtype.method) : { mappings: null, rules: null }

    return {
      id: subtype.method || subtype.layoutSet || subtype.locale,
      slug,
      url: `/languages/${language}/${slug}.html`,
      name,
      type: typeOf(subtype, name),
      isNew,
      reference: reference(subtype, isPredictive),
      keyboard: isTransliteration || isPredictive ? null : keyboard(layoutSet),
      ...detail
    }
  }

  return { build, imeCommit }
}

module.exports = { createLayoutBuilder }
