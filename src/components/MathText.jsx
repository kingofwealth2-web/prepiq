import katex from 'katex'
import 'katex/dist/katex.min.css'

const LATEX_PATTERNS = [
  /\\frac\s*\{/,
  /\\sqrt\s*[\[{]/,
  /\\int\b/,
  /\\sum\b/,
  /\\lim\b/,
  /\\infty\b/,
  /\\alpha\b/,
  /\\beta\b/,
  /\\gamma\b/,
  /\\delta\b/,
  /\\theta\b/,
  /\\pi\b/,
  /\\sigma\b/,
  /\\omega\b/,
  /\\lambda\b/,
  /\\mu\b/,
  /\\times\b/,
  /\\div\b/,
  /\\leq\b/,
  /\\geq\b/,
  /\\neq\b/,
  /\\cdot\b/,
  /\\pm\b/,
  /\\left[\s([|]/,
  /\\right[\s)\]|]/,
  /\\begin\{/,
  /\\overline\{/,
  /\\vec\{/,
  /\\hat\{/,
  /\\text\{/,
  /\\mathrm\{/,
  /\^[\{0-9]/,
  /_[\{0-9]/,
]

// Fix mangled LaTeX — databases sometimes store \frac as a form-feed char (ASCII 12)
// or as \\frac (double-escaped). This restores them to proper \frac for KaTeX.
function sanitizeLatex(str) {
  if (!str) return str
  return str
    // Form feed char \f (ASCII 12) + "rac" → \frac
    .replace(/\frac/g, '\\frac')
    // Other common form-feed manglings
    .replace(/\u000crac/g, '\\frac')
    // Double-escaped backslashes from JSON → single backslash
    .replace(/\\\\([a-zA-Z])/g, '\\$1')
}

function containsLatex(str) {
  return LATEX_PATTERNS.some(p => p.test(str))
}

function renderMath(math, displayMode = false) {
  try {
    return katex.renderToString(math, {
      throwOnError: false,
      displayMode,
      trust: true,
      strict: false,
    })
  } catch {
    return null
  }
}

export default function MathText({ text }) {
  if (!text) return null

  // Sanitize before any processing
  const clean = sanitizeLatex(text)

  // Handle $$...$$ display math first
  const displayParts = clean.split(/(\$\$[^$]+\$\$)/g)

  const rendered = displayParts.flatMap((part, i) => {
    // Display math block $$...$$
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
      const math = part.slice(2, -2)
      const html = renderMath(math, true)
      if (html) return [<span key={`d${i}`} dangerouslySetInnerHTML={{ __html: html }} />]
      return [<span key={`d${i}`}>{part}</span>]
    }

    // Split by inline $...$
    const inlineParts = part.split(/(\$[^$]+\$)/g)

    return inlineParts.map((chunk, j) => {
      // Inline math $...$
      if (chunk.startsWith('$') && chunk.endsWith('$') && chunk.length > 2) {
        const math = chunk.slice(1, -1)
        const html = renderMath(math, false)
        if (html) return <span key={`${i}-${j}`} dangerouslySetInnerHTML={{ __html: html }} />
        return <span key={`${i}-${j}`}>{chunk}</span>
      }

      // Raw LaTeX without delimiters (e.g. \frac{1}{x^2} stored directly)
      if (containsLatex(chunk)) {
        const html = renderMath(chunk, false)
        if (html) return <span key={`${i}-${j}`} dangerouslySetInnerHTML={{ __html: html }} />
      }

      return <span key={`${i}-${j}`}>{chunk}</span>
    })
  })

  return <span>{rendered}</span>
}