import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MockResults() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [stats, setStats] = useState(null)

  useEffect(() => { loadResults() }, [])

  async function loadResults() {
    const { data } = await supabase.from('mock_responses')
      .select(`*, questions(body, subjects(name), topics(name)), answer_options(body, label, is_correct)`)
      .eq('exam_id', id)
    if (!data) return
    const correct = data.filter(r => r.is_correct).length
    const total = data.length
    const score = Math.round((correct / total) * 100)
    const topicMap = {}
    data.forEach(r => {
      const topic = r.questions?.topics?.name || 'General'
      if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 }
      topicMap[topic].total++
      if (r.is_correct) topicMap[topic].correct++
    })
    setStats({ correct, total, score, topicMap, responses: data })
  }

  const getGrade = score => {
    if (score >= 80) return { grade: 'A1', color: 'var(--teal)' }
    if (score >= 75) return { grade: 'B2', color: 'var(--teal)' }
    if (score >= 70) return { grade: 'B3', color: 'var(--gold)' }
    if (score >= 65) return { grade: 'C4', color: 'var(--gold)' }
    if (score >= 60) return { grade: 'C5', color: 'var(--gold)' }
    if (score >= 55) return { grade: 'C6', color: 'var(--gold)' }
    if (score >= 50) return { grade: 'D7', color: 'var(--red)' }
    if (score >= 45) return { grade: 'E8', color: 'var(--red)' }
    return { grade: 'F9', color: 'var(--red)' }
  }

  if (!stats) return (
    <div style={s.loadShell}><div style={s.spinner} /></div>
  )

  const { grade, color } = getGrade(stats.score)
  const dashOffset = 345 - (345 * stats.score / 100)

  return (
    <div style={s.shell}>
      <div style={s.kente} />
      <div style={s.content}>
        <div style={s.hero}>
          <div style={s.heroLeft}>
            <div style={s.heroLabel}>Exam complete</div>
            <div style={{ ...s.heroGrade, color }}>{grade}</div>
            <div style={s.heroSub}>{stats.correct} correct · {stats.total - stats.correct} wrong · {stats.total} total</div>
          </div>
          <div style={s.scoreRing}>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="65" cy="65" r="55" fill="none" stroke="var(--cream-dark)" strokeWidth="10" />
              <circle cx="65" cy="65" r="55" fill="none" stroke="var(--gold)" strokeWidth="10"
                strokeLinecap="round" strokeDasharray="345" strokeDashoffset={dashOffset} />
            </svg>
            <div style={s.scoreNum}>{stats.score}%</div>
          </div>
        </div>

        <div style={s.statsRow}>
          {[
            { num: stats.correct, label: 'Correct', color: 'var(--teal)' },
            { num: stats.total - stats.correct, label: 'Wrong', color: 'var(--red)' },
            { num: `${stats.score}%`, label: 'Score', color: 'var(--gold)' },
          ].map((st, i) => (
            <div key={i} style={s.statCard}>
              <div style={{ ...s.statNum, color: st.color }}>{st.num}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>

        <div style={s.section}>
          <h3 style={s.sectionTitle}>Performance by topic</h3>
          {Object.entries(stats.topicMap).map(([topic, data]) => {
            const pct = Math.round((data.correct / data.total) * 100)
            const c = pct >= 70 ? 'var(--teal)' : pct >= 50 ? 'var(--gold)' : 'var(--red)'
            return (
              <div key={topic} style={s.topicRow}>
                <div style={s.topicName}>{topic}</div>
                <div style={s.topicBar}><div style={{ ...s.topicFill, width: `${pct}%`, background: c }} /></div>
                <div style={{ ...s.topicPct, color: c }}>{pct}%</div>
              </div>
            )
          })}
        </div>

        <div style={s.actions}>
          <button style={s.btnPrimary} onClick={() => navigate('/dashboard')}>Back to dashboard</button>
          <button style={s.btnOutline} onClick={() => navigate(`/mock/${id}/review`)}>Review answers</button>
          <button style={s.btnOutline} onClick={() => navigate('/mock')}>New exam</button>
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
  content: { maxWidth: '680px', margin: '0 auto', padding: '32px 24px' },
  hero: { background: 'var(--forest)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--r-xl)', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '24px', flexWrap: 'wrap' },
  heroLeft: {},
  heroLabel: { fontSize: '0.68rem', fontWeight: '600', letterSpacing: '0.12em', color: 'rgba(247,243,238,0.45)', textTransform: 'uppercase', marginBottom: '8px' },
  heroGrade: { fontFamily: 'var(--ff-serif)', fontSize: '3.5rem', fontWeight: '700', lineHeight: 1, marginBottom: '8px' },
  heroSub: { fontSize: '0.84rem', color: 'rgba(247,243,238,0.5)' },
  scoreRing: { position: 'relative', width: '130px', height: '130px', flexShrink: 0 },
  scoreNum: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--ff-serif)', fontSize: '1.8rem', fontWeight: '700', color: 'var(--gold-light)' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '16px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' },
  statNum: { fontFamily: 'var(--ff-serif)', fontSize: '2rem', fontWeight: '700', lineHeight: 1, marginBottom: '4px' },
  statLabel: { fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: '500' },
  section: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', marginBottom: '18px', boxShadow: 'var(--shadow-sm)' },
  sectionTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' },
  topicRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  topicName: { fontSize: '0.84rem', color: 'var(--ink)', width: '140px', flexShrink: 0 },
  topicBar: { flex: 1, height: '6px', background: 'var(--cream-mid)', borderRadius: '3px', overflow: 'hidden' },
  topicFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
  topicPct: { fontSize: '0.8rem', fontWeight: '600', width: '38px', textAlign: 'right', flexShrink: 0 },
  actions: { display: 'flex', gap: '10px' },
  btnPrimary: { flex: 1, padding: '13px', background: 'var(--forest)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  btnOutline: { flex: 1, padding: '13px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
}
