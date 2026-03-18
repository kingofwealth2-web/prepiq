import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Predictions() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(profile)
    const { data: subs } = await supabase.from('subjects').select('*').order('name')
    setSubjects(subs || [])
    if (subs && subs.length > 0) {
      setSelectedSubject(subs[0])
      await loadPredictions(subs[0].id)
    }
  }

  async function loadPredictions(subjectId) {
    setLoading(true)
    const { data } = await supabase
      .from('predictions')
      .select(`*, topics(name)`)
      .eq('subject_id', subjectId)
      .order('probability_score', { ascending: false })
    setPredictions(data || [])
    setLoading(false)
  }

  async function generatePredictions(subject) {
    setGenerating(true)
    setPredictions([])

    const { data: topics } = await supabase
      .from('topics')
      .select('id, name')
      .eq('subject_id', subject.id)

    const { data: questions } = await supabase
      .from('questions')
      .select('topic_id, year')
      .eq('subject_id', subject.id)

    if (!topics || topics.length === 0 || !questions || questions.length === 0) {
      setGenerating(false)
      return
    }

    const topicFrequency = {}
    topics.forEach(t => { topicFrequency[t.id] = { name: t.name, years: [], count: 0 } })
    questions.forEach(q => {
      if (q.topic_id && topicFrequency[q.topic_id]) {
        topicFrequency[q.topic_id].count++
        if (q.year && !topicFrequency[q.topic_id].years.includes(q.year)) {
          topicFrequency[q.topic_id].years.push(q.year)
        }
      }
    })

    const maxCount = Math.max(...Object.values(topicFrequency).map(t => t.count), 1)

    const newPredictions = []
    for (const [topicId, data] of Object.entries(topicFrequency)) {
      if (data.count === 0) continue
      const probability = Math.min(0.95, (data.count / maxCount) * 0.7 + 0.25)
      const yearCount = data.years.length
      let patternType = 'always_appears'
      if (yearCount <= 1) patternType = 'overdue'
      else if (yearCount <= 2) patternType = 'cycle_topic'

      const { data: existing } = await supabase
        .from('predictions')
        .select('id')
        .eq('subject_id', subject.id)
        .eq('topic_id', topicId)
        .single()

      if (existing) {
        await supabase.from('predictions').update({
          probability_score: probability,
          pattern_type: patternType,
          exam_year: new Date().getFullYear(),
          rationale: `Appeared in ${yearCount} year(s) with ${data.count} question(s) total.`,
          generated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        await supabase.from('predictions').insert({
          subject_id: subject.id,
          topic_id: topicId,
          probability_score: probability,
          pattern_type: patternType,
          exam_year: new Date().getFullYear(),
          rationale: `Appeared in ${yearCount} year(s) with ${data.count} question(s) total.`,
        })
      }
      newPredictions.push({ topic_id: topicId, topics: { name: data.name }, probability_score: probability, pattern_type: patternType, rationale: `Appeared in ${yearCount} year(s) with ${data.count} question(s) total.` })
    }

    newPredictions.sort((a, b) => b.probability_score - a.probability_score)
    setPredictions(newPredictions)
    setGenerating(false)
  }

  async function handleSubjectChange(sub) {
    setSelectedSubject(sub)
    await loadPredictions(sub.id)
  }

  const getPatternStyle = (type) => {
    if (type === 'always_appears') return { bg: 'rgba(240,165,0,0.1)', color: '#F0A500', label: '🔴 Always appears' }
    if (type === 'cycle_topic') return { bg: 'rgba(74,158,255,0.1)', color: '#4A9EFF', label: '🔵 Cycle topic' }
    return { bg: 'rgba(255,107,107,0.1)', color: '#FF6B6B', label: '🔺 Overdue' }
  }

  return (
    <div style={s.shell}>
      <Sidebar user={user} />
      <main style={s.main}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>Predictions</div>
          <div style={s.topbarBadge}>WASSCE {new Date().getFullYear()} Analysis</div>
        </div>
        <div style={s.content}>

          <div style={s.disclaimer}>
            <div style={s.disclaimerKente} />
            <div style={s.disclaimerIcon}>⚠️</div>
            <div>
              <div style={s.disclaimerTitle}>These are predictions, not guarantees</div>
              <div style={s.disclaimerSub}>Based on pattern analysis of questions in our database. Use these to focus your revision smartly — not as a substitute for studying all topics.</div>
            </div>
          </div>

          <div style={s.subjectTabs}>
            {subjects.map(sub => (
              <button key={sub.id}
                style={{ ...s.subjectTab, ...(selectedSubject?.id === sub.id ? s.subjectTabActive : {}) }}
                onClick={() => handleSubjectChange(sub)}>
                {sub.name}
              </button>
            ))}
          </div>

          {predictions.length === 0 && !loading && !generating && (
            <div style={s.emptyCard}>
              <div style={s.emptyIcon}>🔮</div>
              <div style={s.emptyTitle}>No predictions yet for {selectedSubject?.name}</div>
              <div style={s.emptySub}>Generate AI predictions based on question frequency patterns in our database.</div>
              <button style={s.btnGold} onClick={() => generatePredictions(selectedSubject)}>
                Generate predictions
              </button>
            </div>
          )}

          {generating && (
            <div style={s.emptyCard}>
              <div style={s.genDots}>
                <div style={s.genDot} />
                <div style={{ ...s.genDot, animationDelay: '0.2s' }} />
                <div style={{ ...s.genDot, animationDelay: '0.4s' }} />
              </div>
              <div style={s.emptyTitle}>Analysing patterns...</div>
              <div style={s.emptySub}>Calculating topic probability scores from question frequency data.</div>
            </div>
          )}

          {loading && (
            <div style={s.emptyCard}>
              <div style={s.emptyTitle}>Loading predictions...</div>
            </div>
          )}

          {predictions.length > 0 && (
            <>
              <div style={s.predHeader}>
                <h3 style={s.predTitle}>Most likely topics — {new Date().getFullYear()}</h3>
                <button style={s.regenBtn} onClick={() => generatePredictions(selectedSubject)}>
                  Regenerate
                </button>
              </div>
              {predictions.map((pred, i) => {
                const style = getPatternStyle(pred.pattern_type)
                const pct = Math.round(pred.probability_score * 100)
                return (
                  <div key={pred.topic_id || i} style={s.predCard}>
                    <div style={{ ...s.predAccent, background: style.color }} />
                    <div style={s.predCardContent}>
                      <div style={s.predCardHeader}>
                        <div style={s.predTopic}>{pred.topics?.name}</div>
                        <div style={{ ...s.predPattern, background: style.bg, color: style.color }}>
                          {style.label}
                        </div>
                      </div>
                      <div style={s.predRationale}>{pred.rationale}</div>
                      <div style={s.predBarWrap}>
                        <div style={s.predBarRow}>
                          <span style={s.predBarLabel}>Probability</span>
                          <span style={{ ...s.predBarPct, color: style.color }}>{pct}%</span>
                        </div>
                        <div style={s.predBar}>
                          <div style={{ ...s.predBarFill, width: `${pct}%`, background: style.color }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <button style={s.btnGold} onClick={() => navigate('/mock')}>
                Take predicted mock exam (coming soon)
              </button>
            </>
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
  topbarBadge: { background: 'rgba(240,165,0,0.1)', color: '#F0A500', border: '1px solid rgba(240,165,0,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  content: { flex: 1, padding: '28px', paddingBottom: '60px', maxWidth: '800px' },
  disclaimer: { background: '#161B22', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px', position: 'relative', overflow: 'hidden' },
  disclaimerKente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#F0A500 0,#F0A500 20px,#00C896 20px,#00C896 40px,#FF6B6B 40px,#FF6B6B 60px,#4A9EFF 60px,#4A9EFF 80px)' },
  disclaimerIcon: { fontSize: '1.4rem', flexShrink: 0 },
  disclaimerTitle: { fontSize: '0.88rem', fontWeight: '600', color: '#F0A500', marginBottom: '4px' },
  disclaimerSub: { fontSize: '0.8rem', color: '#8B949E' },
  subjectTabs: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' },
  subjectTab: { padding: '8px 16px', background: '#161B22', border: '1.5px solid rgba(240,246,252,0.08)', borderRadius: '20px', color: '#8B949E', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' },
  subjectTabActive: { borderColor: '#F0A500', color: '#F0A500', background: 'rgba(240,165,0,0.08)' },
  emptyCard: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '16px', padding: '40px', textAlign: 'center', marginBottom: '20px' },
  emptyIcon: { fontSize: '2.5rem', marginBottom: '12px' },
  emptyTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: '600', color: '#F0F6FC', marginBottom: '8px' },
  emptySub: { fontSize: '0.85rem', color: '#8B949E', marginBottom: '20px' },
  genDots: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' },
  genDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#F0A500', animation: 'pulse 1s infinite' },
  btnGold: { width: '100%', padding: '13px', background: '#F0A500', border: 'none', borderRadius: '8px', color: '#0D1117', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  predHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  predTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: '600', color: '#F0F6FC' },
  regenBtn: { background: 'transparent', border: '1.5px solid rgba(240,246,252,0.1)', borderRadius: '8px', color: '#8B949E', fontSize: '0.8rem', padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  predCard: { display: 'flex', background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden' },
  predAccent: { width: '4px', flexShrink: 0 },
  predCardContent: { flex: 1, padding: '16px 18px' },
  predCardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' },
  predTopic: { fontSize: '0.95rem', fontWeight: '600', color: '#F0F6FC' },
  predPattern: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  predRationale: { fontSize: '0.78rem', color: '#8B949E', marginBottom: '10px' },
  predBarWrap: {},
  predBarRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  predBarLabel: { fontSize: '0.72rem', color: '#8B949E' },
  predBarPct: { fontSize: '0.78rem', fontWeight: '600' },
  predBar: { height: '6px', background: '#1C2330', borderRadius: '3px', overflow: 'hidden' },
  predBarFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
}