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
  const [mood, setMood] = useState('happy') // happy | thinking | celebrating | concerned
  const [minimized, setMinimized] = useState(false)
  const [bubbleVisible, setBubbleVisible] = useState(false)

  useEffect(() => {
    // Show Ama after 2 seconds on each page
    const timer = setTimeout(() => {
      setVisible(true)
      showMessage()
    }, 2000)
    return () => clearTimeout(timer)
  }, [location.pathname])

  useEffect(() => {
    // Change message every 30 seconds
    const interval = setInterval(() => {
      if (!minimized) showMessage()
    }, 30000)
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
      <AmaFace mood="happy" size={36} />
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
        <button style={s.minimizeBtn} onClick={() => setMinimized(true)} title="Minimize">−</button>
        <div style={s.amaBody} onClick={showMessage}>
          <AmaFace mood={mood} size={56} />
          <div style={s.amaName}>Ama</div>
        </div>
      </div>
    </div>
  )
}

function AmaFace({ mood, size }) {
  const s2 = size / 56
  return (
    <div style={{ width: size, height: size, position: 'relative', cursor: 'pointer' }}>
      {/* Head */}
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: '#F5CBA7',
        border: `${2 * s2}px solid #E59866`,
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 ${4 * s2}px ${12 * s2}px rgba(0,0,0,0.3)`
      }}>
        {/* Hair */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: `${size * 0.35}px`,
          background: '#2C1810',
          borderRadius: `${size}px ${size}px 0 0`
        }} />
        {/* Eyes */}
        <div style={{ position: 'absolute', top: `${size * 0.38}px`, left: `${size * 0.22}px`, width: `${8 * s2}px`, height: mood === 'thinking' ? `${6 * s2}px` : `${8 * s2}px`, background: '#2C1810', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: `${size * 0.38}px`, right: `${size * 0.22}px`, width: `${8 * s2}px`, height: mood === 'thinking' ? `${6 * s2}px` : `${8 * s2}px`, background: '#2C1810', borderRadius: '50%' }} />
        {/* Mouth */}
        {mood === 'happy' || mood === 'celebrating' ? (
          <div style={{ position: 'absolute', bottom: `${size * 0.22}px`, left: '50%', transform: 'translateX(-50%)', width: `${18 * s2}px`, height: `${9 * s2}px`, borderBottom: `${3 * s2}px solid #C0392B`, borderLeft: `${3 * s2}px solid #C0392B`, borderRight: `${3 * s2}px solid #C0392B`, borderRadius: `0 0 ${10 * s2}px ${10 * s2}px` }} />
        ) : mood === 'concerned' ? (
          <div style={{ position: 'absolute', bottom: `${size * 0.22}px`, left: '50%', transform: 'translateX(-50%)', width: `${16 * s2}px`, height: `${8 * s2}px`, borderTop: `${3 * s2}px solid #C0392B`, borderLeft: `${3 * s2}px solid #C0392B`, borderRight: `${3 * s2}px solid #C0392B`, borderRadius: `${10 * s2}px ${10 * s2}px 0 0` }} />
        ) : (
          <div style={{ position: 'absolute', bottom: `${size * 0.25}px`, left: '50%', transform: 'translateX(-50%)', width: `${14 * s2}px`, height: `${3 * s2}px`, background: '#C0392B', borderRadius: `${2 * s2}px` }} />
        )}
        {/* Celebrating star */}
        {mood === 'celebrating' && (
          <div style={{ position: 'absolute', top: `${4 * s2}px`, right: `${4 * s2}px`, fontSize: `${12 * s2}px` }}>⭐</div>
        )}
      </div>
    </div>
  )
}

const s = {
  container: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', pointerEvents: 'none' },
  bubble: { background: '#161B22', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '14px', padding: '10px 14px', maxWidth: '200px', position: 'relative', pointerEvents: 'auto', animation: 'fadeIn 0.3s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },
  bubbleText: { fontSize: '0.82rem', color: '#F0F6FC', lineHeight: '1.4' },
  bubbleTail: { position: 'absolute', bottom: '-8px', right: '24px', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid rgba(240,165,0,0.3)' },
  amaWrap: { position: 'relative', pointerEvents: 'auto' },
  minimizeBtn: { position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', background: '#1C2330', border: '1px solid rgba(240,246,252,0.1)', color: '#8B949E', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, lineHeight: 1 },
  amaBody: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  amaName: { fontSize: '0.65rem', fontWeight: '600', color: '#F0A500', letterSpacing: '0.06em', textTransform: 'uppercase' },
  minimizedBtn: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, cursor: 'pointer', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' },
}