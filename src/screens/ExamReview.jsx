import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'
import MathText from '../components/MathText'
import { gemini } from '../lib/gemini'

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

  useEffect(() => { loadReview() }, [])

  async function loadReview() {
    const { data } = await supabase.from('mock_responses')
      .select(`*, questions(*, subjects(name), topics(name)), answer_options(body, label, is_correct)`)
      .eq('exam_id', id)
    if (!data) { setLoading(false); return }
    const enriched = await Promise.all(data.map(async r => {
      const { data: opts } = await supabase.from('answer_options').select('*').eq('question_id', r.question_id).order('label')
      return { ...r, allOptions: opts || [] }
    }))
    const topicMap = {}
    enriched.forEach(r => {
      const topic = r.questions?.topics?.name || 'General'
      if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 }
      topicMap[topic].total++
      if (r.is_correct) topicMap[topic].correct++
    })
    const weak = Object.entries(topicMap)
      .map(([name, d]) => ({ name, score: Math.round((d.correct / d.total) * 100), ...d }))
      .sort((a, b) => a.score - b.score).slice(0, 3)
    setResponses(enriched); setWeakTopics(weak); setLoading(false)
  }

  async function loadExplanation(response) {
    const qId = response.question_id
    if (explanations[qId]) { setOpenExplain(prev => ({ ...prev, [qId]: !prev[qId] })); return }
    setOpenExplain(prev => ({ ...prev, [qId]: true }))
    setLoadingExplain(prev => ({ ...prev, [qId]: true }))
    const { data: cached } = await supabase.from('explanations').select('body').eq('question_id', qId).single()
    if (cached?.body) { setExplanations(prev => ({ ...prev, [qId]: cached.body })); setLoadingExplain(prev => ({ ...prev, [qId]: false })); return }
    try {
      const correctOpt = response.allOptions.find(o => o.is_correct)
      const { text } = await gemini(
        `You are a WASSCE tutor. Explain this question step by step for a Ghanaian student.\nQuestion: ${response.questions?.body}\nOptions: ${response.allOptions.map(o => `${o.label}) ${o.body}`).join(' | ')}\nCorrect answer: ${correctOpt?.label} — ${correctOpt?.body}\nSubject: ${response.questions?.subjects?.name} | Topic: ${response.questions?.topics?.name}\nBe clear, concise and encouraging.`
      )
      setExplanations(prev => ({ ...prev, [qId]: text }))
      await supabase.from('explanations').upsert({ question_id: qId, body: text }, { onConflict: 'question_id' })
    } catch { setExplanations(prev => ({ ...prev, [qId]: 'Could not load explanation. Try again.' })) }
    setLoadingExplain(prev => ({ ...prev, [qId]: false }))
  }

  const filtered = responses.filter(r => filter === 'correct' ? r.is_correct : filter === 'wrong' ? !r.is_correct : true)
  const correctCount = responses.filter(r => r.is_correct).length
  const score = responses.length > 0 ? Math.round((correctCount / responses.length) * 100) : 0

  if (loading) return <div style={s.loadShell}><div style={s.spinner} /></div>

  return (
    <div style={s.shell}>
      <div style={s.kente} />
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(`/mock/${id}/results`)}>← Results</button>
        <div style={s.headerTitle}>Exam Review</div>
        <div style={s.headerScore}>{score}% · {correctCount}/{responses.length}</div>
      </div>
      <div style={s.content}>
        {weakTopics.length > 0 && (
          <div style={s.weakCard}>
            <div style={s.weakKente} />
            <h3 style={s.weakTitle}>Topics to focus on</h3>
            <div style={s.weakList}>
              {weakTopics.map(t => (
                <div key={t.name} style={s.weakItem}>
                  <div style={s.weakName}>{t.name}</div>
                  <div style={s.weakBar}><div style={{ ...s.weakFill, width: `${t.score}%`, background: t.score < 50 ? 'var(--red)' : 'var(--gold)' }} /></div>
                  <div style={{ ...s.weakPct, color: t.score < 50 ? 'var(--red)' : 'var(--gold)' }}>{t.score}%</div>
                </div>
              ))}
            </div>
            <button style={s.btnPrimary} onClick={() => navigate('/plan')}>Generate study plan from this exam →</button>
          </div>
        )}

        <div style={s.filterRow}>
          {[{ key: 'all', label: `All (${responses.length})` }, { key: 'correct', label: `Correct (${correctCount})` }, { key: 'wrong', label: `Wrong (${responses.length - correctCount})` }].map(f => (
            <button key={f.key} style={{ ...s.filterBtn, ...(filter === f.key ? s.filterBtnActive : {}) }} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={s.qList}>
          {filtered.map(r => (
            <div key={r.id} style={{ ...s.qCard, borderLeftColor: r.is_correct ? 'var(--teal)' : 'var(--red)' }}>
              <div style={s.qHeader}>
                <div style={{ ...s.qStatus, background: r.is_correct ? 'var(--teal-pale)' : 'var(--red-pale)', color: r.is_correct ? 'var(--teal)' : 'var(--red)' }}>
                  {r.is_correct ? '✓ Correct' : '✗ Wrong'}
                </div>
                <div style={s.qMeta}>
                  {r.questions?.subjects?.name && <span style={s.badgeGold}>{r.questions.subjects.name}</span>}
                  {r.questions?.topics?.name && <span style={s.badgeMuted}>{r.questions.topics.name}</span>}
                </div>
              </div>
              <div style={s.qBody}><MathText text={r.questions?.body} /></div>
              <div style={s.optList}>
                {r.allOptions.map(opt => (
                  <div key={opt.id} style={{ ...s.opt, ...(opt.is_correct ? s.optCorrect : {}), ...(r.selected_option_id === opt.id && !opt.is_correct ? s.optWrong : {}) }}>
                    <div style={{ ...s.optLetter, ...(opt.is_correct ? s.optLetterCorrect : {}), ...(r.selected_option_id === opt.id && !opt.is_correct ? s.optLetterWrong : {}) }}>{opt.label}</div>
                    <div style={s.optText}><MathText text={opt.body} /></div>
                    {opt.is_correct && <div style={{ color: 'var(--teal)', fontWeight: '700' }}>✓</div>}
                    {r.selected_option_id === opt.id && !opt.is_correct && <div style={{ color: 'var(--red)', fontWeight: '700' }}>✗</div>}
                  </div>
                ))}
              </div>
              <button style={s.explainBtn} onClick={() => loadExplanation(r)}>
                {openExplain[r.question_id] ? 'Hide explanation' : explanations[r.question_id] ? 'Show explanation' : 'Explain this question'}
              </button>
              {openExplain[r.question_id] && (
                <div style={s.explainBox}>
                  {loadingExplain[r.question_id] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {[0,0.2,0.4].map((d,i) => <div key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--gold)', animation:'pulse 1s infinite', animationDelay:`${d}s` }} />)}
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginLeft: '4px' }}>Generating...</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.88rem', lineHeight: '1.7', color: 'var(--ink)' }}>
                      {explanations[r.question_id]?.split('\n').map((line, i) => (
                        <p key={i} style={{ marginBottom: '6px' }}><MathText text={line} /></p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Sticky bottom action bar */}
        <div style={s.bottomBar}>
          <button style={s.bottomBtnOutline} onClick={() => navigate(`/mock/${id}/results`)}>
            ← Back to results
          </button>
          <button style={s.bottomBtnOutline} onClick={() => navigate('/mock')}>
            New exam
          </button>
          <button style={s.bottomBtnPrimary} onClick={() => navigate('/plan')}>
            Update study plan
          </button>
        </div>

      </div>
    </div>
  )
}

const s = {
  shell: { minHeight: '100vh', background: 'var(--surface-mid)', fontFamily: 'var(--ff-sans)' },
  loadShell: { minHeight: '100vh', background: 'var(--surface-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '32px', height: '32px', border: '3px solid var(--border-mid)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  kente: { height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.86rem', fontFamily: 'var(--ff-sans)' },
  headerTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)', flex: 1 },
  headerScore: { fontSize: '0.86rem', fontWeight: '600', color: 'var(--gold)' },
  content: { maxWidth: '760px', margin: '0 auto', padding: '24px' },
  weakCard: { background: 'var(--forest)', borderRadius: 'var(--r-lg)', padding: '24px', marginBottom: '18px', position: 'relative', overflow: 'hidden' },
  weakKente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  weakTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: '#F7F3EE', marginBottom: '16px' },
  weakList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  weakItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  weakName: { fontSize: '0.84rem', color: '#F7F3EE', width: '140px', flexShrink: 0 },
  weakBar: { flex: 1, height: '5px', background: 'rgba(247,243,238,0.12)', borderRadius: '3px', overflow: 'hidden' },
  weakFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
  weakPct: { fontSize: '0.8rem', fontWeight: '600', width: '36px', textAlign: 'right' },
  btnPrimary: { width: '100%', padding: '12px', background: 'var(--gold)', border: 'none', borderRadius: 'var(--r-sm)', color: 'var(--forest)', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  filterRow: { display: 'flex', gap: '7px', marginBottom: '18px' },
  filterBtn: { padding: '7px 15px', background: 'var(--surface)', border: '1.5px solid var(--border-mid)', borderRadius: '20px', color: 'var(--ink-muted)', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  filterBtnActive: { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-pale)' },
  qList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  qCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid', borderRadius: 'var(--r-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' },
  qHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' },
  qStatus: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  qMeta: { display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' },
  badgeGold: { background: 'var(--gold-pale)', color: 'var(--gold)', border: '1px solid var(--gold-border)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600' },
  badgeMuted: { background: 'var(--cream-mid)', color: 'var(--ink-muted)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem' },
  qBody: { fontSize: '0.98rem', lineHeight: '1.65', color: 'var(--ink)', marginBottom: '14px' },
  optList: { display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '12px' },
  opt: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-mid)' },
  optCorrect: { borderColor: 'var(--teal)', background: 'var(--teal-pale)' },
  optWrong: { borderColor: 'var(--red)', background: 'var(--red-pale)' },
  optLetter: { width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.76rem', fontWeight: '700', color: 'var(--ink-muted)', flexShrink: 0 },
  optLetterCorrect: { background: 'var(--teal)', borderColor: 'var(--teal)', color: 'var(--surface)' },
  optLetterWrong: { background: 'var(--red)', borderColor: 'var(--red)', color: 'var(--surface)' },
  optText: { fontSize: '0.86rem', color: 'var(--ink)', flex: 1 },
  explainBtn: { width: '100%', padding: '10px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink-muted)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)', marginTop: '4px' },
  explainBox: { background: 'var(--surface-mid)', borderRadius: 'var(--r-sm)', padding: '16px', marginTop: '12px', border: '1px solid var(--border)' },
  bottomBar: { position: 'sticky', bottom: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 0', display: 'flex', gap: '10px', marginTop: '24px' },
  bottomBtnOutline: { flex: 1, padding: '11px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  bottomBtnPrimary: { flex: 1, padding: '11px', background: 'var(--forest-mid)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
}