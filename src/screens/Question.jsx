import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'
import MathText from '../components/MathText'

export default function Question() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [question, setQuestion] = useState(null)
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [explanation, setExplanation] = useState(null)
  const [loadingExplain, setLoadingExplain] = useState(false)
  const [showExplain, setShowExplain] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadQuestion() }, [id])

  async function loadQuestion() {
    setLoading(true); setSelected(null); setSubmitted(false); setShowExplain(false); setExplanation(null)
    let query = supabase.from('questions').select(`*, subjects(name), topics(name), answer_options(*)`)
    if (id === 'random') {
      const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true })
      const randomOffset = Math.floor(Math.random() * count)
      query = query.range(randomOffset, randomOffset)
    } else {
      query = query.eq('id', id)
    }
    const { data } = await query
    if (data && data.length > 0) {
      const q = data[0]
      setQuestion(q)
      setOptions(q.answer_options.sort((a, b) => a.label.localeCompare(b.label)))
    }
    setLoading(false)
  }

  async function handleSubmit() {
    if (!selected) return
    setSubmitted(true)
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('streaks').upsert({ user_id: user.id, last_active_date: today, current_streak: 1 }, { onConflict: 'user_id' })
  }

  async function handleExplain() {
    setShowExplain(true)
    if (explanation) return
    setLoadingExplain(true)
    const { data: cached } = await supabase.from('explanations').select('body').eq('question_id', question.id).single()
    if (cached?.body) { setExplanation(cached.body); setLoadingExplain(false); return }
    try {
      const correctOption = options.find(o => o.is_correct)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text:
              `You are a WASSCE/BECE tutor for Ghanaian students. Explain this question clearly and step by step.\n\nQuestion: ${question.body}\nOptions: A) ${options[0]?.body} B) ${options[1]?.body} C) ${options[2]?.body} D) ${options[3]?.body}\nCorrect answer: ${correctOption?.label} — ${correctOption?.body}\nSubject: ${question.subjects?.name} | Topic: ${question.topics?.name}\n\nExplain why ${correctOption?.label} is correct and why the other options are wrong. Be clear and helpful for a Ghanaian student.`
            }] }],
            systemInstruction: { parts: [{ text: 'You are a helpful WASSCE tutor. Give clear, step-by-step explanations. Never be condescending.' }] }
          })
        }
      )
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate explanation.'
      setExplanation(text)
      await supabase.from('explanations').upsert({ question_id: question.id, body: text }, { onConflict: 'question_id' })
    } catch { setExplanation('Could not load explanation right now. Please try again.') }
    setLoadingExplain(false)
  }

  const getOptionStyle = option => {
    if (!submitted) return selected?.id === option.id ? { ...s.option, ...s.optSelected } : s.option
    if (option.is_correct) return { ...s.option, ...s.optCorrect }
    if (selected?.id === option.id && !option.is_correct) return { ...s.option, ...s.optWrong }
    return { ...s.option, ...s.optDim }
  }

  const getLetterStyle = option => {
    if (!submitted) return selected?.id === option.id ? { ...s.optLetter, ...s.optLetterSelected } : s.optLetter
    if (option.is_correct) return { ...s.optLetter, ...s.optLetterCorrect }
    if (selected?.id === option.id && !option.is_correct) return { ...s.optLetter, ...s.optLetterWrong }
    return s.optLetter
  }

  if (loading) return (
    <div style={s.loadShell}>
      <div style={s.loadSpinner} />
    </div>
  )

  if (!question) return (
    <div style={s.loadShell}>
      <div style={s.loadText}>Question not found.</div>
      <button style={s.btnPrimary} onClick={() => navigate('/practice')}>Back to practice</button>
    </div>
  )

  return (
    <div style={s.shell}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.kente} />
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={() => navigate('/practice')}>← Back</button>
          <div style={s.headerMeta}>
            {question.subjects?.name && <span style={s.badgeGold}>{question.subjects.name}</span>}
            {question.year && <span style={s.badgeMuted}>{question.year} · {question.question_type}</span>}
            {question.topics?.name && <span style={s.badgeMuted}>{question.topics.name}</span>}
          </div>
          <button style={s.randomBtn} onClick={() => navigate('/question/random')}>Random →</button>
        </div>
      </div>

      {/* Content */}
      <div style={s.content}>
        <div style={s.questionCard}>
          <div style={s.questionLabel}>Question</div>
          <div style={s.questionText}><MathText text={question.body} /></div>
        </div>

        <div style={s.optionsList}>
          {options.map(option => (
            <div key={option.id} style={getOptionStyle(option)} onClick={() => !submitted && setSelected(option)}>
              <div style={getLetterStyle(option)}>{option.label}</div>
              <div style={s.optText}><MathText text={option.body} /></div>
              {submitted && option.is_correct && <div style={s.tick}>✓</div>}
              {submitted && selected?.id === option.id && !option.is_correct && <div style={s.cross}>✗</div>}
            </div>
          ))}
        </div>

        {submitted && (
          <div style={selected?.is_correct ? s.resultCorrect : s.resultWrong}>
            {selected?.is_correct ? '✓ Correct! Well done.' : `✗ Wrong. The correct answer is ${options.find(o => o.is_correct)?.label}.`}
          </div>
        )}

        <div style={s.actions}>
          {!submitted ? (
            <>
              <button style={s.btnOutline} onClick={handleExplain}>Explain this</button>
              <button style={{ ...s.btnPrimary, opacity: selected ? 1 : 0.45 }} onClick={handleSubmit} disabled={!selected}>
                Submit answer
              </button>
            </>
          ) : (
            <>
              <button style={s.btnOutline} onClick={handleExplain}>{showExplain ? 'Hide explanation' : 'Explain this'}</button>
              <button style={s.btnPrimary} onClick={() => navigate('/question/random')}>Next question →</button>
            </>
          )}
        </div>

        {showExplain && (
          <div style={s.explainPanel}>
            <div style={s.explainHeader}>
              <div style={s.explainTitle}>AI Explanation</div>
              <div style={s.explainPowered}>Powered by Gemini 2.5 Flash</div>
            </div>
            {loadingExplain ? (
              <div style={s.explainLoading}>
                {[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ ...s.dot, animationDelay: `${d}s` }} />)}
                <span style={s.explainLoadText}>Generating explanation...</span>
              </div>
            ) : (
              <div style={s.explainBody}>
                {explanation?.split('\n').map((line, i) => (
                  <p key={i} style={{ marginBottom: '8px' }}><MathText text={line} /></p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  shell: { minHeight: '100vh', background: 'var(--surface-mid)', fontFamily: 'var(--ff-sans)', display: 'flex', flexDirection: 'column' },
  loadShell: { minHeight: '100vh', background: 'var(--surface-mid)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' },
  loadSpinner: { width: '32px', height: '32px', border: '3px solid var(--border-mid)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadText: { color: 'var(--ink-muted)', fontSize: '0.9rem' },
  header: { background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  kente: { height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  headerInner: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', flexWrap: 'wrap' },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.86rem', fontFamily: 'var(--ff-sans)', padding: '6px 10px', borderRadius: 'var(--r-sm)' },
  headerMeta: { display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' },
  randomBtn: { background: 'transparent', border: '1.5px solid var(--border-mid)', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--ff-sans)', padding: '6px 14px', borderRadius: 'var(--r-sm)' },
  badgeGold: { background: 'var(--gold-pale)', color: 'var(--gold)', border: '1px solid var(--gold-border)', padding: '3px 9px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  badgeMuted: { background: 'var(--cream-mid)', color: 'var(--ink-muted)', padding: '3px 9px', borderRadius: '20px', fontSize: '0.72rem' },
  content: { flex: 1, padding: '28px', maxWidth: '760px', margin: '0 auto', width: '100%' },
  questionCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '28px', marginBottom: '18px', boxShadow: 'var(--shadow-sm)' },
  questionLabel: { fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: '10px', textTransform: 'uppercase' },
  questionText: { fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--ink)' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '18px' },
  option: { display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 'var(--r-md)', padding: '15px 18px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)' },
  optSelected: { borderColor: 'var(--gold)', background: 'var(--gold-pale)' },
  optCorrect: { borderColor: 'var(--teal)', background: 'var(--teal-pale)', cursor: 'default' },
  optWrong: { borderColor: 'var(--red)', background: 'var(--red-pale)', cursor: 'default' },
  optDim: { opacity: 0.45, cursor: 'default' },
  optLetter: { width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.84rem', fontWeight: '700', color: 'var(--ink-muted)', flexShrink: 0, transition: 'all 0.15s' },
  optLetterSelected: { background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--surface)' },
  optLetterCorrect: { background: 'var(--teal)', borderColor: 'var(--teal)', color: 'var(--surface)' },
  optLetterWrong: { background: 'var(--red)', borderColor: 'var(--red)', color: 'var(--surface)' },
  optText: { fontSize: '0.92rem', color: 'var(--ink)', flex: 1 },
  tick: { color: 'var(--teal)', fontWeight: '700', fontSize: '1.1rem', marginLeft: 'auto' },
  cross: { color: 'var(--red)', fontWeight: '700', fontSize: '1.1rem', marginLeft: 'auto' },
  resultCorrect: { background: 'var(--teal-pale)', border: '1px solid rgba(0,158,115,0.25)', color: 'var(--teal)', padding: '12px 16px', borderRadius: 'var(--r-sm)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '14px' },
  resultWrong: { background: 'var(--red-pale)', border: '1px solid rgba(200,16,46,0.2)', color: 'var(--red)', padding: '12px 16px', borderRadius: 'var(--r-sm)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '14px' },
  actions: { display: 'flex', gap: '10px', marginBottom: '18px' },
  btnPrimary: { flex: 1, padding: '13px', background: 'var(--forest)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  btnOutline: { flex: 1, padding: '13px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  explainPanel: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' },
  explainHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' },
  explainTitle: { fontSize: '0.9rem', fontWeight: '600', color: 'var(--ink)' },
  explainPowered: { fontSize: '0.7rem', color: 'var(--ink-faint)' },
  explainLoading: { display: 'flex', alignItems: 'center', gap: '6px', padding: '20px' },
  dot: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 1s infinite' },
  explainLoadText: { fontSize: '0.82rem', color: 'var(--ink-muted)', marginLeft: '4px' },
  explainBody: { padding: '20px', fontSize: '0.9rem', lineHeight: '1.75', color: 'var(--ink)' },
}
