import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Practice() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [questions, setQuestions] = useState([])
  const [filters, setFilters] = useState({ subject: '', year: '', type: '', difficulty: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) supabase.from('users').select('*').eq('id', u.id).single().then(({ data }) => setUser(data))
    })
    loadSubjects()
    loadQuestions()
  }, [])

  useEffect(() => { loadQuestions() }, [filters])

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

  const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div style={s.shell}>
      <Sidebar user={user} />
      <main style={s.main}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>Practice</div>
          <button style={s.btnGold} onClick={() => navigate('/question/random')}>Random question</button>
        </div>
        <div style={s.content}>
          <h2 style={s.pageTitle}>Question bank</h2>
          <p style={s.pageSub}>Filter and practice past questions from all subjects.</p>
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
              <button style={s.clearBtn} onClick={() => setFilters({ subject: '', year: '', type: '', difficulty: '' })}>Clear filters</button>
            )}
          </div>
          {loading ? (
            <div style={s.loadState}>{[1,2,3,4,5].map(i => <div key={i} style={s.skeleton} />)}</div>
          ) : questions.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>📭</div>
              <div style={s.emptyTitle}>No questions yet</div>
              <div style={s.emptySub}>Questions will appear here once the question bank is seeded.</div>
            </div>
          ) : (
            <div style={s.qList}>
              {questions.map(q => (
                <div key={q.id} style={s.qItem} onClick={() => navigate(`/question/${q.id}`)}>
                  <div style={s.qItemBody}>
                    <div style={s.qItemMeta}>
                      {q.subjects?.name && <span style={s.badgeGold}>{q.subjects.name}</span>}
                      {q.year && <span style={s.badgeMuted}>{q.year} · {q.question_type}</span>}
                      {q.difficulty && <span style={{ ...s.badgeDiff, background: q.difficulty === 'easy' ? 'rgba(0,200,150,0.1)' : q.difficulty === 'hard' ? 'rgba(255,107,107,0.1)' : 'rgba(240,165,0,0.1)', color: q.difficulty === 'easy' ? '#00C896' : q.difficulty === 'hard' ? '#FF6B6B' : '#F0A500' }}>{q.difficulty}</span>}
                    </div>
                    <div style={s.qItemText}>{q.body}</div>
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
  gold: { color: '#F0A500' },
  main: { flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: '#161B22', borderBottom: '1px solid rgba(240,246,252,0.06)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: '600', color: '#F0F6FC' },
  btnGold: { padding: '8px 18px', background: '#F0A500', border: 'none', borderRadius: '8px', color: '#0D1117', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  content: { flex: 1, padding: '28px', paddingBottom: '80px' },
  pageTitle: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: '700', color: '#F0F6FC', marginBottom: '4px' },
  pageSub: { fontSize: '0.88rem', color: '#8B949E', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' },
  select: { padding: '9px 14px', background: '#161B22', border: '1.5px solid rgba(240,246,252,0.08)', borderRadius: '8px', color: '#F0F6FC', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', outline: 'none' },
  clearBtn: { padding: '9px 14px', background: 'transparent', border: '1.5px solid rgba(255,107,107,0.3)', borderRadius: '8px', color: '#FF6B6B', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
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
  badgeDiff: { padding: '3px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
}