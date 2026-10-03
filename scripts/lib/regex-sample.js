// Builds one string that a jquery.ime rule pattern matches, to show the rule with a concrete
// example. It takes the first option everywhere (first character of a class, first branch of
// an alternation) and repeats quantified parts once, so optional groups are included.
// Covers the regex features the rule files use; callers check the result really matches.

const PRINTABLE = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i))

function parse (src) {
  let i = 0
  const peek = () => src[i]
  const next = () => src[i++]

  function alternation () {
    const branches = [sequence()]
    while (peek() === '|') {
      next()
      branches.push(sequence())
    }
    return { type: 'alt', branches }
  }

  function sequence () {
    const items = []
    while (i < src.length && peek() !== '|' && peek() !== ')') {
      const node = atom()
      if (node) items.push(quantified(node))
    }
    return { type: 'seq', items }
  }

  function quantified (node) {
    let min = 1
    let max = 1
    const c = peek()
    if (c === '?') { next(); min = 0; max = 1 } else if (c === '*') { next(); min = 0; max = Infinity } else if (c === '+') { next(); min = 1; max = Infinity } else if (c === '{' && /^\{\d+(,\d*)?\}/.test(src.slice(i))) {
      const m = src.slice(i).match(/^\{(\d+)(,(\d*))?\}/)
      i += m[0].length
      min = Number(m[1])
      max = m[2] ? (m[3] ? Number(m[3]) : Infinity) : min
    } else return node
    if (peek() === '?') next()
    return { type: 'repeat', node, min, max }
  }

  function escape () {
    const c = next()
    if (c === 'd') return { type: 'set', chars: ['0'] }
    if (c === 'w') return { type: 'set', chars: ['a'] }
    if (c === 's') return { type: 'set', chars: [' '] }
    if (c === 'r' || c === 'n' || c === 't') return { type: 'char', value: { r: '\r', n: '\n', t: '\t' }[c] }
    if (c === 'u') {
      const hex = src.slice(i, i + 4)
      i += 4
      return { type: 'char', value: String.fromCharCode(parseInt(hex, 16)) }
    }
    return { type: 'char', value: c }
  }

  function charClass () {
    let negated = false
    if (peek() === '^') { next(); negated = true }
    const chars = []
    const readOne = () => {
      const c = next()
      if (c !== '\\') return c
      const e = next()
      return e === 'u' ? String.fromCharCode(parseInt(src.slice(i, (i += 4)), 16)) : e
    }
    let first = true
    while (i < src.length && (peek() !== ']' || first)) {
      first = false
      const a = readOne()
      if (peek() === '-' && src[i + 1] !== ']' && src[i + 1] !== undefined) {
        next()
        const b = readOne()
        for (let code = a.charCodeAt(0); code <= b.charCodeAt(0); code++) chars.push(String.fromCharCode(code))
      } else chars.push(a)
    }
    next()
    if (!negated) return { type: 'set', chars }
    // For "anything but these", prefer a nearby letter of the same script (ഹ for [^സ]).
    const near = []
    for (const c of chars) {
      for (const d of [-1, 1, -2, 2, -3, 3]) near.push(String.fromCharCode(c.charCodeAt(0) + d))
    }
    const pick = near.filter((c) => !chars.includes(c) && /\p{L}/u.test(c))
    return { type: 'set', chars: pick.length ? pick : PRINTABLE.filter((c) => !chars.includes(c) && /[a-z]/.test(c)) }
  }

  function atom () {
    const c = next()
    if (c === '(') {
      if (src.startsWith('?:', i)) i += 2
      const inner = alternation()
      next()
      return inner
    }
    if (c === '[') return charClass()
    if (c === '\\') return escape()
    if (c === '^' || c === '$') return null
    if (c === '.') return { type: 'set', chars: ['a'] }
    return { type: 'char', value: c }
  }

  return alternation()
}

function generate (node) {
  switch (node.type) {
    case 'alt': return generate(node.branches[0])
    case 'seq': return node.items.map(generate).join('')
    case 'repeat': return generate(node.node).repeat(Math.max(node.min, 1))
    case 'set': return node.chars[0] || ''
    case 'char': return node.value
    default: return ''
  }
}

function sampleRegex (pattern) {
  try {
    return generate(parse(pattern))
  } catch (e) {
    return null
  }
}

module.exports = { sampleRegex }
