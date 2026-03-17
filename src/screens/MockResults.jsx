import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MockResults() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadResults()
  }, [])

  async function loadResults() {
    const { data } = await supabase
      .from('mock_responses')
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

  const getGrade = (score) => {
    if (score >= 80) return { grade:'A1', color:'#00C896' }
    if (score >= 75) return { grade:'B2', color:'#00C896' }
    if (score >= 70) return { grade:'B3', color:'#F0A500' }
    if (score >= 65) return { grade:'C4', color:'#F0A500' }
    if (score >= 60) return { grade:'C5', color:'#F0A500' }
    if (score >= 55) return { grade:'C6', color:'#F0A500' }
    if (score >= 50) return { grade:'D7', color:'#FF6B6B' }
    if (score >= 45) return { grade:'E8', color:'#FF6B6B' }
    return { grade:'F9', color:'#FF6B6B' }
  }

  if (!stats) return (
    <div style={s.loadShell}>
      <div style={s.loadText}>Loading results...</div>
    </div>
  )

  const { grade, color } = getGrade(stats.score)
  const dashOffset = 345 - (345 * stats.score / 100)

  return (
    <div style={s.shell}>
      <div style={s.content}>

        {/* HERO */}
        <div style={s.hero}>
          <div style={s.heroKente} />
          <div style={s.scoreRing}>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="65" cy="65" r="55" fill="none" stroke="rgba(240,246,252,0.1)" strokeWidth="10" />
              <circle cx="65" cy="65" r="55" fill="none" stroke="#F0A500" strokeWidth="10"
                strokeLinecap="round" strokeDasharray="345"
                strokeDashoffset={dashOffset} />
            </svg>
            <div style={s.scoreNum}>{stats.score}%</div>
          </div>
          <div style={s.heroText}>
            <div style={s.heroLabel}>Exam complete</div>
            <div style={{ ...s.heroGrade, color }}>Grade: {grade}</div>
            <div style={s.heroSub}>{stats.correct} correct · {stats.total - stats.correct} wrong · {stats.total} total</div>
          </div>
        </div>

        {/* STATS */}
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color:'#00C896' }}>{stats.correct}</div>
            <div style={s.statLabel}>Correct</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color:'#FF6B6B' }}>{stats.total - stats.correct}</div>
            <div style={s.statLabel}>Wrong</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statNum}>{stats.score}%</div>
            <div style={s.statLabel}>Score</div>
          </div>
        </div>

        {/* TOPIC BREAKDOWN */}
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Performance by topic</h3>
          {Object.entries(stats.topicMap).map(([topic, data]) => {
            const pct = Math.round((data.correct / data.total) * 100)
            const color = pct >= 70 ? '#00C896' : pct >= 50 ? '#F0A500' : '#FF6B6B'
            return (
              <div key={topic} style={s.topicRow}>
                <div style={s.topicName}>{topic}</div>
                <div style={s.topicBar}>
                  <div style={{ ...s.topicFill, width:`${pct}%`, background:color }} />
                </div>
                <div style={{ ...s.topicPct, color }}>{pct}%</div>
              </div>
            )
          })}
        </div>

        {/* ACTIONS */}
        <div style={s.actions}>
          <button style={s.btnGold} onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
          <button style={s.btnOutline} onClick={() => navigate('/mock')}>
            Take another exam
          </button>
        </div>

      </div>
    </div>
  )
}

const s = {
  shell: { minHeight:'100vh', background:'#0D1117', fontFamily:'DM Sans, sans-serif' },
  loadShell: { minHeight:'100vh', background:'#0D1117', display:'flex', alignItems:'center', justifyContent:'center' },
  loadText: { color:'#8B949E' },
  content: { maxWidth:'700px', margin:'0 auto', padding:'28px' },
  hero: { background:'#161B22', border:'1px solid rgba(240,246,252,0.06)', borderRadius:'18px', padding:'36px', display:'flex', alignItems:'center', gap:'32px', marginBottom:'20px', position:'relative', overflow:'hidden', flexWrap:'wrap' },
  heroKente: { position:'absolute', top:0, left:0, right:0, height:'3px', background:'repeating-linear-gradient(90deg,#F0A500 0,#F0A500 20px,#00C896 20px,#00C896 40px,#FF6B6B 40px,#FF6B6B 60px,#4A9EFF 60px,#4A9EFF 80px)' },
  scoreRing: { position:'relative', width:'130px', height:'130px', flexShrink:0 },
  scoreNum: { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:'Georgia, serif', fontSize:'1.8rem', fontWeight:'700', color:'#F0A500' },
  heroText: { flex:1 },
  heroLabel: { fontSize:'0.75rem', fontWeight:'600', letterSpacing:'0.1em', color:'#8B949E', textTransform:'uppercase', marginBottom:'6px' },
  heroGrade: { fontFamily:'Georgia, serif', fontSize:'2rem', fontWeight:'700', marginBottom:'6px' },
  heroSub: { fontSize:'0.85rem', color:'#8B949E' },
  statsRow: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'20px' },
  statCard: { background:'#161B22', border:'1px solid rgba(240,246,252,0.06)', borderRadius:'12px', padding:'16px', textAlign:'center' },
  statNum: { fontFamily:'Georgia, serif', fontSize:'2rem', fontWeight:'700', color:'#F0A500', marginBottom:'4px' },
  statLabel: { fontSize:'0.75rem', color:'#8B949E' },
  section: { background:'#161B22', border:'1px solid rgba(240,246,252,0.06)', borderRadius:'14px', padding:'20px', marginBottom:'20px' },
  sectionTitle: { fontFamily:'Georgia, serif', fontSize:'1rem', fontWeight:'600', color:'#F0F6FC', marginBottom:'16px' },
  topicRow: { display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' },
  topicName: { fontSize:'0.85rem', color:'#F0F6FC', width:'140px', flexShrink:0 },
  topicBar: { flex:1, height:'6px', background:'#1C2330', borderRadius:'3px', overflow:'hidden' },
  topicFill: { height:'100%', borderRadius:'3px', transition:'width 1s ease' },
  topicPct: { fontSize:'0.82rem', fontWeight:'600', width:'40px', textAlign:'right', flexShrink:0 },
  actions: { display:'flex', gap:'12px' },
  btnGold: { flex:1, padding:'14px', background:'#F0A500', border:'none', borderRadius:'8px', color:'#0D1117', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
  btnOutline: { flex:1, padding:'14px', background:'transparent', border:'1.5px solid rgba(240,246,252,0.1)', borderRadius:'8px', color:'#F0F6FC', fontWeight:'600', fontSize:'0.9rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
}