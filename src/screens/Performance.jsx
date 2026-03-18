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

    const { data: exams } = await supabase
      .from('mock_exams').select('*').eq('user_id', authUser.id)
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
      name, score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      correct: data.correct, total: data.total,
    }))

    const totalCorrect = examResults.reduce((a, e) => a + e.correct, 0)
    const totalAnswered = examResults.reduce((a, e) => a + e.total, 0)
    const avgScore = examResults.length > 0 ? Math.round(examResults.reduce((a, e) => a + e.score, 0) / examResults.length) : 0

    setStats({ totalExams: examResults.length, avgScore, totalAnswered, accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0 })
    setMockHistory(examResults)
    setSubjectStats(subjectList)
    setLoading(false)
  }

  const getGrade = (score) => {
    if (score >= 80) return { grade: 'A1', color: '#00C896' }
    if (score >= 75) return { grade: 'B2', color: '#00C896' }
    if (score >= 70) return { grade: 'B3', color: '#F0A500' }
    if (score >= 65) return { grade: 'C4', color: '#F0A500' }
    if (score >= 60) return { grade: 'C5', color: '#F0A500' }
    if (score >= 55) return { grade: 'C6', color: '#F0A500' }
    if (score >= 50) return { grade: 'D7', color: '#FF6B6B' }
    return { grade: 'F9', color: '#FF6B6B' }
  }

  const predictedGrade = stats?.avgScore ? getGrade(stats.avgScore) : null

  if (loading) return (
    <div style={s.loadShell}><div style={s.loadText}>Loading performance data...</div></div>
  )

  return (
    <div style={s.shell}>
      <Sidebar user={user} />
      <main style={s.main}>
        <div style={s.topbar}><div style={s.topbarTitle}>Performance</div></div>
        <div style={s.content}>
          <div style={s.hero}>
            <div style={s.heroKente} />
            <div style={s.heroLeft}>
              <div style={s.heroLabel}>Predicted WASSCE grade</div>
              <div style={{ ...s.heroGrade, color: predictedGrade?.color || '#8B949E' }}>{predictedGrade?.grade || '—'}</div>
              <div style={s.heroSub}>Based on {stats?.totalExams || 0} mock exams · {stats?.totalAnswered || 0} questions</div>
            </div>
            <div style={s.heroStats}>
              <div style={s.heroStat}><div style={s.heroStatNum}>{stats?.avgScore || 0}%</div><div style={s.heroStatLabel}>Avg score</div></div>
              <div style={s.heroStat}><div style={s.heroStatNum}>{stats?.accuracy || 0}%</div><div style={s.heroStatLabel}>Accuracy</div></div>
              <div style={s.heroStat}><div style={s.heroStatNum}>{stats?.totalExams || 0}</div><div style={s.heroStatLabel}>Mocks done</div></div>
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
                    <div style={s.examInfo}>
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
            <div style={s.heatmapWrap}>
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - (34 - i))
                const hasActivity = mockHistory.some(e => new Date(e.submitted_at).toDateString() === date.toDateString())
                return <div key={i} style={{ ...s.heatCell, background: hasActivity ? '#F0A500' : '#1C2330' }} />
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: '#0D1117', fontFamily: 'DM Sans, sans-serif' },
  loadShell: { minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadText: { color: '#8B949E' },
  main: { flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', padding: '0 28px', background: '#161B22', borderBottom: '1px solid rgba(240,246,252,0.06)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: '600', color: '#F0F6FC' },
  content: { flex: 1, padding: '28px', paddingBottom: '60px' },
  hero: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '18px', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: '20px' },
  heroKente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#F0A500 0,#F0A500 20px,#00C896 20px,#00C896 40px,#FF6B6B 40px,#FF6B6B 60px,#4A9EFF 60px,#4A9EFF 80px)' },
  heroLeft: { display: 'flex', flexDirection: 'column', gap: '6px' },
  heroLabel: { fontSize: '0.72rem', fontWeight: '600', letterSpacing: '0.1em', color: '#8B949E', textTransform: 'uppercase' },
  heroGrade: { fontFamily: 'Georgia, serif', fontSize: '4rem', fontWeight: '900', lineHeight: 1 },
  heroSub: { fontSize: '0.82rem', color: '#8B949E' },
  heroStats: { display: 'flex', gap: '32px' },
  heroStat: { textAlign: 'center' },
  heroStatNum: { fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontWeight: '700', color: '#F0A500' },
  heroStatLabel: { fontSize: '0.72rem', color: '#8B949E', marginTop: '2px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  card: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '14px', padding: '20px', marginBottom: '16px' },
  cardTitle: { fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: '600', color: '#F0F6FC', marginBottom: '16px' },
  empty: { fontSize: '0.85rem', color: '#8B949E', textAlign: 'center', padding: '20px 0' },
  link: { color: '#F0A500', cursor: 'pointer', fontWeight: '600' },
  subjectRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  subjectName: { fontSize: '0.85rem', color: '#F0F6FC', width: '140px', flexShrink: 0 },
  barWrap: { flex: 1, height: '6px', background: '#1C2330', borderRadius: '3px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
  subjectScore: { fontSize: '0.82rem', fontWeight: '600', width: '40px', textAlign: 'right' },
  examRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(240,246,252,0.04)' },
  examNum: { fontSize: '0.75rem', color: '#484F58', width: '24px' },
  examInfo: { flex: 1 },
  examDate: { fontSize: '0.85rem', color: '#F0F6FC', fontWeight: '500' },
  examDetail: { fontSize: '0.75rem', color: '#8B949E' },
  examGrade: { fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: '700' },
  examScore: { fontSize: '0.88rem', fontWeight: '600', width: '40px', textAlign: 'right' },
  heatmapWrap: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' },
  heatCell: { height: '24px', borderRadius: '4px' },
}