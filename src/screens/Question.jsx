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

  useEffect(() => {
    loadQuestion()
  }, [id])

  async function loadQuestion() {
    setLoading(true)
    setSelected(null)
    setSubmitted(false)
    setShowExplain(false)
    setExplanation(null)

    let query = supabase
      .from('questions')
      .select(`*, subjects(name), topics(name), answer_options(*)`)

    if (id === 'random') {
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
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

    // Update streak
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('streaks').upsert({
      user_id: user.id,
      last_active_date: today,
      current_streak: 1,
    }, { onConflict: 'user_id' })
  }

  async function handleExplain() {
    setShowExplain(true)
    if (explanation) return
    setLoadingExplain(true)

    // Check if cached explanation exists
    const { data: cached } = await supabase
      .from('explanations')
      .select('body')
      .eq('question_id', question.id)
      .single()

    if (cached?.body) {
      setExplanation(cached.body)
      setLoadingExplain(false)
      return
    }

    // Generate via Gemini
    try {
      const correctOption = options.find(o => o.is_correct)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text:
              `You are a WASSCE/BECE tutor for Ghanaian students. Explain this question clearly and step by step.
              
Question: ${question.body}
Options: A) ${options[0]?.body} B) ${options[1]?.body} C) ${options[2]?.body} D) ${options[3]?.body}
Correct answer: ${correctOption?.label} — ${correctOption?.body}
Subject: ${question.subjects?.name} | Topic: ${question.topics?.name}

Explain why ${correctOption?.label} is correct and why the other options are wrong. Be clear and helpful for a Ghanaian student.`
            }] }],
            systemInstruction: { parts: [{ text: 'You are a helpful WASSCE tutor. Give clear, step-by-step explanations. Never be condescending.' }] }
          })
        }
      )
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate explanation.'
      setExplanation(text)

      // Cache it
      await supabase.from('explanations').upsert({
        question_id: question.id,
        body: text,
      }, { onConflict: 'question_id' })

    } catch (err) {
      setExplanation('Could not load explanation right now. Please try again.')
    }
    setLoadingExplain(false)
  }

  const getOptionStyle = (option) => {
    if (!submitted) {
      return selected?.id === option.id ? { ...s.option, ...s.optionSelected } : s.option
    }
    if (option.is_correct) return { ...s.option, ...s.optionCorrect }
    if (selected?.id === option.id && !option.is_correct) return { ...s.option, ...s.optionWrong }
    return { ...s.option, ...s.optionDim }
  }

  const getLetterStyle = (option) => {
    if (!submitted) return selected?.id === option.id ? { ...s.optLetter, ...s.optLetterSelected } : s.optLetter
    if (option.is_correct) return { ...s.optLetter, ...s.optLetterCorrect }
    if (selected?.id === option.id && !option.is_correct) return { ...s.optLetter, ...s.optLetterWrong }
    return s.optLetter
  }

  if (loading) return (
    <div style={s.loadShell}>
      <div style={s.loadText}>Loading question...</div>
    </div>
  )

  if (!question) return (
    <div style={s.loadShell}>
      <div style={s.loadText}>Question not found.</div>
      <button style={s.btnGold} onClick={() => navigate('/practice')}>Back to practice</button>
    </div>
  )

  return (
    <div style={s.shell}>

      {/* HEADER */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/practice')}>← Back</button>
        <div style={s.headerMeta}>
          <span style={s.badgeGold}>{question.subjects?.name}</span>
          {question.year && <span style={s.badgeMuted}>{question.year} · {question.question_type}</span>}
          {question.topics?.name && <span style={s.badgeMuted}>{question.topics.name}</span>}
        </div>
        <button style={s.randomBtn} onClick={() => navigate('/question/random')}>
          Random →
        </button>
      </div>

      {/* QUESTION */}
      <div style={s.content}>
        <div style={s.questionCard}>
          <div style={s.questionLabel}>Question</div>
          <div style={s.questionText}>
            <MathText text={question.body} />
          </div>
        </div>

        {/* OPTIONS */}
        <div style={s.optionsList}>
          {options.map(option => (
            <div key={option.id}
              style={getOptionStyle(option)}
              onClick={() => !submitted && setSelected(option)}>
              <div style={getLetterStyle(option)}>{option.label}</div>
              <div style={s.optText}><MathText text={option.body} /></div>
              {submitted && option.is_correct && <div style={s.correctTick}>✓</div>}
              {submitted && selected?.id === option.id && !option.is_correct && <div style={s.wrongX}>✗</div>}
            </div>
          ))}
        </div>

        {/* RESULT MESSAGE */}
        {submitted && (
          <div style={selected?.is_correct ? s.resultCorrect : s.resultWrong}>
            {selected?.is_correct
              ? 'Correct! Well done.'
              : `Wrong. The correct answer is ${options.find(o => o.is_correct)?.label}.`}
          </div>
        )}

        {/* ACTIONS */}
        <div style={s.actions}>
          {!submitted ? (
            <>
              <button style={s.btnOutline} onClick={handleExplain}>
                Explain this
              </button>
              <button
                style={{ ...s.btnGold, opacity: selected ? 1 : 0.5 }}
                onClick={handleSubmit}
                disabled={!selected}>
                Submit answer
              </button>
            </>
          ) : (
            <>
              <button style={s.btnOutline} onClick={handleExplain}>
                {showExplain ? 'Hide explanation' : 'Explain this'}
              </button>
              <button style={s.btnGold} onClick={() => navigate('/question/random')}>
                Next question →
              </button>
            </>
          )}
        </div>

        {/* EXPLAIN PANEL */}
        {showExplain && (
          <div style={s.explainPanel}>
            <div style={s.explainHeader}>
              <div style={s.explainTitle}>AI Explanation</div>
              <div style={s.explainPowered}>Powered by Gemini 2.5 Flash</div>
            </div>
            {loadingExplain ? (
              <div style={s.explainLoading}>
                <div style={s.dot} />
                <div style={s.dot} />
                <div style={s.dot} />
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
  shell: { minHeight:'100vh', background:'#0D1117', fontFamily:'DM Sans, sans-serif', display:'flex', flexDirection:'column' },
  loadShell: { minHeight:'100vh', background:'#0D1117', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' },
  loadText: { color:'#8B949E', fontSize:'0.9rem' },

  // HEADER
  header: { display:'flex', alignItems:'center', gap:'12px', padding:'16px 24px', background:'#161B22', borderBottom:'1px solid rgba(240,246,252,0.06)', flexWrap:'wrap' },
  backBtn: { background:'transparent', border:'none', color:'#8B949E', cursor:'pointer', fontSize:'0.88rem', fontFamily:'DM Sans, sans-serif', padding:'6px 10px', borderRadius:'6px' },
  headerMeta: { display:'flex', gap:'8px', flex:1, flexWrap:'wrap' },
  randomBtn: { background:'transparent', border:'1.5px solid rgba(240,246,252,0.1)', color:'#8B949E', cursor:'pointer', fontSize:'0.82rem', fontFamily:'DM Sans, sans-serif', padding:'6px 14px', borderRadius:'6px' },
  badgeGold: { background:'rgba(240,165,0,0.1)', color:'#F0A500', border:'1px solid rgba(240,165,0,0.2)', padding:'3px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'600' },
  badgeMuted: { background:'#1C2330', color:'#8B949E', border:'1px solid rgba(240,246,252,0.06)', padding:'3px 10px', borderRadius:'20px', fontSize:'0.75rem' },

  // CONTENT
  content: { flex:1, padding:'28px', maxWidth:'760px', margin:'0 auto', width:'100%' },

  // QUESTION
  questionCard: { background:'#161B22', border:'1px solid rgba(240,246,252,0.06)', borderRadius:'16px', padding:'28px', marginBottom:'20px' },
  questionLabel: { fontSize:'0.7rem', fontWeight:'600', letterSpacing:'0.1em', color:'#F0A500', marginBottom:'10px', textTransform:'uppercase' },
  questionText: { fontSize:'1.05rem', lineHeight:'1.7', color:'#F0F6FC' },

  // OPTIONS
  optionsList: { display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px' },
  option: { display:'flex', alignItems:'center', gap:'14px', background:'#161B22', border:'2px solid rgba(240,246,252,0.08)', borderRadius:'10px', padding:'16px 18px', cursor:'pointer', transition:'all 0.2s' },
  optionSelected: { borderColor:'#F0A500', background:'rgba(240,165,0,0.06)' },
  optionCorrect: { borderColor:'#00C896', background:'rgba(0,200,150,0.08)', cursor:'default' },
  optionWrong: { borderColor:'#FF6B6B', background:'rgba(255,107,107,0.08)', cursor:'default' },
  optionDim: { opacity:0.5, cursor:'default' },
  optLetter: { width:'34px', height:'34px', borderRadius:'50%', border:'2px solid rgba(240,246,252,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:'700', color:'#8B949E', flexShrink:0, transition:'all 0.2s' },
  optLetterSelected: { background:'#F0A500', borderColor:'#F0A500', color:'#0D1117' },
  optLetterCorrect: { background:'#00C896', borderColor:'#00C896', color:'#0D1117' },
  optLetterWrong: { background:'#FF6B6B', borderColor:'#FF6B6B', color:'#fff' },
  optText: { fontSize:'0.92rem', color:'#F0F6FC', flex:1 },
  correctTick: { color:'#00C896', fontWeight:'700', fontSize:'1.1rem', marginLeft:'auto' },
  wrongX: { color:'#FF6B6B', fontWeight:'700', fontSize:'1.1rem', marginLeft:'auto' },

  // RESULT
  resultCorrect: { background:'rgba(0,200,150,0.1)', border:'1px solid rgba(0,200,150,0.3)', color:'#00C896', padding:'12px 16px', borderRadius:'8px', fontSize:'0.9rem', fontWeight:'600', marginBottom:'16px' },
  resultWrong: { background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', color:'#FF6B6B', padding:'12px 16px', borderRadius:'8px', fontSize:'0.9rem', fontWeight:'600', marginBottom:'16px' },

  // ACTIONS
  actions: { display:'flex', gap:'10px', marginBottom:'20px' },
  btnGold: { flex:1, padding:'13px', background:'#F0A500', border:'none', borderRadius:'8px', color:'#0D1117', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
  btnOutline: { flex:1, padding:'13px', background:'transparent', border:'1.5px solid rgba(240,246,252,0.1)', borderRadius:'8px', color:'#F0F6FC', fontWeight:'600', fontSize:'0.9rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },

  // EXPLAIN PANEL
  explainPanel: { background:'#161B22', border:'1px solid rgba(240,246,252,0.08)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' },
  explainHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid rgba(240,246,252,0.06)' },
  explainTitle: { fontSize:'0.9rem', fontWeight:'600', color:'#F0F6FC' },
  explainPowered: { fontSize:'0.72rem', color:'#8B949E' },
  explainLoading: { display:'flex', alignItems:'center', gap:'6px', padding:'20px' },
  dot: { width:'7px', height:'7px', borderRadius:'50%', background:'#F0A500', animation:'pulse 1s infinite' },
  explainLoadText: { fontSize:'0.82rem', color:'#8B949E', marginLeft:'4px' },
  explainBody: { padding:'20px', fontSize:'0.9rem', lineHeight:'1.75', color:'#F0F6FC' },
}