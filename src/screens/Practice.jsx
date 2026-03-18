import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import { useMobileMenu } from '../App'
import MathText from '../components/MathText'
import { gemini, parseJSON } from '../lib/gemini'

export default function Practice() {
  const navigate = useNavigate()
  const { open: mobileMenuOpen, setOpen: setMobileMenuOpen } = useMobileMenu()
  const [user, setUser] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [questions, setQuestions] = useState([])
  const [filters, setFilters] = useState({ subject: '', year: '', type: '', difficulty: '' })
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('past')
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
    // Deduplicate by name in case of duplicate rows in DB
    const seen = new Set()
    const unique = (data || []).filter(s => {
      if (seen.has(s.name)) return false
      seen.add(s.name)
      return true
    })
    setSubjects(unique)
  }

  async function loadQuestions() {
    setLoading(true)
    let query = supabase.from('questions').select(`*, subjects(name), topics(name), answer_options(*)`).order('created_at', { ascending: false }).limit(50)
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
    setGeneratingAI(true); setAiQuestions([])
    try {
      const { text } = await gemini(
        `You are a WASSCE examiner creating verified multiple choice questions for ${aiSubject.name} on the topic "${aiTopic}".

For each question you MUST:
1. Write the question clearly
2. Write 4 plausible options (A, B, C, D)
3. Work out the correct answer step by step in your head
4. Double-check your answer is definitely correct before marking it
5. Only mark an answer as correct if you are 100% certain

Return ONLY a valid JSON array of 5 questions. Each object must have exactly:
{"body":"the question","option_a":"option text","option_b":"option text","option_c":"option text","option_d":"option text","correct":"A or B or C or D","explanation":"step-by-step working showing why the correct answer is right"}

Do not guess. If you are not sure of the answer, choose a different question topic where you are certain.`
      )
      const parsed = parseJSON(text)
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
    } catch (err) { console.error('AI generation error:', err) }
    setGeneratingAI(false)
  }

  const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i)
  const displayQuestions = mode === 'ai' ? aiQuestions : questions

  return (
    <div style={s.shell}>
      <Sidebar user={user} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main style={s.main}>
        <MobileHeader title="Practice" onMenuOpen={() => setMobileMenuOpen(true)} />
        <div style={{...s.topbar, display: 'flex'}}>
          <div style={s.topbarTitle}>Practice</div>
          <button style={s.btnPrimary} onClick={() => navigate('/question/random')}>Random question</button>
        </div>
        <div style={s.content} className="has-bottom-nav">

          {/* Mode toggle */}
          <div style={s.modeToggle}>
            <button style={{ ...s.modeBtn, ...(mode === 'past' ? s.modeBtnActive : {}) }} onClick={() => setMode('past')}>
              📚 Past questions
            </button>
            <button style={{ ...s.modeBtn, ...(mode === 'ai' ? s.modeBtnActive : {}) }} onClick={() => setMode('ai')}>
              ✨ AI-generated
            </button>
          </div>

          {/* Past questions filters */}
          {mode === 'past' && (
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
          )}

          {/* AI mode */}
          {mode === 'ai' && (
            <div style={s.aiPanel}>
              <div style={s.aiPanelHeader}>
                <div style={s.kente} />
                <h3 style={s.aiPanelTitle}>Generate questions on any topic</h3>
                <p style={s.aiPanelSub}>Get 5 fresh WASSCE-style questions instantly</p>
                <div style={s.aiDisclaimer}>
                  ⚠️ AI-generated questions are not from official WAEC papers. Always verify answers with your textbook or teacher.
                </div>
              </div>
              <div style={s.aiControls}>
                <select style={s.select} value={aiSubject?.id || ''} onChange={e => setAiSubject(subjects.find(s => s.id === e.target.value) || null)}>
                  <option value="">Select subject</option>
                  {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
                <input style={s.aiInput} placeholder="Enter a topic (e.g. Quadratic equations, Newton's laws...)"
                  value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateAIQuestions()} />
                <button style={{ ...s.btnPrimary, opacity: (aiSubject && aiTopic.trim()) ? 1 : 0.45 }}
                  onClick={generateAIQuestions} disabled={!aiSubject || !aiTopic.trim() || generatingAI}>
                  {generatingAI ? 'Generating...' : 'Generate →'}
                </button>
              </div>
              {generatingAI && (
                <div style={s.aiLoading}>
                  {[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ ...s.aiDot, animationDelay: `${d}s` }} />)}
                  <span style={s.aiLoadText}>Generating 5 questions on "{aiTopic}"...</span>
                </div>
              )}
            </div>
          )}

          {/* Question list */}
          {loading && mode === 'past' ? (
            <div style={s.loadState}>
              {[1,2,3,4,5].map(i => <div key={i} style={s.skeleton} />)}
            </div>
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
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)' },
  main: { flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'var(--ff)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' },
  btnPrimary: { padding: '9px 18px', background: 'var(--surface-solid)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  content: { flex: 1, padding: '24px 28px 80px' },
  modeToggle: { display: 'flex', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '4px', marginBottom: '18px', width: 'fit-content', gap: '3px' },
  modeBtn: { padding: '7px 18px', borderRadius: '9px', border: 'none', background: 'transparent', color: 'var(--ink-muted)', fontSize: '0.84rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--ff)', transition: 'all 0.15s' },
  modeBtnActive: { background: 'var(--surface-solid)', color: '#F7F3EE', fontWeight: '600' },
  filterRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' },
  select: { padding: '8px 12px', background: 'var(--surface-solid)', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontSize: '0.84rem', fontFamily: 'var(--ff)', cursor: 'pointer', outline: 'none', width: 'auto' },
  clearBtn: { padding: '8px 14px', background: 'transparent', border: '1.5px solid rgba(200,16,46,0.25)', borderRadius: 'var(--r-sm)', color: 'var(--red)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  aiPanel: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', marginBottom: '20px', position: 'relative', overflow: 'hidden', boxShadow: 'none' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  aiPanelHeader: { marginBottom: '14px' },
  aiPanelTitle: { fontFamily: 'var(--ff)', fontSize: '1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '3px' },
  aiPanelSub: { fontSize: '0.78rem', color: 'var(--ink-muted)' },
  aiDisclaimer: { marginTop: '8px', fontSize: '0.76rem', color: 'var(--accent-primary)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)', padding: '8px 12px', lineHeight: 1.5 },
  aiControls: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  aiInput: { flex: 1, minWidth: '200px', padding: '9px 13px', background: 'var(--bg)', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontSize: '0.84rem', fontFamily: 'var(--ff)', outline: 'none' },
  aiLoading: { display: 'flex', alignItems: 'center', gap: '7px', marginTop: '14px' },
  aiDot: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 1s infinite' },
  aiLoadText: { fontSize: '0.8rem', color: 'var(--ink-muted)' },
  loadState: { display: 'flex', flexDirection: 'column', gap: '8px' },
  skeleton: { height: '76px', background: 'rgba(255,255,255,.06)', borderRadius: 'var(--r-md)', animation: 'pulse 1.5s infinite' },
  emptyState: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '3rem', marginBottom: '12px' },
  emptyTitle: { fontFamily: 'var(--ff)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '6px' },
  emptySub: { fontSize: '0.85rem', color: 'var(--ink-muted)' },
  qList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  qItem: { display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '15px 18px', cursor: 'pointer', transition: 'box-shadow 0.15s', boxShadow: 'none' },
  qItemBody: { flex: 1 },
  qItemMeta: { display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' },
  qItemText: { fontSize: '0.86rem', color: 'var(--ink)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  qArrow: { color: 'var(--ink-faint)', flexShrink: 0, fontSize: '0.9rem' },
  badgeGold: { background: 'var(--accent-soft)', color: 'var(--accent-primary)', border: '1px solid var(--accent-border)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600' },
  badgeMuted: { background: 'rgba(255,255,255,.06)', color: 'var(--ink-muted)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem' },
  badgeAI: { background: 'rgba(26,93,200,0.08)', color: '#1A5DC8', border: '1px solid rgba(26,93,200,0.2)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600' },
}
