import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Flashcards() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [cards, setCards] = useState([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [known, setKnown] = useState([])
  const [unknown, setUnknown] = useState([])
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    supabase.from('subjects').select('*').order('name')
      .then(({ data }) => setSubjects(data || []))
  }, [])

  async function generateCards(subject) {
    setSelectedSubject(subject)
    setGenerating(true)
    setCards([])
    setCurrent(0)
    setFlipped(false)
    setKnown([])
    setUnknown([])
    setFinished(false)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text:
              `Generate 15 flashcards for WASSCE ${subject.name}. 
              Each flashcard should have a key term, definition, or concept that students must know.
              
              Return ONLY a valid JSON array. Each object must have:
              {
                "front": "the term, concept or question",
                "back": "the definition, explanation or answer",
                "topic": "the topic this belongs to"
              }
              
              Make them genuinely useful for WASSCE exam preparation. Cover different topics within ${subject.name}.`
            }] }],
          })
        }
      )
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setCards(parsed)
    } catch (err) {
      console.error('Error generating flashcards:', err)
      setCards([])
    }
    setGenerating(false)
  }

  const handleFlip = () => setFlipped(f => !f)

  const handleKnow = () => {
    setKnown(prev => [...prev, cards[current]])
    nextCard()
  }

  const handleDontKnow = () => {
    setUnknown(prev => [...prev, cards[current]])
    nextCard()
  }

  const nextCard = () => {
    if (current >= cards.length - 1) {
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
      setFlipped(false)
    }
  }

  const restart = () => {
    setCurrent(0)
    setFlipped(false)
    setKnown([])
    setUnknown([])
    setFinished(false)
  }

  const restartWeak = () => {
    setCards(unknown)
    setCurrent(0)
    setFlipped(false)
    setKnown([])
    setUnknown([])
    setFinished(false)
  }

  if (!selectedSubject) return (
    <div style={s.shell}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
        <div style={s.headerTitle}>Flashcards</div>
      </div>
      <div style={s.content}>
        <h2 style={s.pageTitle}>Choose a subject</h2>
        <p style={s.pageSub}>AI will generate flashcards for key terms and concepts.</p>
        <div style={s.subjectGrid}>
          {subjects.map(sub => (
            <div key={sub.id} style={s.subjectCard} onClick={() => generateCards(sub)}>
              <div style={s.subjectIcon}>
                {sub.name.includes('Math') ? '📐' :
                 sub.name.includes('English') ? '📝' :
                 sub.name.includes('Physics') ? '⚡' :
                 sub.name.includes('Chemistry') ? '🧪' :
                 sub.name.includes('Biology') ? '🧬' : '📚'}
              </div>
              <div style={s.subjectName}>{sub.name}</div>
              <div style={s.subjectSub}>Generate flashcards →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (generating) return (
    <div style={s.shell}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => setSelectedSubject(null)}>← Back</button>
        <div style={s.headerTitle}>Flashcards — {selectedSubject.name}</div>
      </div>
      <div style={s.centred}>
        <div style={s.generatingCard}>
          <div style={s.genDots}>
            <div style={s.genDot} />
            <div style={{ ...s.genDot, animationDelay: '0.2s' }} />
            <div style={{ ...s.genDot, animationDelay: '0.4s' }} />
          </div>
          <div style={s.genTitle}>Generating flashcards...</div>
          <div style={s.genSub}>Gemini is creating 15 flashcards for {selectedSubject.name}</div>
        </div>
      </div>
    </div>
  )

  if (finished) return (
    <div style={s.shell}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => setSelectedSubject(null)}>← Back</button>
        <div style={s.headerTitle}>Flashcards — {selectedSubject.name}</div>
      </div>
      <div style={s.centred}>
        <div style={s.finishedCard}>
          <div style={s.finishedKente} />
          <div style={s.finishedIcon}>🎉</div>
          <h2 style={s.finishedTitle}>Session complete!</h2>
          <div style={s.finishedStats}>
            <div style={s.finishedStat}>
              <div style={{ ...s.finishedNum, color: '#00C896' }}>{known.length}</div>
              <div style={s.finishedLabel}>I knew this</div>
            </div>
            <div style={s.finishedStat}>
              <div style={{ ...s.finishedNum, color: '#FF6B6B' }}>{unknown.length}</div>
              <div style={s.finishedLabel}>Need to review</div>
            </div>
          </div>
          <div style={s.finishedActions}>
            <button style={s.btnGold} onClick={restart}>
              Restart all cards
            </button>
            {unknown.length > 0 && (
              <button style={s.btnOutline} onClick={restartWeak}>
                Review {unknown.length} weak cards
              </button>
            )}
            <button style={s.btnOutline} onClick={() => setSelectedSubject(null)}>
              Choose another subject
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const card = cards[current]
  const progress = cards.length > 0 ? ((current) / cards.length) * 100 : 0

  return (
    <div style={s.shell}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => setSelectedSubject(null)}>← Back</button>
        <div style={s.headerTitle}>{selectedSubject.name}</div>
        <div style={s.headerCount}>{current + 1} / {cards.length}</div>
      </div>

      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${progress}%` }} />
      </div>

      <div style={s.content}>

        {/* CARD */}
        <div style={s.cardWrap} onClick={handleFlip}>
          <div style={{ ...s.flashCard, ...(flipped ? s.flashCardFlipped : {}) }}>
            <div style={s.flashCardInner}>

              {/* FRONT */}
              <div style={s.flashCardFront}>
                <div style={s.cardSide}>TERM</div>
                <div style={s.cardTopic}>{card?.topic}</div>
                <div style={s.cardFront}>{card?.front}</div>
                <div style={s.tapHint}>Tap to reveal answer</div>
              </div>

              {/* BACK */}
              <div style={s.flashCardBack}>
                <div style={s.cardSide}>DEFINITION</div>
                <div style={s.cardBack}>{card?.back}</div>
              </div>

            </div>
          </div>
        </div>

        {/* ACTIONS */}
        {flipped ? (
          <div style={s.actions}>
            <button style={s.btnDontKnow} onClick={handleDontKnow}>
              Still learning
            </button>
            <button style={s.btnKnow} onClick={handleKnow}>
              I knew this
            </button>
          </div>
        ) : (
          <div style={s.hintRow}>
            <div style={s.hint}>Tap the card to see the answer</div>
          </div>
        )}

        {/* PROGRESS DOTS */}
        <div style={s.dots}>
          {cards.map((_, i) => (
            <div key={i} style={{
              ...s.dot,
              background: i < current ? '#00C896' :
                          i === current ? '#F0A500' : '#1C2330'
            }} />
          ))}
        </div>

      </div>
    </div>
  )
}

const s = {
  shell: { minHeight: '100vh', background: '#0D1117', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', background: '#161B22', borderBottom: '1px solid rgba(240,246,252,0.06)', position: 'sticky', top: 0, zIndex: 40 },
  backBtn: { background: 'transparent', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'DM Sans, sans-serif' },
  headerTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: '600', color: '#F0F6FC', flex: 1 },
  headerCount: { fontSize: '0.88rem', fontWeight: '600', color: '#F0A500' },
  progressBar: { height: '3px', background: '#1C2330' },
  progressFill: { height: '100%', background: '#F0A500', transition: 'width 0.4s ease' },
  content: { flex: 1, padding: '28px', maxWidth: '600px', margin: '0 auto', width: '100%' },
  centred: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px' },
  pageTitle: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: '700', color: '#F0F6FC', marginBottom: '6px' },
  pageSub: { fontSize: '0.88rem', color: '#8B949E', marginBottom: '28px' },
  subjectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' },
  subjectCard: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
  subjectIcon: { fontSize: '2rem', marginBottom: '10px' },
  subjectName: { fontFamily: 'Georgia, serif', fontSize: '0.95rem', fontWeight: '600', color: '#F0F6FC', marginBottom: '4px' },
  subjectSub: { fontSize: '0.75rem', color: '#F0A500' },
  generatingCard: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '20px', padding: '48px', textAlign: 'center', maxWidth: '400px' },
  genDots: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' },
  genDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#F0A500', animation: 'pulse 1s infinite' },
  genTitle: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: '600', color: '#F0F6FC', marginBottom: '8px' },
  genSub: { fontSize: '0.85rem', color: '#8B949E' },
  cardWrap: { perspective: '1000px', marginBottom: '24px', cursor: 'pointer' },
  flashCard: { position: 'relative', height: '280px', transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' },
  flashCardFlipped: { transform: 'rotateY(180deg)' },
  flashCardInner: { position: 'absolute', inset: 0 },
  flashCardFront: { position: 'absolute', inset: 0, background: '#161B22', border: '1px solid rgba(240,246,252,0.08)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' },
  flashCardBack: { position: 'absolute', inset: 0, background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' },
  cardSide: { fontSize: '0.68rem', fontWeight: '600', letterSpacing: '0.1em', color: '#F0A500', marginBottom: '12px', textTransform: 'uppercase' },
  cardTopic: { fontSize: '0.75rem', color: '#8B949E', marginBottom: '16px', background: '#1C2330', padding: '3px 10px', borderRadius: '20px' },
  cardFront: { fontFamily: 'Georgia, serif', fontSize: '1.3rem', fontWeight: '600', color: '#F0F6FC', lineHeight: '1.4' },
  cardBack: { fontSize: '1rem', color: '#F0F6FC', lineHeight: '1.65' },
  tapHint: { position: 'absolute', bottom: '16px', fontSize: '0.72rem', color: '#484F58' },
  actions: { display: 'flex', gap: '12px', marginBottom: '24px' },
  btnKnow: { flex: 1, padding: '14px', background: 'rgba(0,200,150,0.1)', border: '1.5px solid rgba(0,200,150,0.3)', borderRadius: '12px', color: '#00C896', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  btnDontKnow: { flex: 1, padding: '14px', background: 'rgba(255,107,107,0.1)', border: '1.5px solid rgba(255,107,107,0.3)', borderRadius: '12px', color: '#FF6B6B', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  hintRow: { textAlign: 'center', marginBottom: '24px' },
  hint: { fontSize: '0.82rem', color: '#484F58' },
  dots: { display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', transition: 'background 0.3s' },
  finishedCard: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '20px', padding: '40px', textAlign: 'center', maxWidth: '440px', width: '100%', position: 'relative', overflow: 'hidden' },
  finishedKente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#F0A500 0,#F0A500 20px,#00C896 20px,#00C896 40px,#FF6B6B 40px,#FF6B6B 60px,#4A9EFF 60px,#4A9EFF 80px)' },
  finishedIcon: { fontSize: '3rem', marginBottom: '16px' },
  finishedTitle: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: '700', color: '#F0F6FC', marginBottom: '24px' },
  finishedStats: { display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '28px' },
  finishedStat: { textAlign: 'center' },
  finishedNum: { fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: '700', lineHeight: 1 },
  finishedLabel: { fontSize: '0.78rem', color: '#8B949E', marginTop: '4px' },
  finishedActions: { display: 'flex', flexDirection: 'column', gap: '10px' },
  btnGold: { width: '100%', padding: '13px', background: '#F0A500', border: 'none', borderRadius: '8px', color: '#0D1117', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  btnOutline: { width: '100%', padding: '13px', background: 'transparent', border: '1.5px solid rgba(240,246,252,0.1)', borderRadius: '8px', color: '#F0F6FC', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
}