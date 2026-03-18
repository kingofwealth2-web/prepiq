import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Performance() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [mockHistory, setMockHistory] = useState([])
  const [subjectStats, setSubjectStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPerformance() }, [])

  async function loadPerformance() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(profile)
    const { data: exams } = await supabase.from('mock_exams').select('*').eq('user_id', authUser.id)
      .not('submitted_at', 'is', null).order('submitted_at', { ascending: false }).limit(10)
    const examResults = []
    for (const exam of (exams || [])) {
      const { data: res } = await supabase.from('mock_responses').select('is_correct').eq('exam_id', exam.id)
      const correct = res?.filter(r => r.is_correct).length || 0
      const total = res?.length || 0
      examResults.push({ ...exam, score: total > 0 ? Math.round((correct / total) * 100) : 0, correct, total })
    }
    const subjectMap = {}
    for (const exam of (exams || [])) {
      const { data: res } = await supabase.from('mock_responses').select(`*, questions(subjects(name))`).eq('exam_id', exam.id)
      res?.forEach(r => {
        const name = r.questions?.subjects?.name || 'Unknown'
        if (!subjectMap[name]) subjectMap[name] = { correct: 0, total: 0 }
        subjectMap[name].total++
        if (r.is_correct) subjectMap[name].correct++
      })
    }
    const subjectList = Object.entries(subjectMap).map(([name, data]) => ({
      name, score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0, ...data
    }))
    const totalCorrect = examResults.reduce((a, e) => a + e.correct, 0)
    const totalAnswered = examResults.reduce((a, e) => a + e.total, 0)
    const avgScore = examResults.length > 0 ? Math.round(examResults.reduce((a, e) => a + e.score, 0) / examResults.length) : 0
    setStats({ totalExams: examResults.length, avgScore, totalAnswered, accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0 })
    setMockHistory(examResults); setSubjectStats(subjectList); setLoading(false)
  }

  const getGrade = score => {
    if (score >= 80) return { grade: 'A1', color: 'var(--teal)' }
    if (score >= 70) return { grade: 'B', color: 'var(--gold)' }
    if (score >= 55) return { grade: 'C', color: 'var(--gold)' }
    if (score >= 50) return { grade: 'D7', color: 'var(--red)' }
    return { grade: 'F9', color: 'var(--red)' }
  }

  const predictedGrade = stats?.avgScore ? getGrade(stats.avgScore) : null

  if (loading) return (
    <div style={s.loadShell}><div style={s.spinner} /></div>
  )

  return (
    <div style={s.shell}>
      <Sidebar user={user} />
      <main style={s.main}>
        <div style={s.topbar}><div style={s.topbarTitle}>Performance</div></div>
        <div style={s.content}>

          <div style={s.hero}>
            <div style={s.kente} />
            <div style={s.heroLeft}>
              <div style={s.heroLabel}>Predicted WASSCE grade</div>
              <div style={{ ...s.heroGrade, color: predictedGrade?.color || 'var(--ink-faint)' }}>{predictedGrade?.grade || '—'}</div>
              <div style={s.heroSub}>Based on {stats?.totalExams || 0} mock exams · {stats?.totalAnswered || 0} questions</div>
            </div>
            <div style={s.heroStats}>
              {[{ num: `${stats?.avgScore || 0}%`, label: 'Avg score' }, { num: `${stats?.accuracy || 0}%`, label: 'Accuracy' }, { num: stats?.totalExams || 0, label: 'Mocks done' }].map((st, i) => (
                <div key={i} style={s.heroStat}>
                  <div style={s.heroStatNum}>{st.num}</div>
                  <div style={s.heroStatLabel}>{st.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.grid}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Subject breakdown</h3>
              {subjectStats.length === 0 ? (
                <div style={s.empty}>No data yet — take a mock exam first.</div>
              ) : subjectStats.map(sub => {
                const { color } = getGrade(sub.score)
                return (
                  <div key={sub.name} style={s.subjectRow}>
                    <div style={s.subjectName}>{sub.name}</div>
                    <div style={s.barWrap}><div style={{ ...s.barFill, width: `${sub.score}%`, background: color }} /></div>
                    <div style={{ ...s.subjectScore, color }}>{sub.score}%</div>
                  </div>
                )
              })}
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Recent mock exams</h3>
              {mockHistory.length === 0 ? (
                <div style={s.empty}>No exams yet. <span style={s.link} onClick={() => navigate('/mock')}>Take your first mock →</span></div>
              ) : mockHistory.map((exam, i) => {
                const { grade, color } = getGrade(exam.score)
                return (
                  <div key={exam.id} style={s.examRow}>
                    <div style={s.examNum}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.examDate}>{new Date(exam.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div style={s.examDetail}>{exam.correct}/{exam.total} correct</div>
                    </div>
                    <div style={{ ...s.examGrade, color }}>{grade}</div>
                    <div style={{ ...s.examScore, color }}>{exam.score}%</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Study activity — last 5 weeks</h3>
            <div style={s.heatWrap}>
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date(); date.setDate(date.getDate() - (34 - i))
                const hasActivity = mockHistory.some(e => new Date(e.submitted_at).toDateString() === date.toDateString())
                return <div key={i} style={{ ...s.heatCell, background: hasActivity ? 'var(--gold)' : 'var(--cream-mid)' }} />
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--cream)', fontFamily: 'var(--ff-sans)' },
  loadShell: { minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '32px', height: '32px', border: '3px solid var(--border-mid)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  main: { flex: 1, marginLeft: '220px', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', padding: '0 28px', background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' },
  content: { flex: 1, padding: '24px 28px 60px' },
  hero: { background: 'var(--forest)', borderRadius: 'var(--r-xl)', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: '20px' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  heroLeft: {},
  heroLabel: { fontSize: '0.68rem', fontWeight: '600', letterSpacing: '0.12em', color: 'rgba(247,243,238,0.45)', textTransform: 'uppercase', marginBottom: '6px' },
  heroGrade: { fontFamily: 'var(--ff-serif)', fontSize: '4rem', fontWeight: '700', lineHeight: 1, marginBottom: '8px' },
  heroSub: { fontSize: '0.8rem', color: 'rgba(247,243,238,0.45)' },
  heroStats: { display: 'flex', gap: '32px' },
  heroStat: { textAlign: 'center' },
  heroStatNum: { fontFamily: 'var(--ff-serif)', fontSize: '1.8rem', fontWeight: '700', color: 'var(--gold-light)', lineHeight: 1 },
  heroStatLabel: { fontSize: '0.7rem', color: 'rgba(247,243,238,0.45)', marginTop: '3px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' },
  card: { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', marginBottom: '14px', boxShadow: 'var(--shadow-sm)' },
  cardTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' },
  empty: { fontSize: '0.84rem', color: 'var(--ink-muted)', textAlign: 'center', padding: '20px 0' },
  link: { color: 'var(--gold)', cursor: 'pointer', fontWeight: '600' },
  subjectRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  subjectName: { fontSize: '0.84rem', color: 'var(--ink)', width: '130px', flexShrink: 0 },
  barWrap: { flex: 1, height: '5px', background: 'var(--cream-mid)', borderRadius: '3px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
  subjectScore: { fontSize: '0.8rem', fontWeight: '600', width: '38px', textAlign: 'right' },
  examRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' },
  examNum: { fontSize: '0.72rem', color: 'var(--ink-faint)', width: '22px' },
  examDate: { fontSize: '0.84rem', color: 'var(--ink)', fontWeight: '500' },
  examDetail: { fontSize: '0.72rem', color: 'var(--ink-muted)' },
  examGrade: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700' },
  examScore: { fontSize: '0.86rem', fontWeight: '600', width: '38px', textAlign: 'right' },
  heatWrap: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' },
  heatCell: { height: '22px', borderRadius: '4px', transition: 'background 0.3s' },
}
