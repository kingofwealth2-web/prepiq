import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function MathText({ text }) {
  if (!text) return null

  const parts = text.split(/(\$[^$]+\$)/g)

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const math = part.slice(1, -1)
          try {
            const html = katex.renderToString(math, {
              throwOnError: false,
              displayMode: false,
            })
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
          } catch {
            return <span key={i}>{part}</span>
          }
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}