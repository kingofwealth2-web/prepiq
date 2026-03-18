import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import { useMobileMenu } from '../App'

export default function Performance() {
  const navigate = useNavigate()
  const { open: mobileMenuOpen, setOpen: setMobileMenuOpen } = useMobileMenu()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [mockHistory, setMockHistory] = useState([])
  const [subjectStats, setSubjectStats] = useState([])
  const [activityDates, setActivityDates] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPerformance() }, [])

  async function loadPerformance() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('users').select('*').eq('id', authUser.id).single()
    setUser(profile)

    // 1. Get all exams in one query
    const { data: exams } = await supabase
      .from('mock_exams')
      .select('id, submitted_at, config')
      .eq('user_id', authUser.id)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(10)

    if (!exams || exams.length === 0) {
      setStats({ totalExams: 0, avgScore: 0, totalAnswered: 0, accuracy: 0 })
      setMockHistory([])
      setSubjectStats([])
      setLoading(false)
      return
    }

    const examIds = exams.map(e => e.id)

    // 2. Get ALL responses for ALL exams in ONE query with subject join
    const { data: allResponses } = await supabase
      .from('mock_responses')
      .select(`
        exam_id,
        is_correct,
        questions (
          subjects ( name )
        )
      `)
      .in('exam_id', examIds)

    if (!allResponses) {
      setStats({ totalExams: 0, avgScore: 0, totalAnswered: 0, accuracy: 0 })
      setLoading(false)
      return
    }

    // 3. Group responses by exam_id
    const byExam = {}
    examIds.forEach(id => { byExam[id] = { correct: 0, total: 0 } })
    allResponses.forEach(r => {
      if (!byExam[r.exam_id]) byExam[r.exam_id] = { correct: 0, total: 0 }
      byExam[r.exam_id].total++
      if (r.is_correct) byExam[r.exam_id].correct++
    })

    // 4. Build exam history
    const examResults = exams.map(exam => {
      const { correct, total } = byExam[exam.id] || { correct: 0, total: 0 }
      return {
        ...exam,
        score: total > 0 ? Math.round((correct / total) * 100) : 0,
        correct,
        total,
      }
    })

    // 5. Build subject breakdown from same response set
    const subjectMap = {}
    allResponses.forEach(r => {
      const name = r.questions?.subjects?.name || 'Unknown'
      if (!subjectMap[name]) subjectMap[name] = { correct: 0, total: 0 }
      subjectMap[name].total++
      if (r.is_correct) subjectMap[name].correct++
    })

    const subjectList = Object.entries(subjectMap)
      .map(([name, data]) => ({
        name,
        score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        correct: data.correct,
        total: data.total,
      }))
      .sort((a, b) => a.score - b.score)

    // 6. Compute overall stats
    const totalCorrect = allResponses.filter(r => r.is_correct).length
    const totalAnswered = allResponses.length
    const avgScore = examResults.length > 0
      ? Math.round(examResults.reduce((a, e) => a + e.score, 0) / examResults.length)
      : 0

    // 7. Activity dates for heatmap
    const dates = new Set(
      exams.map(e => new Date(e.submitted_at).toDateString())
    )

    setStats({
      totalExams: examResults.length,
      avgScore,
      totalAnswered,
      accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    })
    setMockHistory(examResults)
    setSubjectStats(subjectList)
    setActivityDates(dates)
    setLoading(false)
  }

  const getGrade = score => {
    if (score >= 80) return { grade: 'A1', color: 'var(--green)' }
    if (score >= 75) return { grade: 'B2', color: 'var(--green)' }
    if (score >= 70) return { grade: 'B3', color: 'var(--accent-primary)' }
    if (score >= 65) return { grade: 'C4', color: 'var(--accent-primary)' }
    if (score >= 60) return { grade: 'C5', color: 'var(--accent-primary)' }
    if (score >= 55) return { grade: 'C6', color: 'var(--accent-primary)' }
    if (score >= 50) return { grade: 'D7', color: 'var(--red)' }
    return { grade: 'F9', color: 'var(--red)' }
  }

  const predictedGrade = stats?.avgScore ? getGrade(stats.avgScore) : null

  if (loading) return (
    <div style={s.loadShell}><div style={s.spinner} /></div>
  )

  return (
    <div style={s.shell}>
      <Sidebar user={user} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main style={s.main}>
        <MobileHeader title="Performance" onMenuOpen={() => setMobileMenuOpen(true)} />
        <div style={s.topbar}>
          <div style={s.topbarTitle}>Performance</div>
        </div>
        <div style={s.content}>

          {/* Hero */}
          <div style={s.hero}>
            <div style={s.kente} />
            <div style={s.heroLeft}>
              <div style={s.heroLabel}>Predicted WASSCE grade</div>
              <div style={{ ...s.heroGrade, color: predictedGrade?.color || 'var(--ink-faint)' }}>
                {predictedGrade?.grade || '—'}
              </div>
              <div style={s.heroSub}>
                Based on {stats?.totalExams || 0} mock exams · {stats?.totalAnswered || 0} questions
              </div>
            </div>
            <div style={s.heroStats}>
              {[
                { num: `${stats?.avgScore || 0}%`, label: 'Avg score' },
                { num: `${stats?.accuracy || 0}%`, label: 'Accuracy' },
                { num: stats?.totalExams || 0, label: 'Mocks done' },
              ].map((st, i) => (
                <div key={i} style={s.heroStat}>
                  <div style={s.heroStatNum}>{st.num}</div>
                  <div style={s.heroStatLabel}>{st.label}</div>
                </div>
              ))}
            </div>
          </div>

          {mockHistory.length === 0 ? (
            <div style={s.emptyCard}>
              <div style={s.emptyIcon}>📊</div>
              <h3 style={s.emptyTitle}>No exam data yet</h3>
              <p style={s.emptySub}>Take a mock exam to start tracking your performance.</p>
              <button style={s.btnPrimary} onClick={() => navigate('/mock')}>Take a mock exam</button>
            </div>
          ) : (
            <>
              <div style={s.grid}>
                {/* Subject breakdown */}
                <div style={s.card}>
                  <h3 style={s.cardTitle}>Subject breakdown</h3>
                  {subjectStats.length === 0 ? (
                    <div style={s.empty}>No subject data yet.</div>
                  ) : subjectStats.map(sub => {
                    const { color } = getGrade(sub.score)
                    return (
                      <div key={sub.name} style={s.subjectRow}>
                        <div style={s.subjectName}>{sub.name}</div>
                        <div style={s.barWrap}>
                          <div style={{ ...s.barFill, width: `${sub.score}%`, background: color }} />
                        </div>
                        <div style={{ ...s.subjectScore, color }}>{sub.score}%</div>
                      </div>
                    )
                  })}
                </div>

                {/* Recent exams */}
                <div style={s.card}>
                  <h3 style={s.cardTitle}>Recent mock exams</h3>
                  {mockHistory.map((exam, i) => {
                    const { grade, color } = getGrade(exam.score)
                    return (
                      <div key={exam.id} style={s.examRow}
                        onClick={() => navigate(`/mock/${exam.id}/review`)}
                      >
                        <div style={s.examNum}>#{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={s.examDate}>
                            {new Date(exam.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={s.examDetail}>{exam.correct}/{exam.total} correct</div>
                        </div>
                        <div style={{ ...s.examGrade, color }}>{grade}</div>
                        <div style={{ ...s.examScore, color }}>{exam.score}%</div>
                        <div style={s.examArrow}>→</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Activity heatmap */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>Study activity — last 5 weeks</h3>
                <div style={s.heatWrap}>
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date()
                    date.setDate(date.getDate() - (34 - i))
                    const active = activityDates.has(date.toDateString())
                    return (
                      <div key={i} style={{ ...s.heatCell, background: active ? 'var(--accent-primary)' : 'rgba(255,255,255,.06)' }}
                        title={date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      />
                    )
                  })}
                </div>
                <div style={s.heatLegend}>
                  <span style={s.heatLegendText}>Less</span>
                  {['rgba(255,255,255,.06)', 'var(--accent-soft)', 'var(--accent-border)', 'var(--accent-primary)'].map((bg, i) => (
                    <div key={i} style={{ width: '12px', height: '12px', borderRadius: '3px', background: bg }} />
                  ))}
                  <span style={s.heatLegendText}>More</span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)' },
  loadShell: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '32px', height: '32px', border: '3px solid var(--border-mid)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  main: { flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', padding: '0 24px', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'var(--ff)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' },
  content: { flex: 1, padding: '20px 24px 60px' },
  hero: { background: 'var(--surface-solid)', borderRadius: 'var(--r-xl)', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: '20px' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  heroLeft: {},
  heroLabel: { fontSize: '0.68rem', fontWeight: '600', letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '6px' },
  heroGrade: { fontFamily: 'var(--ff)', fontSize: '4rem', fontWeight: '700', lineHeight: 1, marginBottom: '8px' },
  heroSub: { fontSize: '0.8rem', color: 'var(--ink-muted)' },
  heroStats: { display: 'flex', gap: '28px', flexWrap: 'wrap' },
  heroStat: { textAlign: 'center' },
  heroStatNum: { fontFamily: 'var(--ff)', fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-light)', lineHeight: 1 },
  heroStatLabel: { fontSize: '0.7rem', color: 'var(--ink-muted)', marginTop: '3px' },
  emptyCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '48px', textAlign: 'center', boxShadow: 'none' },
  emptyIcon: { fontSize: '2.5rem', marginBottom: '12px' },
  emptyTitle: { fontFamily: 'var(--ff)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '8px' },
  emptySub: { fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '20px' },
  btnPrimary: { padding: '12px 24px', background: 'var(--surface-solid)', border: 'none', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '14px', marginBottom: '14px' },
  card: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', marginBottom: '14px', boxShadow: 'none' },
  cardTitle: { fontFamily: 'var(--ff)', fontSize: '1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' },
  empty: { fontSize: '0.84rem', color: 'var(--ink-muted)', textAlign: 'center', padding: '20px 0' },
  link: { color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600' },
  subjectRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  subjectName: { fontSize: '0.82rem', color: 'var(--ink)', width: '120px', flexShrink: 0 },
  barWrap: { flex: 1, height: '5px', background: 'rgba(255,255,255,.06)', borderRadius: '3px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
  subjectScore: { fontSize: '0.8rem', fontWeight: '600', width: '36px', textAlign: 'right' },
  examRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'opacity 0.15s' },
  examNum: { fontSize: '0.7rem', color: 'var(--ink-faint)', width: '20px' },
  examDate: { fontSize: '0.82rem', color: 'var(--ink)', fontWeight: '500' },
  examDetail: { fontSize: '0.7rem', color: 'var(--ink-muted)' },
  examGrade: { fontFamily: 'var(--ff)', fontSize: '1rem', fontWeight: '700', width: '28px', textAlign: 'center' },
  examScore: { fontSize: '0.84rem', fontWeight: '600', width: '36px', textAlign: 'right' },
  examArrow: { color: 'var(--ink-faint)', fontSize: '0.8rem', marginLeft: '2px' },
  heatWrap: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' },
  heatCell: { height: '20px', borderRadius: '3px', transition: 'background 0.3s', cursor: 'default' },
  heatLegend: { display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '6px' },
  heatLegendText: { fontSize: '0.68rem', color: 'var(--ink-faint)' },
}