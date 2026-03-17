import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

export default function MathText({ text }) {
  if (!text) return null

  // Split text by $...$ patterns for inline math
  const parts = text.split(/(\$[^$]+\$)/g)

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1)
          return <InlineMath key={i} math={math} />
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}