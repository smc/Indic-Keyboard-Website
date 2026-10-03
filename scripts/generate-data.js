#!/usr/bin/env node
// Builds src/_data/home.json and src/_data/layouts.json from a local checkout of the
// Indic Keyboard app.
//
//   INDIC_KEYBOARD_REPO=~/git/indic-keyboard npm run data
//
// Anything the app does not describe (English names, regions, some layout
// names, hero choices) comes from data/meta.json. The script prints
// a warning for every language or layout it could not name, so new additions
// in the app show up here as a to-do list.

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { createLayoutBuilder } = require('./lib/layouts')

const SITE = path.resolve(__dirname, '..')
const META_FILE = path.join(SITE, 'data/meta.json')
const OUT_FILE = path.join(SITE, 'src/_data/home.json')
const LAYOUTS_FILE = path.join(SITE, 'src/_data/layouts.json')

const repoArg = process.env.INDIC_KEYBOARD_REPO
if (!repoArg) {
  console.error('Set INDIC_KEYBOARD_REPO to your local indic-keyboard checkout.')
  process.exit(1)
}
const REPO = path.resolve(repoArg.replace(/^~(?=$|\/)/, process.env.HOME))
const XML_DIR = path.join(REPO, 'java/res/xml')
const RULES_DIR = path.join(REPO, 'ime/src/main/res/raw')
const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8'))
const compareRef = process.env.INDIC_KEYBOARD_COMPARE_REF || meta.compareRef

const warnings = []
const warn = (msg) => warnings.push(msg)

// Every Unicode script, found by asking the regex engine which four-letter codes
// \p{Script=...} accepts. Latin, Common, Inherited and Unknown characters are ignored when reading
// keys, since transliteration layouts have Latin keys; English is counted as Latin on its own.
const IGNORED_SCRIPTS = new Set(['Latn', 'Zyyy', 'Zinh', 'Zzzz'])
let unicodeScripts = null
function allUnicodeScripts () {
  if (unicodeScripts) return unicodeScripts
  unicodeScripts = []
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = upper.toLowerCase()
  for (const a of upper) for (const b of lower) for (const c of lower) for (const d of lower) {
    const code = a + b + c + d
    if (IGNORED_SCRIPTS.has(code)) continue
    try {
      unicodeScripts.push({ code, re: new RegExp(`^\\p{Script=${code}}$`, 'u') })
    } catch (e) {}
  }
  return unicodeScripts
}
const charScripts = new Map()
function scriptOf (ch) {
  if (!charScripts.has(ch)) {
    const hit = allUnicodeScripts().find((s) => s.re.test(ch))
    charScripts.set(ch, hit ? hit.code : null)
  }
  return charScripts.get(ch)
}
const scriptDisplayNames = new Intl.DisplayNames(['en'], { type: 'script' })
const scriptDirection = (code) => {
  const locale = new Intl.Locale('und', { script: code })
  return (locale.getTextInfo ? locale.getTextInfo() : locale.textInfo).direction
}

const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

const stripComments = (xml) => xml.replace(/<!--[\s\S]*?-->/g, '')
const attr = (block, name) => {
  const m = block.match(new RegExp(`${name}="([^"]*)"`))
  return m ? m[1] : ''
}
const extra = (value, key) => {
  const m = value.match(new RegExp(`(?:^|,)${key}=([^,]+)`))
  return m ? m[1] : ''
}
const isLatinText = (s) => /^[A-Za-z0-9][A-Za-z0-9 .()'-]*$/.test(s)
const displayScript = (code) => meta.scriptNames[code] || scriptDisplayNames.of(code)

function parseSubtypes (xml) {
  return [...stripComments(xml).matchAll(/<subtype\b([\s\S]*?)\/>/g)].map(([, block]) => {
    const ev = attr(block, 'android:imeSubtypeExtraValue')
    const locale = attr(block, 'android:imeSubtypeLocale')
    return {
      locale,
      language: locale.split('_')[0],
      label: attr(block, 'android:label').replace('@string/', ''),
      layoutSet: extra(ev, 'KeyboardLayoutSet'),
      method: extra(ev, 'TransliterationMethod')
    }
  })
}
// Locale suffixes like _IN_Deva change without the layout changing, so compare by language.
const subtypeKey = (s) => [s.language, s.layoutSet, s.method].join('|')
const layoutKey = (s) => s.method || s.layoutSet || s.locale

function readStrings () {
  const xml = fs.readFileSync(path.join(REPO, 'java/res/values/keyboard_names.xml'), 'utf8')
  const out = {}
  for (const [, name, value] of xml.matchAll(/<string name="([^"]+)"[^>]*>([\s\S]*?)<\/string>/g)) {
    out[name] = decode(value).replace(/[‎‏]/g, '').trim()
  }
  return out
}

// Follow @xml/ includes from a layout set down to its rowkeys_* files.
function rowkeyFiles (layoutSet) {
  const seen = new Set()
  const found = []
  const visit = (name) => {
    if (seen.has(name)) return
    seen.add(name)
    const file = path.join(XML_DIR, `${name}.xml`)
    if (!fs.existsSync(file)) return
    if (name.startsWith('rowkeys_')) found.push(file)
    const xml = stripComments(fs.readFileSync(file, 'utf8'))
    for (const [, ref] of xml.matchAll(/@xml\/([a-z0-9_]+)/g)) {
      if (/^(kbd|rows|rowkeys)_/.test(ref)) visit(ref)
    }
  }
  visit(`keyboard_layout_set_${layoutSet}`)
  return found
}

const keySpecs = (xml) => [...xml.matchAll(/latin:keySpec="([^"]*)"/g)]
  .map(([, spec]) => spec)
  .filter((spec) => spec && !spec.startsWith('!'))
  .map((spec) => decode(spec.split('|')[0] || spec.split('|')[1] || '').replace(/\\(.)/g, '$1'))
  .filter(Boolean)

function dominantScript (text) {
  const counts = {}
  for (const ch of text) {
    const code = scriptOf(ch)
    if (code) counts[code] = (counts[code] || 0) + 1
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return top ? top[0] : null
}

function layoutScript (s, languageName) {
  // Predictive (Varnam) layouts use QWERTY keys but type the language's own script.
  if (s.method.startsWith('varnam-')) return null
  if (s.method) {
    const file = path.join(RULES_DIR, `${s.method.toLowerCase().replace(/-/g, '_')}.xml`)
    if (!fs.existsSync(file)) return null
    const out = [...fs.readFileSync(file, 'utf8').matchAll(/replacement="([^"]*)"/g)].map((m) => decode(m[1])).join('')
    return dominantScript(out)
  }
  // Subtypes without a KeyboardLayoutSet use the set named after the language (ar uses arabic).
  const set = s.layoutSet || languageName.toLowerCase()
  // A plain QWERTY layout (English) types Latin.
  if (set === 'qwerty' || set === 'english') return 'Latn'
  const text = rowkeyFiles(set).map((f) => keySpecs(fs.readFileSync(f, 'utf8')).join('')).join('')
  return dominantScript(text)
}

function layoutName (s, strings) {
  const key = layoutKey(s)
  if (meta.layouts[key]) return { name: meta.layouts[key], known: true }
  if (s.method.startsWith('varnam-')) return { name: 'Predictive', known: true }
  if (/-transliteration$/.test(s.method)) return { name: 'Transliteration', known: true }
  const label = strings[s.label] || ''
  const right = label.includes(' - ') ? label.split(' - ').slice(1).join(' - ').trim() : ''
  if (right && isLatinText(right)) return { name: right, known: true }
  if (/_inscript$/.test(s.layoutSet)) return { name: 'Inscript', known: true }
  const trailing = label.match(/\s([A-Z][A-Za-z ]+)$/)
  if (trailing) return { name: trailing[1].trim(), known: true }
  warn(`layout "${key}" (${s.locale}) has no English name; add it to meta.layouts`)
  return { name: key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), known: false }
}

function oldSubtypes () {
  try {
    const xml = execFileSync('git', ['-C', REPO, 'show', `${compareRef}:java/res/xml/method.xml`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return parseSubtypes(xml)
  } catch (e) {
    warn(`could not read method.xml at "${compareRef}"; nothing is marked new`)
    return null
  }
}

// Screenshots of real keyboards for the home page hero, named in meta.hero.
function heroKeyboards (languages) {
  return meta.hero.map(({ language, layout, image }) => {
    const lang = languages.find((l) => l.code === language)
    const entry = lang && lang.layouts.find((l) => l.id === layout)
    if (!entry) {
      warn(`hero layout "${layout}" for "${language}" not found`)
      return null
    }
    if (!image || !fs.existsSync(path.join(SITE, 'src/static', image))) {
      warn(`hero screenshot "${image}" for "${language}" is missing from src/static`)
      return null
    }
    return {
      language,
      name: lang.name,
      native: lang.native,
      dir: lang.dir,
      layout: entry.known ? entry.name : '',
      image
    }
  }).filter(Boolean)
}

function main () {
  const strings = readStrings()
  const subtypes = parseSubtypes(fs.readFileSync(path.join(XML_DIR, 'method.xml'), 'utf8'))
  const old = oldSubtypes()
  const oldKeys = old && new Set(old.map(subtypeKey))
  const oldLanguages = old && new Set(old.map((s) => s.language))
  const englishName = new Intl.DisplayNames(['en'], { type: 'language' })
  const layoutBuilder = createLayoutBuilder({ repo: REPO, xmlDir: XML_DIR, rulesDir: RULES_DIR, meta, decode, stripComments, rowkeyFiles, keySpecs, warn })

  const byLanguage = new Map()
  for (const s of subtypes) {
    if (!byLanguage.has(s.language)) byLanguage.set(s.language, [])
    byLanguage.get(s.language).push(s)
  }

  const allScripts = new Set()
  // A script is new when every layout that types it, native or transliterated, is new.
  const scriptLayouts = new Map()
  const languages = [...byLanguage.entries()].map(([code, subs]) => {
    const m = meta.languages[code] || {}
    if (!meta.languages[code]) warn(`language "${code}" is missing from meta.languages`)
    const intlName = englishName.of(code)
    const name = m.name || (intlName !== code ? intlName : code)
    if (name === code) warn(`language "${code}" has no English name; add "name" in meta.languages`)
    const scripts = new Set()
    const usedSlugs = new Set()
    const layouts = subs.map((s) => {
      const script = layoutScript(s, name)
      if (script) {
        scripts.add(script)
        if (!s.method) allScripts.add(script)
        if (!scriptLayouts.has(script)) scriptLayouts.set(script, [])
        scriptLayouts.get(script).push(!!oldKeys && !oldKeys.has(subtypeKey(s)))
      }
      const { name: layoutLabel, known } = layoutName(s, strings)
      const isNew = !!oldKeys && !oldKeys.has(subtypeKey(s))
      return {
        id: layoutKey(s),
        layoutSet: s.layoutSet,
        name: layoutLabel,
        known,
        isNew,
        detail: layoutBuilder.build(s, { language: code, languageName: name, name: layoutLabel, isNew, usedSlugs })
      }
    })
    const primary = [...scripts][0]
    return {
      code,
      name,
      native: m.native || name,
      dir: primary ? scriptDirection(primary) : 'ltr',
      region: m.region || 'beyond',
      scripts: [...scripts].map(displayScript),
      isNew: !!oldLanguages && !oldLanguages.has(code),
      layouts
    }
  }).sort((a, b) => a.name.localeCompare(b.name))

  const commit = execFileSync('git', ['-C', REPO, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
  const data = {
    source: { commit, comparedWith: old ? compareRef : null },
    stats: {
      languages: languages.length,
      layouts: subtypes.length,
      scripts: allScripts.size,
      newLanguages: languages.filter((l) => l.isNew).length,
      newLayouts: languages.reduce((n, l) => n + l.layouts.filter((x) => x.isNew).length, 0),
      newScripts: [...scriptLayouts.values()].filter((flags) => flags.every(Boolean)).length
    },
    scripts: [...allScripts].map(displayScript).sort(),
    newScripts: [...scriptLayouts.entries()].filter(([, flags]) => flags.every(Boolean)).map(([name]) => displayScript(name)).sort(),
    languages: languages.map(({ layouts, ...l }) => ({
      ...l,
      layouts: layouts.map(({ layoutSet, known, detail, ...x }) => ({ ...x, url: detail.url }))
    })),
    hero: heroKeyboards(languages)
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2) + '\n')

  const layoutData = {
    source: { commit, jqueryIme: layoutBuilder.imeCommit },
    languages: languages.map(({ code, name, native, dir, scripts, isNew, layouts }) => ({
      code, name, native, dir, scripts, isNew, layouts: layouts.map((x) => x.detail)
    }))
  }
  fs.writeFileSync(LAYOUTS_FILE, JSON.stringify(layoutData) + '\n')
  const all = layoutData.languages.flatMap((l) => l.layouts)
  console.log(`Wrote ${path.relative(SITE, LAYOUTS_FILE)}: ${all.length} layouts, ` +
    `${all.filter((x) => x.mappings).length} with key mappings, ${all.filter((x) => x.keyboard).length} with keyboards, ` +
    `${all.filter((x) => x.reference).length} with a reference.`)
  console.log(`Wrote ${path.relative(SITE, OUT_FILE)} from ${commit}: ` +
    `${data.stats.languages} languages, ${data.stats.layouts} layouts, ${data.stats.scripts} scripts ` +
    `(${data.stats.newLanguages} new languages, ${data.stats.newLayouts} new layouts since ${compareRef}).`)
  for (const w of warnings) console.warn(`warning: ${w}`)
}

main()
