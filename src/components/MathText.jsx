import katex from 'katex'
import 'katex/dist/katex.min.css'

// Patterns that indicate LaTeX math content
const LATEX_PATTERNS = [
  /\\frac\s*\{/,
  /\\sqrt\s*[\[{]/,
  /\\int\b/,
  /\\sum\b/,
  /\\lim\b/,
  /\\infty\b/,
  /\\alpha\b/,
  /\\beta\b/,
  /\\theta\b/,
  /\\pi\b/,
  /\\times\b/,
  /\\div\b/,
  /\\leq\b/,
  /\\geq\b/,
  /\\neq\b/,
  /\\cdot\b/,
  /\\left[\s([|]/,
  /\\right[\s)\]|]/,
  /\\begin\{/,
  /\\overline\{/,
  /\\vec\{/,
  /\\hat\{/,
  /\^[\{0-9]/,
  /_[\{0-9]/,
]

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

  // Handle $$...$$ display math first
  const displayParts = text.split(/(\$\$[^$]+\$\$)/g)

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
