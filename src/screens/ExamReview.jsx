import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'
import MathText from '../components/MathText'

export default function ExamReview() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [responses, setResponses] = useState([])
  const [weakTopics, setWeakTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [openExplain, setOpenExplain] = useState({})
  const [explanations, setExplanations] = useState({})
  const [loadingExplain, setLoadingExplain] = useState({})
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadReview()
  }, [])

  async function loadReview() {
    const { data } = await supabase
      .from('mock_responses')
      .select(`
        *,
        questions(*, subjects(name), topics(name)),
        answer_options(body, label, is_correct)
      `)
      .eq('exam_id', id)

    if (!data) { setLoading(false); return }

    // Get all answer options for each question
    const enriched = await Promise.all(data.map(async (r) => {
      const { data: opts } = await supabase
        .from('answer_options')
        .select('*')
        .eq('question_id', r.question_id)
        .order('label')
      return { ...r, allOptions: opts || [] }
    }))

    // Calculate weak topics
    const topicMap = {}
    enriched.forEach(r => {
      const topic = r.questions?.topics?.name || 'General'
      if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 }
      topicMap[topic].total++
      if (r.is_correct) topicMap[topic].correct++
    })

    const weak = Object.entries(topicMap)
      .map(([name, d]) => ({ name, score: Math.round((d.correct / d.total) * 100), ...d }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)

    setResponses(enriched)
    setWeakTopics(weak)
    setLoading(false)
  }

  async function loadExplanation(response) {
    const qId = response.question_id
    if (explanations[qId]) {
      setOpenExplain(prev => ({ ...prev, [qId]: !prev[qId] }))
      return
    }

    setOpenExplain(prev => ({ ...prev, [qId]: true }))
    setLoadingExplain(prev => ({ ...prev, [qId]: true }))

    // Check cache
    const { data: cached } = await supabase
      .from('explanations')
      .select('body')
      .eq('question_id', qId)
      .single()

    if (cached?.body) {
      setExplanations(prev => ({ ...prev, [qId]: cached.body }))
      setLoadingExplain(prev => ({ ...prev, [qId]: false }))
      return
    }

    // Generate
    try {
      const correctOpt = response.allOptions.find(o => o.is_correct)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text:
              `You are a WASSCE tutor. Explain this question step by step for a Ghanaian student.
Question: ${response.questions?.body}
Options: ${response.allOptions.map(o => `${o.label}) ${o.body}`).join(' | ')}
Correct answer: ${correctOpt?.label} — ${correctOpt?.body}
Subject: ${response.questions?.subjects?.name} | Topic: ${response.questions?.topics?.name}
Be clear, concise and encouraging.`
            }] }],
          })
        }
      )
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate explanation.'
      setExplanations(prev => ({ ...prev, [qId]: text }))

      await supabase.from('explanations').upsert({
        question_id: qId, body: text
      }, { onConflict: 'question_id' })
    } catch {
      setExplanations(prev => ({ ...prev, [qId]: 'Could not load explanation. Try again.' }))
    }
    setLoadingExplain(prev => ({ ...prev, [qId]: false }))
  }

  const filtered = responses.filter(r => {
    if (filter === 'correct') return r.is_correct
    if (filter === 'wrong') return !r.is_correct
    return true
  })

  const correctCount = responses.filter(r => r.is_correct).length
  const score = responses.length > 0 ? Math.round((correctCount / responses.length) * 100) : 0

  if (loading) return (
    <div style={s.loadShell}><div style={s.loadText}>Loading review...</div></div>
  )

  return (
    <div style={s.shell}>

      {/* HEADER */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/mock')}>← Back</button>
        <div style={s.headerTitle}>Exam Review</div>
        <div style={s.headerScore}>{score}% · {correctCount}/{responses.length}</div>
      </div>

      <div style={s.content}>

        {/* WEAK TOPICS */}
        {weakTopics.length > 0 && (
          <div style={s.weakCard}>
            <div style={s.weakKente} />
            <div style={s.weakTitle}>Topics to focus on</div>
            <div style={s.weakList}>
              {weakTopics.map(t => (
                <div key={t.name} style={s.weakItem}>
                  <div style={s.weakName}>{t.name}</div>
                  <div style={s.weakBar}>
                    <div style={{
                      ...s.weakFill,
                      width: `${t.score}%`,
                      background: t.score < 50 ? '#FF6B6B' : '#F0A500'
                    }} />
                  </div>
                  <div style={{
                    ...s.weakScore,
                    color: t.score < 50 ? '#FF6B6B' : '#F0A500'
                  }}>{t.score}%</div>
                </div>
              ))}
            </div>
            <button style={s.btnGold} onClick={() => navigate('/plan')}>
              Generate study plan from this exam →
            </button>
          </div>
        )}

        {/* FILTERS */}
        <div style={s.filterRow}>
          {[
            { key: 'all', label: `All (${responses.length})` },
            { key: 'correct', label: `Correct (${correctCount})` },
            { key: 'wrong', label: `Wrong (${responses.length - correctCount})` },
          ].map(f => (
            <button key={f.key}
              style={{ ...s.filterBtn, ...(filter === f.key ? s.filterBtnActive : {}) }}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* QUESTIONS */}
        <div style={s.questionList}>
          {filtered.map((r, i) => (
            <div key={r.id} style={{
              ...s.qCard,
              borderColor: r.is_correct ? 'rgba(0,200,150,0.3)' : 'rgba(255,107,107,0.3)'
            }}>
              {/* Question header */}
              <div style={s.qHeader}>
                <div style={{
                  ...s.qStatus,
                  background: r.is_correct ? 'rgba(0,200,150,0.1)' : 'rgba(255,107,107,0.1)',
                  color: r.is_correct ? '#00C896' : '#FF6B6B'
                }}>
                  {r.is_correct ? '✓ Correct' : '✗ Wrong'}
                </div>
                <div style={s.qMeta}>
                  {r.questions?.subjects?.name && <span style={s.badge}>{r.questions.subjects.name}</span>}
                  {r.questions?.topics?.name && <span style={s.badgeMuted}>{r.questions.topics.name}</span>}
                </div>
              </div>

              {/* Question body */}
              <div style={s.qBody}>
                <MathText text={r.questions?.body} />
              </div>

              {/* Options */}
              <div style={s.optList}>
                {r.allOptions.map(opt => (
                  <div key={opt.id} style={{
                    ...s.opt,
                    ...(opt.is_correct ? s.optCorrect : {}),
                    ...(r.selected_option_id === opt.id && !opt.is_correct ? s.optWrong : {}),
                  }}>
                    <div style={{
                      ...s.optLetter,
                      ...(opt.is_correct ? s.optLetterCorrect : {}),
                      ...(r.selected_option_id === opt.id && !opt.is_correct ? s.optLetterWrong : {}),
                    }}>{opt.label}</div>
                    <div style={s.optText}><MathText text={opt.body} /></div>
                    {opt.is_correct && <div style={s.tick}>✓</div>}
                    {r.selected_option_id === opt.id && !opt.is_correct && <div style={s.cross}>✗</div>}
                  </div>
                ))}
              </div>

              {/* Explain button */}
              <button style={s.explainBtn} onClick={() => loadExplanation(r)}>
                {openExplain[r.question_id]
                  ? 'Hide explanation'
                  : explanations[r.question_id]
                  ? 'Show explanation'
                  : 'Explain this question'}
              </button>

              {/* Explanation */}
              {openExplain[r.question_id] && (
                <div style={s.explainBox}>
                  {loadingExplain[r.question_id] ? (
                    <div style={s.explainLoading}>
                      <div style={s.dot} /><div style={s.dot} /><div style={s.dot} />
                      <span style={s.explainLoadText}>Generating explanation...</span>
                    </div>
                  ) : (
                    <div style={s.explainText}>
                      {explanations[r.question_id]?.split('\n').map((line, i) => (
                        <p key={i} style={{ marginBottom: '6px' }}>
                          <MathText text={line} />
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

const s = {
  shell: { minHeight: '100vh', background: '#0D1117', fontFamily: 'DM Sans, sans-serif' },
  loadShell: { minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadText: { color: '#8B949E' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', background: '#161B22', borderBottom: '1px solid rgba(240,246,252,0.06)', position: 'sticky', top: 0, zIndex: 40 },
  backBtn: { background: 'transparent', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'DM Sans, sans-serif' },
  headerTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: '600', color: '#F0F6FC', flex: 1 },
  headerScore: { fontSize: '0.88rem', fontWeight: '600', color: '#F0A500' },
  content: { maxWidth: '760px', margin: '0 auto', padding: '28px' },
  weakCard: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' },
  weakKente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#F0A500 0,#F0A500 20px,#00C896 20px,#00C896 40px,#FF6B6B 40px,#FF6B6B 60px,#4A9EFF 60px,#4A9EFF 80px)' },
  weakTitle: { fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: '600', color: '#F0F6FC', marginBottom: '16px' },
  weakList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  weakItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  weakName: { fontSize: '0.85rem', color: '#F0F6FC', width: '140px', flexShrink: 0 },
  weakBar: { flex: 1, height: '6px', background: '#1C2330', borderRadius: '3px', overflow: 'hidden' },
  weakFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
  weakScore: { fontSize: '0.82rem', fontWeight: '600', width: '36px', textAlign: 'right' },
  btnGold: { width: '100%', padding: '12px', background: '#F0A500', border: 'none', borderRadius: '8px', color: '#0D1117', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  filterRow: { display: 'flex', gap: '8px', marginBottom: '20px' },
  filterBtn: { padding: '8px 16px', background: '#161B22', border: '1.5px solid rgba(240,246,252,0.08)', borderRadius: '20px', color: '#8B949E', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  filterBtnActive: { borderColor: '#F0A500', color: '#F0A500', background: 'rgba(240,165,0,0.08)' },
  questionList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  qCard: { background: '#161B22', border: '1px solid', borderRadius: '14px', padding: '20px' },
  qHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' },
  qStatus: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  qMeta: { display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' },
  badge: { background: 'rgba(240,165,0,0.1)', color: '#F0A500', border: '1px solid rgba(240,165,0,0.2)', padding: '3px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  badgeMuted: { background: '#1C2330', color: '#8B949E', padding: '3px 8px', borderRadius: '20px', fontSize: '0.72rem' },
  qBody: { fontSize: '1rem', lineHeight: '1.65', color: '#F0F6FC', marginBottom: '16px' },
  optList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' },
  opt: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: '1.5px solid rgba(240,246,252,0.06)', borderRadius: '8px', background: '#1C2330' },
  optCorrect: { borderColor: '#00C896', background: 'rgba(0,200,150,0.06)' },
  optWrong: { borderColor: '#FF6B6B', background: 'rgba(255,107,107,0.06)' },
  optLetter: { width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid rgba(240,246,252,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: '700', color: '#8B949E', flexShrink: 0 },
  optLetterCorrect: { background: '#00C896', borderColor: '#00C896', color: '#0D1117' },
  optLetterWrong: { background: '#FF6B6B', borderColor: '#FF6B6B', color: '#fff' },
  optText: { fontSize: '0.88rem', color: '#F0F6FC', flex: 1 },
  tick: { color: '#00C896', fontWeight: '700' },
  cross: { color: '#FF6B6B', fontWeight: '700' },
  explainBtn: { width: '100%', padding: '10px', background: 'transparent', border: '1.5px solid rgba(240,246,252,0.08)', borderRadius: '8px', color: '#8B949E', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginTop: '4px' },
  explainBox: { background: '#1C2330', borderRadius: '8px', padding: '16px', marginTop: '12px' },
  explainLoading: { display: 'flex', alignItems: 'center', gap: '6px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: '#F0A500', animation: 'pulse 1s infinite' },
  explainLoadText: { fontSize: '0.8rem', color: '#8B949E' },
  explainText: { fontSize: '0.88rem', lineHeight: '1.7', color: '#F0F6FC' },
}