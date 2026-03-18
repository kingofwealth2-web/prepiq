import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const MESSAGES = {
  '/dashboard': ['Welcome back! Ready to study?', 'Your streak is on the line — let\'s go!', 'What are we studying today?'],
  '/practice': ['Pick a question and let\'s go!', 'Every question makes you smarter!', 'You\'ve got this!'],
  '/question': ['Take your time and think it through.', 'Read carefully — eliminate wrong options first!', 'You can do it!'],
  '/mock': ['Mock exams build exam confidence!', 'Simulate the real thing — full focus!', 'Let\'s see what you know!'],
  '/plan': ['Consistency beats cramming — every time!', 'Small steps daily lead to big results!', 'Stay on track!'],
  '/flashcards': ['Repetition is the mother of learning!', 'Flashcards are proven to help memory!', 'Keep flipping!'],
  '/game': ['Let\'s play! Fast answers get bonus points!', 'Streaks give you extra points — stay sharp!', 'Game on!'],
  '/performance': ['Every data point is progress!', 'Knowing your weakness is strength!', 'Track it, fix it, ace it!'],
  '/predictions': ['These topics are your best bets!', 'Focus on high-probability topics!', 'Smart preparation wins!'],
  default: ['Keep studying — you\'re making progress!', 'PrepIQ is here to help you pass!', 'Believe in yourself!'],
}

export default function Ama() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [minimized, setMinimized] = useState(false)
  const [bubbleVisible, setBubbleVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(true); showMessage() }, 2000)
    return () => clearTimeout(timer)
  }, [location.pathname])

  useEffect(() => {
    const interval = setInterval(() => { if (!minimized) showMessage() }, 30000)
    return () => clearInterval(interval)
  }, [location.pathname, minimized])

  function showMessage() {
    const path = location.pathname
    const key = Object.keys(MESSAGES).find(k => path.startsWith(k) && k !== 'default') || 'default'
    const msgs = MESSAGES[key]
    const msg = msgs[Math.floor(Math.random() * msgs.length)]
    setMessage(msg)
    setBubbleVisible(true)
    setTimeout(() => setBubbleVisible(false), 5000)
  }

  if (!visible) return null

  if (minimized) return (
    <div style={s.minimizedBtn} onClick={() => setMinimized(false)} title="Chat with Ama">
      <AmaFace size={36} />
    </div>
  )

  return (
    <div style={s.container}>
      {bubbleVisible && message && (
        <div style={s.bubble}>
          <div style={s.bubbleText}>{message}</div>
          <div style={s.bubbleTail} />
        </div>
      )}
      <div style={s.amaWrap}>
        <button style={s.minimizeBtn} onClick={() => setMinimized(true)} title="Minimise">−</button>
        <div style={s.amaBody} onClick={showMessage}>
          <AmaFace size={54} />
          <div style={s.amaName}>Ama</div>
        </div>
      </div>
    </div>
  )
}

function AmaFace({ size }) {
  const sc = size / 54
  return (
    <div style={{ width: size, height: size, position: 'relative', cursor: 'pointer' }}>
      {/* Head */}
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#C68642', border: `${2 * sc}px solid #A0522D`, position: 'relative', overflow: 'hidden', boxShadow: `0 ${3 * sc}px ${10 * sc}px rgba(26,18,8,0.25)` }}>
        {/* Hair */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${size * 0.32}px`, background: '#1A0A00', borderRadius: `${size}px ${size}px 0 0` }} />
        {/* Eyes */}
        <div style={{ position: 'absolute', top: `${size * 0.38}px`, left: `${size * 0.24}px`, width: `${7 * sc}px`, height: `${7 * sc}px`, background: '#1A0A00', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: `${size * 0.38}px`, right: `${size * 0.24}px`, width: `${7 * sc}px`, height: `${7 * sc}px`, background: '#1A0A00', borderRadius: '50%' }} />
        {/* Smile */}
        <div style={{ position: 'absolute', bottom: `${size * 0.22}px`, left: '50%', transform: 'translateX(-50%)', width: `${16 * sc}px`, height: `${8 * sc}px`, borderBottom: `${2.5 * sc}px solid #7B3F00`, borderLeft: `${2.5 * sc}px solid #7B3F00`, borderRight: `${2.5 * sc}px solid #7B3F00`, borderRadius: `0 0 ${9 * sc}px ${9 * sc}px` }} />
      </div>
    </div>
  )
}

const s = {
  container: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', pointerEvents: 'none' },
  bubble: { background: '#fff', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-lg)', padding: '10px 14px', maxWidth: '200px', position: 'relative', pointerEvents: 'auto', animation: 'fadeIn 0.3s ease', boxShadow: 'var(--shadow-md)' },
  bubbleText: { fontSize: '0.8rem', color: 'var(--ink)', lineHeight: 1.45 },
  bubbleTail: { position: 'absolute', bottom: '-7px', right: '22px', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid var(--border-mid)' },
  amaWrap: { position: 'relative', pointerEvents: 'auto' },
  minimizeBtn: { position: 'absolute', top: '-7px', right: '-7px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', border: '1px solid var(--border-mid)', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, lineHeight: 1, boxShadow: 'var(--shadow-sm)' },
  amaBody: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  amaName: { fontSize: '0.62rem', fontWeight: '700', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  minimizedBtn: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, cursor: 'pointer', filter: 'drop-shadow(0 3px 8px rgba(26,18,8,0.2))' },
}
