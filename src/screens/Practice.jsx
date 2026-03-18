import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MathText from '../components/MathText'

export default function Practice() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [questions, setQuestions] = useState([])
  const [filters, setFilters] = useState({ subject: '', year: '', type: '', difficulty: '' })
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('past') // 'past' | 'ai'
  const [aiSubject, setAiSubject] = useState(null)
  const [aiTopic, setAiTopic] = useState('')
  const [aiQuestions, setAiQuestions] = useState([])
  const [generatingAI, setGeneratingAI] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) supabase.from('users').select('*').eq('id', u.id).single().then(({ data }) => setUser(data))
    })
    loadSubjects()
    loadQuestions()
  }, [])

  useEffect(() => { if (mode === 'past') loadQuestions() }, [filters, mode])

  async function loadSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('name')
    setSubjects(data || [])
  }

  async function loadQuestions() {
    setLoading(true)
    let query = supabase
      .from('questions')
      .select(`*, subjects(name), topics(name), answer_options(*)`)
      .order('created_at', { ascending: false })
      .limit(50)
    if (filters.subject) query = query.eq('subject_id', filters.subject)
    if (filters.year) query = query.eq('year', filters.year)
    if (filters.type) query = query.eq('question_type', filters.type)
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty)
    const { data } = await query
    setQuestions(data || [])
    setLoading(false)
  }

  async function generateAIQuestions() {
    if (!aiSubject || !aiTopic.trim()) return
    setGeneratingAI(true)
    setAiQuestions([])
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text:
              `Generate 5 WASSCE-style multiple choice questions for ${aiSubject.name} on the topic "${aiTopic}".
Return ONLY a valid JSON array. Each object must have exactly:
{
  "body": "the question",
  "option_a": "option A",
  "option_b": "option B",
  "option_c": "option C",
  "option_d": "option D",
  "correct": "A" or "B" or "C" or "D",
  "explanation": "why the correct answer is right"
}` }] }],
          })
        }
      )
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setAiQuestions(parsed.map((q, i) => ({
        id: `ai-${i}`, body: q.body, question_type: 'OBJ',
        subjects: { name: aiSubject.name }, topics: { name: aiTopic },
        answer_options: [
          { id: `ai-${i}-a`, label: 'A', body: q.option_a, is_correct: q.correct === 'A' },
          { id: `ai-${i}-b`, label: 'B', body: q.option_b, is_correct: q.correct === 'B' },
          { id: `ai-${i}-c`, label: 'C', body: q.option_c, is_correct: q.correct === 'C' },
          { id: `ai-${i}-d`, label: 'D', body: q.option_d, is_correct: q.correct === 'D' },
        ],
        _explanation: q.explanation, _ai: true,
      })))
    } catch (err) {
      console.error('AI generation error:', err)
    }
    setGeneratingAI(false)
  }

  const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i)
  const displayQuestions = mode === 'ai' ? aiQuestions : questions

  return (
    <div style={s.shell}>
      <Sidebar user={user} />
      <main style={s.main}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>Practice</div>
          <button style={s.btnGold} onClick={() => navigate('/question/random')}>Random question</button>
        </div>
        <div style={s.content}>

          {/* MODE TOGGLE */}
          <div style={s.modeToggle}>
            <button style={{ ...s.modeBtn, ...(mode === 'past' ? s.modeBtnActive : {}) }} onClick={() => setMode('past')}>
              📚 Past questions
            </button>
            <button style={{ ...s.modeBtn, ...(mode === 'ai' ? s.modeBtnActive : {}) }} onClick={() => setMode('ai')}>
              ✨ AI-generated
            </button>
          </div>

          {/* PAST QUESTIONS MODE */}
          {mode === 'past' && (
            <>
              <div style={s.filterRow}>
                <select style={s.select} value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })}>
                  <option value="">All subjects</option>
                  {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
                <select style={s.select} value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
                  <option value="">All years</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select style={s.select} value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                  <option value="">All types</option>
                  <option value="OBJ">OBJ</option>
                  <option value="Theory">Theory</option>
                  <option value="Essay">Essay</option>
                </select>
                <select style={s.select} value={filters.difficulty} onChange={e => setFilters({ ...filters, difficulty: e.target.value })}>
                  <option value="">All difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                {(filters.subject || filters.year || filters.type || filters.difficulty) && (
                  <button style={s.clearBtn} onClick={() => setFilters({ subject: '', year: '', type: '', difficulty: '' })}>Clear</button>
                )}
              </div>
            </>
          )}

          {/* AI GENERATED MODE */}
          {mode === 'ai' && (
            <div style={s.aiPanel}>
              <div style={s.aiPanelHeader}>
                <div style={s.aiPanelTitle}>Generate questions on any topic</div>
                <div style={s.aiPanelSub}>Powered by Gemini — get 5 fresh WASSCE-style questions instantly</div>
              </div>
              <div style={s.aiControls}>
                <select style={s.select} value={aiSubject?.id || ''}
                  onChange={e => setAiSubject(subjects.find(s => s.id === e.target.value) || null)}>
                  <option value="">Select subject</option>
                  {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
                <input style={s.aiInput} placeholder="Enter a topic (e.g. Quadratic equations, Newton's laws...)"
                  value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateAIQuestions()} />
                <button style={{ ...s.btnGold, opacity: (aiSubject && aiTopic.trim()) ? 1 : 0.5 }}
                  onClick={generateAIQuestions} disabled={!aiSubject || !aiTopic.trim() || generatingAI}>
                  {generatingAI ? 'Generating...' : 'Generate →'}
                </button>
              </div>
              {generatingAI && (
                <div style={s.aiLoading}>
                  <div style={s.aiDot} /><div style={{ ...s.aiDot, animationDelay: '0.2s' }} /><div style={{ ...s.aiDot, animationDelay: '0.4s' }} />
                  <span style={s.aiLoadText}>Generating 5 questions on "{aiTopic}"...</span>
                </div>
              )}
            </div>
          )}

          {/* QUESTION LIST */}
          {loading && mode === 'past' ? (
            <div style={s.loadState}>{[1,2,3,4,5].map(i => <div key={i} style={s.skeleton} />)}</div>
          ) : displayQuestions.length === 0 && !generatingAI ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>{mode === 'ai' ? '✨' : '📭'}</div>
              <div style={s.emptyTitle}>{mode === 'ai' ? 'Enter a topic to generate questions' : 'No questions yet'}</div>
              <div style={s.emptySub}>{mode === 'ai' ? 'Type any topic above and click Generate' : 'Questions will appear here once the question bank is seeded.'}</div>
            </div>
          ) : (
            <div style={s.qList}>
              {displayQuestions.map(q => (
                <div key={q.id} style={s.qItem}
                  onClick={() => q._ai ? navigate(`/question/ai-${q.id}`, { state: { question: q } }) : navigate(`/question/${q.id}`)}>
                  <div style={s.qItemBody}>
                    <div style={s.qItemMeta}>
                      {q.subjects?.name && <span style={s.badgeGold}>{q.subjects.name}</span>}
                      {q._ai ? <span style={s.badgeAI}>✨ AI Generated</span> : q.year && <span style={s.badgeMuted}>{q.year} · {q.question_type}</span>}
                      {q.topics?.name && <span style={s.badgeMuted}>{q.topics.name}</span>}
                    </div>
                    <div style={s.qItemText}><MathText text={q.body} /></div>
                  </div>
                  <div style={s.qArrow}>→</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: '#0D1117', fontFamily: 'DM Sans, sans-serif' },
  main: { flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: '#161B22', borderBottom: '1px solid rgba(240,246,252,0.06)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: '600', color: '#F0F6FC' },
  btnGold: { padding: '9px 18px', background: '#F0A500', border: 'none', borderRadius: '8px', color: '#0D1117', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  content: { flex: 1, padding: '28px', paddingBottom: '80px' },
  modeToggle: { display: 'flex', background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '12px', padding: '4px', marginBottom: '20px', width: 'fit-content', gap: '4px' },
  modeBtn: { padding: '8px 20px', borderRadius: '9px', border: 'none', background: 'transparent', color: '#8B949E', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' },
  modeBtnActive: { background: '#F0A500', color: '#0D1117', fontWeight: '700' },
  filterRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' },
  select: { padding: '9px 14px', background: '#161B22', border: '1.5px solid rgba(240,246,252,0.08)', borderRadius: '8px', color: '#F0F6FC', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', outline: 'none' },
  clearBtn: { padding: '9px 14px', background: 'transparent', border: '1.5px solid rgba(255,107,107,0.3)', borderRadius: '8px', color: '#FF6B6B', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  aiPanel: { background: '#161B22', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '20px' },
  aiPanelHeader: { marginBottom: '16px' },
  aiPanelTitle: { fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: '600', color: '#F0F6FC', marginBottom: '4px' },
  aiPanelSub: { fontSize: '0.78rem', color: '#8B949E' },
  aiControls: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  aiInput: { flex: 1, minWidth: '200px', padding: '9px 14px', background: '#1C2330', border: '1.5px solid rgba(240,246,252,0.08)', borderRadius: '8px', color: '#F0F6FC', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', outline: 'none' },
  aiLoading: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' },
  aiDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#F0A500', animation: 'pulse 1s infinite' },
  aiLoadText: { fontSize: '0.82rem', color: '#8B949E' },
  loadState: { display: 'flex', flexDirection: 'column', gap: '10px' },
  skeleton: { height: '80px', background: '#161B22', borderRadius: '10px' },
  emptyState: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '3rem', marginBottom: '12px' },
  emptyTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#F0F6FC', marginBottom: '6px', fontFamily: 'Georgia, serif' },
  emptySub: { fontSize: '0.88rem', color: '#8B949E' },
  qList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  qItem: { display: 'flex', alignItems: 'center', gap: '14px', background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '10px', padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s' },
  qItemBody: { flex: 1 },
  qItemMeta: { display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' },
  qItemText: { fontSize: '0.88rem', color: '#F0F6FC', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  qArrow: { color: '#484F58', flexShrink: 0 },
  badgeGold: { background: 'rgba(240,165,0,0.1)', color: '#F0A500', border: '1px solid rgba(240,165,0,0.2)', padding: '3px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  badgeMuted: { background: '#1C2330', color: '#8B949E', border: '1px solid rgba(240,246,252,0.06)', padding: '3px 8px', borderRadius: '20px', fontSize: '0.72rem' },
  badgeAI: { background: 'rgba(74,158,255,0.1)', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.2)', padding: '3px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
}