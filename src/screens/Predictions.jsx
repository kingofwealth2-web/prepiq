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

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(profile)
    const { data: subs } = await supabase.from('subjects').select('*').order('name')
    setSubjects(subs || [])
    if (subs && subs.length > 0) { setSelectedSubject(subs[0]); await loadPredictions(subs[0].id) }
  }

  async function loadPredictions(subjectId) {
    setLoading(true)
    const { data } = await supabase.from('predictions').select(`*, topics(name)`).eq('subject_id', subjectId).order('probability_score', { ascending: false })
    setPredictions(data || []); setLoading(false)
  }

  async function generatePredictions(subject) {
    setGenerating(true); setPredictions([])
    const { data: topics } = await supabase.from('topics').select('id, name').eq('subject_id', subject.id)
    const { data: questions } = await supabase.from('questions').select('topic_id, year').eq('subject_id', subject.id)
    if (!topics || topics.length === 0 || !questions || questions.length === 0) { setGenerating(false); return }
    const topicFrequency = {}
    topics.forEach(t => { topicFrequency[t.id] = { name: t.name, years: [], count: 0 } })
    questions.forEach(q => {
      if (q.topic_id && topicFrequency[q.topic_id]) {
        topicFrequency[q.topic_id].count++
        if (q.year && !topicFrequency[q.topic_id].years.includes(q.year)) topicFrequency[q.topic_id].years.push(q.year)
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
      const { data: existing } = await supabase.from('predictions').select('id').eq('subject_id', subject.id).eq('topic_id', topicId).single()
      if (existing) {
        await supabase.from('predictions').update({ probability_score: probability, pattern_type: patternType, exam_year: new Date().getFullYear(), rationale: `Appeared in ${yearCount} year(s) with ${data.count} question(s) total.`, generated_at: new Date().toISOString() }).eq('id', existing.id)
      } else {
        await supabase.from('predictions').insert({ subject_id: subject.id, topic_id: topicId, probability_score: probability, pattern_type: patternType, exam_year: new Date().getFullYear(), rationale: `Appeared in ${yearCount} year(s) with ${data.count} question(s) total.` })
      }
      newPredictions.push({ topic_id: topicId, topics: { name: data.name }, probability_score: probability, pattern_type: patternType, rationale: `Appeared in ${yearCount} year(s) with ${data.count} question(s) total.` })
    }
    newPredictions.sort((a, b) => b.probability_score - a.probability_score)
    setPredictions(newPredictions); setGenerating(false)
  }

  async function handleSubjectChange(sub) { setSelectedSubject(sub); await loadPredictions(sub.id) }

  const getPatternStyle = type => {
    if (type === 'always_appears') return { color: 'var(--gold)', label: '🔴 Always appears' }
    if (type === 'cycle_topic') return { color: '#1A5DC8', label: '🔵 Cycle topic' }
    return { color: 'var(--red)', label: '🔺 Overdue' }
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
            <div style={s.kente} />
            <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>⚠️</div>
            <div>
              <div style={s.disclaimerTitle}>These are predictions, not guarantees</div>
              <div style={s.disclaimerSub}>Based on pattern analysis of questions in our database. Use these to focus your revision smartly — not as a substitute for studying all topics.</div>
            </div>
          </div>

          <div style={s.subjectTabs}>
            {subjects.map(sub => (
              <button key={sub.id} style={{ ...s.subjectTab, ...(selectedSubject?.id === sub.id ? s.subjectTabActive : {}) }}
                onClick={() => handleSubjectChange(sub)}>{sub.name}</button>
            ))}
          </div>

          {predictions.length === 0 && !loading && !generating && (
            <div style={s.emptyCard}>
              <div style={s.emptyIcon}>🔮</div>
              <h3 style={s.emptyTitle}>No predictions yet for {selectedSubject?.name}</h3>
              <p style={s.emptySub}>Generate AI predictions based on question frequency patterns in our database.</p>
              <button style={s.btnPrimary} onClick={() => generatePredictions(selectedSubject)}>Generate predictions</button>
            </div>
          )}

          {(generating || loading) && (
            <div style={s.emptyCard}>
              <div style={s.genDots}>
                {[0,0.2,0.4].map((d,i) => <div key={i} style={{ width:'10px', height:'10px', borderRadius:'50%', background:'var(--gold)', animation:'pulse 1s infinite', animationDelay:`${d}s` }} />)}
              </div>
              <h3 style={s.emptyTitle}>{generating ? 'Analysing patterns...' : 'Loading predictions...'}</h3>
              <p style={s.emptySub}>Calculating topic probability scores from question frequency data.</p>
            </div>
          )}

          {predictions.length > 0 && (
            <>
              <div style={s.predHeader}>
                <h3 style={s.predTitle}>Most likely topics — {new Date().getFullYear()}</h3>
                <button style={s.regenBtn} onClick={() => generatePredictions(selectedSubject)}>Regenerate</button>
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
                        <div style={{ ...s.predPattern, color: style.color }}>{style.label}</div>
                      </div>
                      <div style={s.predRationale}>{pred.rationale}</div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>Probability</span>
                          <span style={{ fontSize: '0.76rem', fontWeight: '600', color: style.color }}>{pct}%</span>
                        </div>
                        <div style={s.predBar}><div style={{ ...s.predBarFill, width: `${pct}%`, background: style.color }} /></div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <button style={s.btnPrimary} onClick={() => navigate('/mock')}>Take predicted mock exam (coming soon)</button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--surface-mid)', fontFamily: 'var(--ff-sans)' },
  main: { flex: 1, marginLeft: '220px', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' },
  topbarBadge: { background: 'var(--gold-pale)', color: 'var(--gold)', border: '1px solid var(--gold-border)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  content: { flex: 1, padding: '24px 28px 60px', maxWidth: '800px' },
  disclaimer: { background: 'var(--forest)', borderRadius: 'var(--r-lg)', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '18px', position: 'relative', overflow: 'hidden' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  disclaimerTitle: { fontSize: '0.86rem', fontWeight: '600', color: 'var(--gold-light)', marginBottom: '4px' },
  disclaimerSub: { fontSize: '0.78rem', color: 'rgba(247,243,238,0.5)', lineHeight: 1.5 },
  subjectTabs: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '22px' },
  subjectTab: { padding: '7px 15px', background: 'var(--surface)', border: '1.5px solid var(--border-mid)', borderRadius: '20px', color: 'var(--ink-muted)', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--ff-sans)', transition: 'all 0.15s' },
  subjectTabActive: { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-pale)' },
  emptyCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '40px', textAlign: 'center', marginBottom: '18px', boxShadow: 'var(--shadow-sm)' },
  emptyIcon: { fontSize: '2.5rem', marginBottom: '12px' },
  emptyTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '8px' },
  emptySub: { fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '20px' },
  genDots: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' },
  btnPrimary: { width: '100%', padding: '13px', background: 'var(--forest)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  predHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  predTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)' },
  regenBtn: { background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink-muted)', fontSize: '0.78rem', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  predCard: { display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' },
  predAccent: { width: '4px', flexShrink: 0 },
  predCardContent: { flex: 1, padding: '15px 18px' },
  predCardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', flexWrap: 'wrap', gap: '8px' },
  predTopic: { fontSize: '0.92rem', fontWeight: '600', color: 'var(--ink)' },
  predPattern: { fontSize: '0.72rem', fontWeight: '600' },
  predRationale: { fontSize: '0.76rem', color: 'var(--ink-muted)', marginBottom: '10px' },
  predBar: { height: '5px', background: 'var(--cream-mid)', borderRadius: '3px', overflow: 'hidden' },
  predBarFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
}
