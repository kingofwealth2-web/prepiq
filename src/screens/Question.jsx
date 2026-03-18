import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'
import MathText from '../components/MathText'
import { gemini } from '../lib/gemini'
import { updateStreak } from '../lib/streak'

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
    const { data, error } = await query

    // If offline, try to serve from cache
    if (error || !data) {
      const cached = localStorage.getItem('prepiq-last-question')
      if (cached) {
        try {
          const q = JSON.parse(cached)
          setQuestion(q)
          setOptions((q.answer_options || []).sort((a, b) => a.label.localeCompare(b.label)))
        } catch { /* ignore */ }
      }
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      const q = data[0]
      setQuestion(q)
      setOptions(q.answer_options.sort((a, b) => a.label.localeCompare(b.label)))
      // Cache for offline use
      try { localStorage.setItem('prepiq-last-question', JSON.stringify(q)) } catch { /* ignore */ }
    }
    setLoading(false)
  }

  async function handleSubmit() {
    if (!selected) return
    setSubmitted(true)
    const { data: { user } } = await supabase.auth.getUser()
    // Update streak correctly
    await updateStreak(user.id)

    // Track solo practice attempt (exam_id null = not part of a mock)
    try {
      await supabase.from('mock_responses').insert({
        user_id: user.id,
        exam_id: null,
        question_id: question.id,
        selected_option_id: selected.id,
        is_correct: selected.is_correct,
        time_spent_secs: 0,
      })
    } catch { /* non-critical */ }
  }

  async function handleExplain() {
    setShowExplain(true)
    if (explanation) return
    setLoadingExplain(true)
    const { data: cached } = await supabase.from('explanations').select('body').eq('question_id', question.id).single()
    if (cached?.body) { setExplanation(cached.body); setLoadingExplain(false); return }
    try {
      const correctOption = options.find(o => o.is_correct)
      const { text } = await gemini(
        `You are a WASSCE/BECE tutor for Ghanaian students. A student needs help with this question.

Question: ${question.body}
Options:
A) ${options[0]?.body}
B) ${options[1]?.body}
C) ${options[2]?.body}
D) ${options[3]?.body}
Subject: ${question.subjects?.name} | Topic: ${question.topics?.name}

Your task:
1. Work through this question step by step using your knowledge
2. Identify the correct answer yourself through reasoning — do not just accept the marked answer
3. If the marked answer (${correctOption?.label}: ${correctOption?.body}) is correct, explain clearly why
4. If you believe the marked answer may be incorrect, say so honestly and explain what you think the correct answer is
5. Explain why each wrong option is wrong
6. Be clear, encouraging and helpful for a Ghanaian secondary school student`,
        'You are an honest, knowledgeable WASSCE tutor. Always reason through problems yourself. Never blindly justify an answer you think is wrong — academic integrity matters more than agreement.'
      )
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
  shell: { minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)', display: 'flex', flexDirection: 'column' },
  loadShell: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' },
  loadSpinner: { width: '32px', height: '32px', border: '3px solid var(--border-mid)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadText: { color: 'var(--ink-muted)', fontSize: '0.9rem' },
  header: { background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  kente: { height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  headerInner: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', flexWrap: 'wrap' },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.86rem', fontFamily: 'var(--ff)', padding: '6px 10px', borderRadius: 'var(--r-sm)' },
  headerMeta: { display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' },
  randomBtn: { background: 'transparent', border: '1.5px solid var(--border-mid)', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--ff)', padding: '6px 14px', borderRadius: 'var(--r-sm)' },
  badgeGold: { background: 'var(--accent-soft)', color: 'var(--accent-primary)', border: '1px solid var(--accent-border)', padding: '3px 9px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  badgeMuted: { background: 'rgba(255,255,255,.06)', color: 'var(--ink-muted)', padding: '3px 9px', borderRadius: '20px', fontSize: '0.72rem' },
  content: { flex: 1, padding: '28px', maxWidth: '760px', margin: '0 auto', width: '100%' },
  questionCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '28px', marginBottom: '18px', boxShadow: 'none' },
  questionLabel: { fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.12em', color: 'var(--accent-primary)', marginBottom: '10px', textTransform: 'uppercase' },
  questionText: { fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--ink)' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '18px' },
  option: { display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--surface-solid)', border: '2px solid var(--border)', borderRadius: 'var(--r-md)', padding: '15px 18px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: 'none' },
  optSelected: { borderColor: 'var(--accent-primary)', background: 'var(--accent-soft)' },
  optCorrect: { borderColor: 'var(--green)', background: 'var(--green-soft)', cursor: 'default' },
  optWrong: { borderColor: 'var(--red)', background: 'var(--red-soft)', cursor: 'default' },
  optDim: { opacity: 0.45, cursor: 'default' },
  optLetter: { width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.84rem', fontWeight: '700', color: 'var(--ink-muted)', flexShrink: 0, transition: 'all 0.15s' },
  optLetterSelected: { background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: 'var(--surface-solid)' },
  optLetterCorrect: { background: 'var(--green)', borderColor: 'var(--green)', color: 'var(--surface-solid)' },
  optLetterWrong: { background: 'var(--red)', borderColor: 'var(--red)', color: 'var(--surface-solid)' },
  optText: { fontSize: '0.92rem', color: 'var(--ink)', flex: 1 },
  tick: { color: 'var(--green)', fontWeight: '700', fontSize: '1.1rem', marginLeft: 'auto' },
  cross: { color: 'var(--red)', fontWeight: '700', fontSize: '1.1rem', marginLeft: 'auto' },
  resultCorrect: { background: 'var(--green-soft)', border: '1px solid rgba(0,158,115,0.25)', color: 'var(--green)', padding: '12px 16px', borderRadius: 'var(--r-sm)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '14px' },
  resultWrong: { background: 'var(--red-soft)', border: '1px solid rgba(200,16,46,0.2)', color: 'var(--red)', padding: '12px 16px', borderRadius: 'var(--r-sm)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '14px' },
  actions: { display: 'flex', gap: '10px', marginBottom: '18px' },
  btnPrimary: { flex: 1, padding: '13px', background: 'var(--surface-solid)', border: 'none', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  btnOutline: { flex: 1, padding: '13px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  explainPanel: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'none' },
  explainHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' },
  explainTitle: { fontSize: '0.9rem', fontWeight: '600', color: 'var(--ink)' },
  explainPowered: { fontSize: '0.7rem', color: 'var(--ink-faint)' },
  explainLoading: { display: 'flex', alignItems: 'center', gap: '6px', padding: '20px' },
  dot: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 1s infinite' },
  explainLoadText: { fontSize: '0.82rem', color: 'var(--ink-muted)', marginLeft: '4px' },
  explainBody: { padding: '20px', fontSize: '0.9rem', lineHeight: '1.75', color: 'var(--ink)' },
}
