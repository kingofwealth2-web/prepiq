import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { gemini, parseJSON } from '../lib/gemini'
import { supabase } from '../lib/supabase'
import PremiumGate from '../components/PremiumGate'

// Inject flip CSS into the document head once
const FLIP_STYLE = `
.fc-scene { perspective: 1200px; cursor: pointer; }
.fc-card {
  position: relative;
  width: 100%;
  height: 280px;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}
.fc-card.flipped { transform: rotateY(180deg); }
.fc-face {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
.fc-front {
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: none;
}
.fc-back {
  background: var(--surface-solid);
  border: 1px solid rgba(200,136,10,0.2);
  transform: rotateY(180deg);
}
`

if (typeof document !== 'undefined' && !document.getElementById('fc-styles')) {
  const el = document.createElement('style')
  el.id = 'fc-styles'
  el.textContent = FLIP_STYLE
  document.head.appendChild(el)
}

export default function Flashcards() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [cards, setCards] = useState([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [known, setKnown] = useState([])
  const [unknown, setUnknown] = useState([])
  const [finished, setFinished] = useState(false)
  const [user, setUser] = useState(null)
  const [usedSubjects, setUsedSubjects] = useState([])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => { if (u) { const { data: profile } = await supabase.from('users').select('plan').eq('id', u.id).single(); setUser({ ...u, plan: profile?.plan }) } })
  }, [])

  useEffect(() => {
    supabase.from('subjects').select('*').order('name').then(({ data }) => {
      const seen = new Set()
      setSubjects((data || []).filter(s => {
        if (seen.has(s.name)) return false
        seen.add(s.name)
        return true
      }))
    })
  }, [])

  async function generateCards(subject) {
    // Free users limited to 3 subjects per session
    if (user?.plan !== 'premium' && !usedSubjects.includes(subject.id) && usedSubjects.length >= 3) {
      setSelectedSubject(subject)
      setGenerating(false)
      return
    }
    if (!usedSubjects.includes(subject.id)) {
      setUsedSubjects(prev => [...prev, subject.id])
    }
    setSelectedSubject(subject)
    setGenerating(true)
    setCards([])
    setError('')
    setCurrent(0)
    setFlipped(false)
    setKnown([])
    setUnknown([])
    setFinished(false)

    try {
      const { text } = await gemini(
        `Generate 15 flashcards for WASSCE ${subject.name}. Each flashcard should have a key term, definition, or concept that students must know.
Return ONLY a valid JSON array. Each object must have:
{"front":"the term, concept or question","back":"the definition, explanation or answer","topic":"the topic this belongs to"}
Make them genuinely useful for WASSCE exam preparation. Cover different topics within ${subject.name}.`
      )

      const parsed = parseJSON(text)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setError('AI returned invalid data. Please try again.')
        setGenerating(false)
        return
      }
      setCards(parsed)
    } catch (err) {
      console.error('Flashcard generation error:', err)
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Network error. Check your connection and try again.')
      } else {
        setError('Something went wrong generating flashcards. Please try again.')
      }
    }

    setGenerating(false)
  }

  const handleKnow = () => { setKnown(prev => [...prev, cards[current]]); nextCard() }
  const handleDontKnow = () => { setUnknown(prev => [...prev, cards[current]]); nextCard() }
  const nextCard = () => {
    if (current >= cards.length - 1) { setFinished(true) }
    else { setCurrent(c => c + 1); setFlipped(false) }
  }
  const restart = () => { setCurrent(0); setFlipped(false); setKnown([]); setUnknown([]); setFinished(false) }
  const restartWeak = () => { setCards(unknown); setCurrent(0); setFlipped(false); setKnown([]); setUnknown([]); setFinished(false) }

  const subjectIcon = name => {
    if (name.includes('Math')) return '📐'
    if (name.includes('English')) return '📝'
    if (name.includes('Physics')) return '⚡'
    if (name.includes('Chemistry')) return '🧪'
    if (name.includes('Biology')) return '🧬'
    return '📚'
  }

  // Subject picker
  if (!selectedSubject) return (
    <div style={s.shell}>
      <div style={s.header}>
        <div style={s.kente} />
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
          <div style={s.headerTitle}>Flashcards</div>
        </div>
      </div>
      <div style={s.content}>
        <h2 style={s.pageTitle}>Choose a subject</h2>
        <p style={s.pageSub}>AI will generate 15 flashcards for key terms and concepts.</p>
        <div style={s.subjectGrid}>
          {subjects.map(sub => (
            <div key={sub.id} style={s.subjectCard} onClick={() => generateCards(sub)}>
              <div style={s.subjectIcon}>{subjectIcon(sub.name)}</div>
              <div style={s.subjectName}>{sub.name}</div>
              <div style={s.subjectSub}>Generate flashcards →</div>
            </div>
          ))}
        </div>

        {user?.plan !== 'premium' && usedSubjects.length >= 3 && (
          <div style={{ marginTop: '16px' }}>
            <PremiumGate feature="Unlimited flashcard subjects" />
          </div>
        )}
        {user?.plan !== 'premium' && (
          <div style={{ marginTop: '12px', fontSize: '.76rem', color: 'var(--ink-faint)', textAlign: 'center' }}>
            Free plan: {Math.max(0, 3 - usedSubjects.length)} subject{3 - usedSubjects.length !== 1 ? 's' : ''} remaining this session
          </div>
        )}
      </div>
    </div>
  )

  // Generating state
  if (generating) return (
    <div style={s.shell}>
      <div style={s.header}>
        <div style={s.kente} />
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={() => setSelectedSubject(null)}>← Back</button>
          <div style={s.headerTitle}>Flashcards — {selectedSubject.name}</div>
        </div>
      </div>
      <div style={s.centred}>
        <div style={s.generatingCard}>
          <div style={s.kente} />
          <div style={s.genDots}>
            {[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ ...s.genDot, animationDelay: `${d}s` }} />)}
          </div>
          <div style={s.genTitle}>Generating flashcards...</div>
          <div style={s.genSub}>Creating 15 flashcards for {selectedSubject.name}</div>
        </div>
      </div>
    </div>
  )

  // Error state
  if (error) return (
    <div style={s.shell}>
      <div style={s.header}>
        <div style={s.kente} />
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={() => setSelectedSubject(null)}>← Back</button>
          <div style={s.headerTitle}>Flashcards — {selectedSubject.name}</div>
        </div>
      </div>
      <div style={s.centred}>
        <div style={s.errorCard}>
          <div style={s.errorIcon}>⚠️</div>
          <h3 style={s.errorTitle}>Could not generate flashcards</h3>
          <p style={s.errorMsg}>{error}</p>
          <button style={s.btnPrimary} onClick={() => generateCards(selectedSubject)}>Try again</button>
          <button style={{ ...s.btnOutline, marginTop: '8px' }} onClick={() => setSelectedSubject(null)}>Choose another subject</button>
        </div>
      </div>
    </div>
  )

  // Finished state
  if (finished) return (
    <div style={s.shell}>
      <div style={s.header}>
        <div style={s.kente} />
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={() => setSelectedSubject(null)}>← Back</button>
          <div style={s.headerTitle}>Flashcards — {selectedSubject.name}</div>
        </div>
      </div>
      <div style={s.centred}>
        <div style={s.finishedCard}>
          <div style={s.kente} />
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
          <h2 style={s.finishedTitle}>Session complete!</h2>
          <div style={s.finishedStats}>
            <div style={s.finishedStat}>
              <div style={{ ...s.finishedNum, color: 'var(--green)' }}>{known.length}</div>
              <div style={s.finishedLabel}>I knew this</div>
            </div>
            <div style={s.finishedStat}>
              <div style={{ ...s.finishedNum, color: 'var(--red)' }}>{unknown.length}</div>
              <div style={s.finishedLabel}>Need to review</div>
            </div>
          </div>
          <div style={s.finishedActions}>
            <button style={s.btnPrimary} onClick={restart}>Restart all cards</button>
            {unknown.length > 0 && (
              <button style={s.btnOutline} onClick={restartWeak}>Review {unknown.length} weak cards</button>
            )}
            <button style={s.btnOutline} onClick={() => setSelectedSubject(null)}>Choose another subject</button>
          </div>
        </div>
      </div>
    </div>
  )

  const card = cards[current]
  const progress = cards.length > 0 ? (current / cards.length) * 100 : 0

  return (
    <div style={s.shell}>
      <div style={s.header}>
        <div style={s.kente} />
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={() => setSelectedSubject(null)}>← Back</button>
          <div style={s.headerTitle}>{selectedSubject.name}</div>
          <div style={s.headerCount}>{current + 1} / {cards.length}</div>
        </div>
      </div>
      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${progress}%` }} />
      </div>

      <div style={s.content}>

        {/* Card flip — uses CSS classes for reliable backface-visibility */}
        <div className="fc-scene" style={{ marginBottom: '22px' }} onClick={() => setFlipped(f => !f)}>
          <div className={`fc-card${flipped ? ' flipped' : ''}`}>
            {/* Front */}
            <div className="fc-face fc-front">
              <div style={s.cardSide}>Term</div>
              <div style={s.cardTopic}>{card?.topic}</div>
              <div style={s.cardFront}>{card?.front}</div>
              <div style={s.tapHint}>Tap to reveal answer</div>
            </div>
            {/* Back */}
            <div className="fc-face fc-back">
              <div style={{ ...s.cardSide, color: 'var(--accent-light)' }}>Definition</div>
              <div style={s.cardBack}>{card?.back}</div>
            </div>
          </div>
        </div>

        {flipped ? (
          <div style={s.actions}>
            <button style={s.btnDontKnow} onClick={e => { e.stopPropagation(); handleDontKnow() }}>Still learning</button>
            <button style={s.btnKnow} onClick={e => { e.stopPropagation(); handleKnow() }}>I knew this ✓</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>Tap the card to see the answer</div>
          </div>
        )}

        <div style={s.dots}>
          {cards.map((_, i) => (
            <div key={i} style={{
              ...s.dot,
              background: i < current ? 'var(--green)' : i === current ? 'var(--accent-primary)' : 'rgba(255,255,255,.04)'
            }} />
          ))}
        </div>

      </div>
    </div>
  )
}

const s = {
  shell: { minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)', display: 'flex', flexDirection: 'column' },
  header: { background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)' },
  kente: { height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  headerInner: { display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 24px' },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.86rem', fontFamily: 'var(--ff)' },
  headerTitle: { fontFamily: 'var(--ff)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)', flex: 1 },
  headerCount: { fontSize: '0.86rem', fontWeight: '600', color: 'var(--accent-primary)' },
  progressBar: { height: '3px', background: 'rgba(255,255,255,.06)' },
  progressFill: { height: '100%', background: 'var(--accent-primary)', transition: 'width 0.4s ease' },
  content: { flex: 1, padding: '28px', maxWidth: '560px', margin: '0 auto', width: '100%' },
  centred: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px' },
  pageTitle: { fontFamily: 'var(--ff)', fontSize: '1.4rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '6px' },
  pageSub: { fontSize: '0.86rem', color: 'var(--ink-muted)', marginBottom: '24px' },
  subjectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' },
  subjectCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', cursor: 'pointer', textAlign: 'center', boxShadow: 'none', transition: 'box-shadow 0.15s' },
  subjectIcon: { fontSize: '2rem', marginBottom: '10px' },
  subjectName: { fontFamily: 'var(--ff)', fontSize: '0.92rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '4px' },
  subjectSub: { fontSize: '0.73rem', color: 'var(--accent-primary)', fontWeight: '600' },
  generatingCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '48px', textAlign: 'center', maxWidth: '380px', position: 'relative', overflow: 'hidden', boxShadow: 'none' },
  genDots: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' },
  genDot: { width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 1s infinite' },
  genTitle: { fontFamily: 'var(--ff)', fontSize: '1.2rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '8px' },
  genSub: { fontSize: '0.84rem', color: 'var(--ink-muted)' },
  errorCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: 'none' },
  errorIcon: { fontSize: '2.5rem', marginBottom: '12px' },
  errorTitle: { fontFamily: 'var(--ff)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '10px' },
  errorMsg: { fontSize: '0.86rem', color: 'var(--ink-muted)', marginBottom: '20px', lineHeight: 1.5 },
  cardSide: { fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.14em', color: 'var(--accent-primary)', marginBottom: '10px', textTransform: 'uppercase' },
  cardTopic: { fontSize: '0.72rem', color: 'var(--ink-muted)', marginBottom: '14px', background: 'var(--bg)', padding: '3px 10px', borderRadius: '20px' },
  cardFront: { fontFamily: 'var(--ff)', fontSize: '1.25rem', fontWeight: '700', color: 'var(--ink)', lineHeight: 1.4 },
  cardBack: { fontSize: '0.96rem', color: 'var(--ink)', lineHeight: 1.65 },
  tapHint: { position: 'absolute', bottom: '14px', fontSize: '0.7rem', color: 'var(--ink-faint)' },
  actions: { display: 'flex', gap: '10px', marginBottom: '22px' },
  btnKnow: { flex: 1, padding: '13px', background: 'var(--green-soft)', border: '1.5px solid rgba(0,158,115,0.25)', borderRadius: 'var(--r-md)', color: 'var(--green)', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  btnDontKnow: { flex: 1, padding: '13px', background: 'var(--red-soft)', border: '1.5px solid rgba(200,16,46,0.2)', borderRadius: 'var(--r-md)', color: 'var(--red)', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  dots: { display: 'flex', justifyContent: 'center', gap: '5px', flexWrap: 'wrap' },
  dot: { width: '7px', height: '7px', borderRadius: '50%', transition: 'background 0.3s' },
  finishedCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '40px', textAlign: 'center', maxWidth: '420px', width: '100%', position: 'relative', overflow: 'hidden', boxShadow: 'none' },
  finishedTitle: { fontFamily: 'var(--ff)', fontSize: '1.4rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '24px' },
  finishedStats: { display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '28px' },
  finishedStat: { textAlign: 'center' },
  finishedNum: { fontFamily: 'var(--ff)', fontSize: '2.5rem', fontWeight: '700', lineHeight: 1 },
  finishedLabel: { fontSize: '0.76rem', color: 'var(--ink-muted)', marginTop: '4px' },
  finishedActions: { display: 'flex', flexDirection: 'column', gap: '9px' },
  btnPrimary: { width: '100%', padding: '12px', background: 'var(--surface-solid)', border: 'none', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  btnOutline: { width: '100%', padding: '12px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
}