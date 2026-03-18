import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import { useMobileMenu } from '../App'

// Curated high-frequency WASSCE topics based on historical WAEC patterns
const FALLBACK_PREDICTIONS = {
  'Core Mathematics': [
    { topic: 'Quadratic equations', probability: 0.95, pattern: 'always_appears', rationale: 'Appeared in every WASSCE paper for the past 10 years.' },
    { topic: 'Linear equations & inequalities', probability: 0.92, pattern: 'always_appears', rationale: 'Core algebra — consistently tested in both OBJ and theory.' },
    { topic: 'Mensuration (areas & volumes)', probability: 0.90, pattern: 'always_appears', rationale: 'Geometry topics appear in every paper, especially circles and cylinders.' },
    { topic: 'Trigonometry', probability: 0.88, pattern: 'always_appears', rationale: 'Sin, cos, tan and their applications appear every year.' },
    { topic: 'Statistics & probability', probability: 0.85, pattern: 'cycle_topic', rationale: 'Mean, median, mode and basic probability tested regularly.' },
    { topic: 'Indices & logarithms', probability: 0.82, pattern: 'cycle_topic', rationale: 'Laws of indices and log equations are high-frequency.' },
    { topic: 'Vectors & transformation', probability: 0.75, pattern: 'cycle_topic', rationale: 'Appears in alternating years — due this cycle.' },
    { topic: 'Sequences & series', probability: 0.70, pattern: 'overdue', rationale: 'AP and GP patterns — overdue for a paper appearance.' },
  ],
  'English Language': [
    { topic: 'Comprehension', probability: 0.98, pattern: 'always_appears', rationale: 'Comprehension passages are in every WASSCE English paper.' },
    { topic: 'Summary writing', probability: 0.95, pattern: 'always_appears', rationale: 'Summary is a fixed section of every paper.' },
    { topic: 'Essay writing (argumentative)', probability: 0.90, pattern: 'always_appears', rationale: 'Argumentative essays appear most frequently in Section A.' },
    { topic: 'Lexis & structure', probability: 0.88, pattern: 'always_appears', rationale: 'Vocabulary and sentence structure tested every year.' },
    { topic: 'Letter writing', probability: 0.80, pattern: 'cycle_topic', rationale: 'Formal and informal letters alternate with articles.' },
    { topic: 'Speech writing', probability: 0.72, pattern: 'overdue', rationale: 'Speech format has been absent for 2 years — likely overdue.' },
  ],
  'Physics': [
    { topic: 'Mechanics (Newton\'s laws)', probability: 0.95, pattern: 'always_appears', rationale: 'Forces, motion and Newton\'s laws appear every year.' },
    { topic: 'Electricity & magnetism', probability: 0.92, pattern: 'always_appears', rationale: 'Ohm\'s law, circuits and electromagnets are constant fixtures.' },
    { topic: 'Waves & optics', probability: 0.88, pattern: 'always_appears', rationale: 'Light, reflection, refraction and wave properties tested annually.' },
    { topic: 'Thermal physics', probability: 0.84, pattern: 'always_appears', rationale: 'Heat, temperature and thermometry appear in every paper.' },
    { topic: 'Work, energy & power', probability: 0.82, pattern: 'cycle_topic', rationale: 'Energy conservation and power calculations tested regularly.' },
    { topic: 'Atomic & nuclear physics', probability: 0.75, pattern: 'cycle_topic', rationale: 'Radioactivity and atomic structure appear frequently.' },
    { topic: 'Pressure & fluids', probability: 0.68, pattern: 'overdue', rationale: 'Pressure in liquids and Archimedes\' principle — due this year.' },
  ],
  'Chemistry': [
    { topic: 'Atomic structure & bonding', probability: 0.94, pattern: 'always_appears', rationale: 'Electronic configuration and bonding types appear every year.' },
    { topic: 'Acids, bases & salts', probability: 0.92, pattern: 'always_appears', rationale: 'pH, neutralisation and salt preparation are constant.' },
    { topic: 'Stoichiometry & moles', probability: 0.88, pattern: 'always_appears', rationale: 'Mole calculations and reacting masses tested every year.' },
    { topic: 'Electrolysis', probability: 0.85, pattern: 'always_appears', rationale: 'Electrolytic cells and products of electrolysis appear annually.' },
    { topic: 'Organic chemistry (hydrocarbons)', probability: 0.84, pattern: 'cycle_topic', rationale: 'Alkanes, alkenes and their reactions are highly tested.' },
    { topic: 'Rates of reaction', probability: 0.78, pattern: 'cycle_topic', rationale: 'Factors affecting reaction rates tested regularly.' },
    { topic: 'Equilibrium & Le Chatelier', probability: 0.72, pattern: 'overdue', rationale: 'Chemical equilibrium — absent last 2 years, likely returning.' },
  ],
  'Biology': [
    { topic: 'Cell biology', probability: 0.96, pattern: 'always_appears', rationale: 'Cell structure, organelles and cell division in every paper.' },
    { topic: 'Nutrition & digestion', probability: 0.92, pattern: 'always_appears', rationale: 'Balanced diet, digestive system tested annually.' },
    { topic: 'Genetics & heredity', probability: 0.90, pattern: 'always_appears', rationale: 'Mendelian genetics and inheritance patterns every year.' },
    { topic: 'Photosynthesis & respiration', probability: 0.88, pattern: 'always_appears', rationale: 'Both processes tested every single year.' },
    { topic: 'Ecology & environment', probability: 0.85, pattern: 'cycle_topic', rationale: 'Food chains, ecosystems and population dynamics.' },
    { topic: 'Transport in plants & animals', probability: 0.82, pattern: 'cycle_topic', rationale: 'Xylem, phloem, heart and circulatory system.' },
    { topic: 'Reproduction', probability: 0.78, pattern: 'overdue', rationale: 'Sexual and asexual reproduction — due for theory section.' },
  ],
  'Elective Mathematics': [
    { topic: 'Calculus (differentiation)', probability: 0.95, pattern: 'always_appears', rationale: 'Derivatives and their applications appear every year.' },
    { topic: 'Calculus (integration)', probability: 0.92, pattern: 'always_appears', rationale: 'Definite and indefinite integrals tested annually.' },
    { topic: 'Matrices & determinants', probability: 0.90, pattern: 'always_appears', rationale: '2x2 and 3x3 matrices appear in every paper.' },
    { topic: 'Vectors', probability: 0.88, pattern: 'always_appears', rationale: 'Vector operations and applications consistently tested.' },
    { topic: 'Probability distributions', probability: 0.82, pattern: 'cycle_topic', rationale: 'Binomial and normal distributions tested regularly.' },
    { topic: 'Complex numbers', probability: 0.75, pattern: 'overdue', rationale: 'Argand diagrams and complex arithmetic — due this year.' },
  ],
  'Social Studies': [
    { topic: 'Governance & democracy', probability: 0.94, pattern: 'always_appears', rationale: 'Government systems and democratic values in every paper.' },
    { topic: 'Ghana\'s economy', probability: 0.90, pattern: 'always_appears', rationale: 'Economic development and resources tested annually.' },
    { topic: 'Culture & identity', probability: 0.86, pattern: 'always_appears', rationale: 'Ghanaian culture, values and national identity.' },
    { topic: 'Population & migration', probability: 0.82, pattern: 'cycle_topic', rationale: 'Population dynamics and migration patterns tested regularly.' },
    { topic: 'Environmental issues', probability: 0.78, pattern: 'cycle_topic', rationale: 'Pollution, conservation and climate change.' },
    { topic: 'Regional integration (ECOWAS)', probability: 0.74, pattern: 'overdue', rationale: 'West African integration — overdue for a paper appearance.' },
  ],
  'Integrated Science': [
    { topic: 'Nutrition & health', probability: 0.94, pattern: 'always_appears', rationale: 'Food nutrients, deficiency diseases in every paper.' },
    { topic: 'Reproduction', probability: 0.90, pattern: 'always_appears', rationale: 'Human reproduction and STIs tested annually.' },
    { topic: 'Forces & motion', probability: 0.86, pattern: 'always_appears', rationale: 'Basic mechanics appear in every integrated science paper.' },
    { topic: 'Matter & its properties', probability: 0.84, pattern: 'cycle_topic', rationale: 'States of matter and changes of state.' },
    { topic: 'Electricity', probability: 0.80, pattern: 'cycle_topic', rationale: 'Simple circuits and electrical energy tested regularly.' },
    { topic: 'Ecology', probability: 0.76, pattern: 'overdue', rationale: 'Ecosystems and environmental management.' },
  ],
}

function getFallbackPredictions(subjectName) {
  // Try exact match first
  if (FALLBACK_PREDICTIONS[subjectName]) return FALLBACK_PREDICTIONS[subjectName]
  // Try partial match
  const key = Object.keys(FALLBACK_PREDICTIONS).find(k =>
    subjectName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(subjectName.toLowerCase())
  )
  return key ? FALLBACK_PREDICTIONS[key] : null
}

export default function Predictions() {
  const navigate = useNavigate()
  const { open: mobileMenuOpen, setOpen: setMobileMenuOpen } = useMobileMenu()
  const [user, setUser] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(profile)
    const { data: subs } = await supabase.from('subjects').select('*').order('name')
    const seen = new Set()
    const unique = (subs || []).filter(s => { if (seen.has(s.name)) return false; seen.add(s.name); return true })
    setSubjects(unique)
    if (unique.length > 0) {
      setSelectedSubject(unique[0])
      await loadPredictions(unique[0])
    }
  }

  async function loadPredictions(subject) {
    setLoading(true)
    setPredictions([])
    setUsingFallback(false)

    const { data } = await supabase
      .from('predictions').select(`*, topics(name)`)
      .eq('subject_id', subject.id)
      .order('probability_score', { ascending: false })

    if (data && data.length > 0) {
      setPredictions(data)
      setUsingFallback(false)
    } else {
      // No DB data — use curated fallback
      const fallback = getFallbackPredictions(subject.name)
      if (fallback) {
        setPredictions(fallback.map((f, i) => ({
          id: `fallback-${i}`,
          topics: { name: f.topic },
          probability_score: f.probability,
          pattern_type: f.pattern,
          rationale: f.rationale,
          _fallback: true,
        })))
        setUsingFallback(true)
      }
    }
    setLoading(false)
  }

  async function generatePredictions(subject) {
    setGenerating(true); setPredictions([])
    const { data: topics } = await supabase.from('topics').select('id, name').eq('subject_id', subject.id)
    const { data: questions } = await supabase.from('questions').select('topic_id, year').eq('subject_id', subject.id)

    if (!topics || topics.length === 0 || !questions || questions.length === 0) {
      // No question data in DB — just show fallback
      const fallback = getFallbackPredictions(subject.name)
      if (fallback) {
        setPredictions(fallback.map((f, i) => ({
          id: `fallback-${i}`,
          topics: { name: f.topic },
          probability_score: f.probability,
          pattern_type: f.pattern,
          rationale: f.rationale,
          _fallback: true,
        })))
        setUsingFallback(true)
      }
      setGenerating(false)
      return
    }

    const topicFrequency = {}
    topics.forEach(t => { topicFrequency[t.id] = { name: t.name, years: [], count: 0 } })
    questions.forEach(q => {
      if (q.topic_id && topicFrequency[q.topic_id]) {
        topicFrequency[q.topic_id].count++
        if (q.year && !topicFrequency[q.topic_id].years.includes(q.year))
          topicFrequency[q.topic_id].years.push(q.year)
      }
    })

    const maxCount = Math.max(...Object.values(topicFrequency).map(t => t.count), 1)
    const newPredictions = []

    for (const [topicId, data] of Object.entries(topicFrequency)) {
      if (data.count === 0) continue
      const probability = Math.min(0.95, (data.count / maxCount) * 0.7 + 0.25)
      const yearCount = data.years.length
      const patternType = yearCount <= 1 ? 'overdue' : yearCount <= 2 ? 'cycle_topic' : 'always_appears'

      const { data: existing } = await supabase.from('predictions').select('id')
        .eq('subject_id', subject.id).eq('topic_id', topicId).single()

      const payload = {
        probability_score: probability, pattern_type: patternType,
        exam_year: new Date().getFullYear(),
        rationale: `Appeared in ${yearCount} year(s) with ${data.count} question(s) total.`,
      }

      if (existing) {
        await supabase.from('predictions').update({ ...payload, generated_at: new Date().toISOString() }).eq('id', existing.id)
      } else {
        await supabase.from('predictions').insert({ subject_id: subject.id, topic_id: topicId, ...payload })
      }

      newPredictions.push({
        topic_id: topicId,
        topics: { name: data.name },
        probability_score: probability,
        pattern_type: patternType,
        rationale: payload.rationale,
      })
    }

    newPredictions.sort((a, b) => b.probability_score - a.probability_score)
    setPredictions(newPredictions)
    setUsingFallback(false)
    setGenerating(false)
  }

  async function handleSubjectChange(sub) {
    setSelectedSubject(sub)
    await loadPredictions(sub)
  }

  const getPatternStyle = type => {
    if (type === 'always_appears') return { color: 'var(--gold)', label: '🔴 Always appears' }
    if (type === 'cycle_topic') return { color: '#1A5DC8', label: '🔵 Cycle topic' }
    return { color: 'var(--red)', label: '🔺 Overdue' }
  }

  return (
    <div style={s.shell}>
      <Sidebar user={user} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main style={s.main}>
        <MobileHeader title="Predictions" onMenuOpen={() => setMobileMenuOpen(true)} />
        <div style={{...s.topbar, display: 'flex'}}>
          <div style={s.topbarTitle}>Predictions</div>
          <div style={s.topbarBadge}>WASSCE {new Date().getFullYear()}</div>
        </div>
        <div style={s.content} className="has-bottom-nav">

          <div style={s.disclaimer}>
            <div style={s.kente} />
            <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</div>
            <div>
              <div style={s.disclaimerTitle}>Predictions, not guarantees</div>
              <div style={s.disclaimerSub}>Based on WAEC pattern analysis. Use these to guide your revision — not replace it.</div>
            </div>
          </div>

          {usingFallback && (
            <div style={s.fallbackBanner}>
              <span style={s.fallbackIcon}>📊</span>
              <div>
                <div style={s.fallbackTitle}>Showing curated predictions</div>
                <div style={s.fallbackSub}>These are based on historical WAEC patterns. Once you have more questions in your bank, predictions will be personalised to your data.</div>
              </div>
            </div>
          )}

          <div style={s.subjectTabs}>
            {subjects.map(sub => (
              <button key={sub.id}
                style={{ ...s.subjectTab, ...(selectedSubject?.id === sub.id ? s.subjectTabActive : {}) }}
                onClick={() => handleSubjectChange(sub)}>
                {sub.name}
              </button>
            ))}
          </div>

          {(loading || generating) && (
            <div style={s.loadingCard}>
              <div style={s.genDots}>
                {[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ ...s.genDot, animationDelay: `${d}s` }} />)}
              </div>
              <div style={s.loadingText}>{generating ? 'Analysing question patterns...' : 'Loading predictions...'}</div>
            </div>
          )}

          {!loading && !generating && predictions.length === 0 && (
            <div style={s.emptyCard}>
              <div style={s.emptyIcon}>🔮</div>
              <h3 style={s.emptyTitle}>No predictions for {selectedSubject?.name}</h3>
              <p style={s.emptySub}>Generate predictions based on question frequency data in your question bank.</p>
              <button style={s.btnPrimary} onClick={() => generatePredictions(selectedSubject)}>Generate predictions</button>
            </div>
          )}

          {!loading && !generating && predictions.length > 0 && (
            <>
              <div style={s.predHeader}>
                <h3 style={s.predTitle}>Most likely topics — {new Date().getFullYear()}</h3>
                {!usingFallback && (
                  <button style={s.regenBtn} onClick={() => generatePredictions(selectedSubject)}>Refresh</button>
                )}
              </div>
              {predictions.map((pred, i) => {
                const ps = getPatternStyle(pred.pattern_type)
                const pct = Math.round(pred.probability_score * 100)
                return (
                  <div key={pred.id || pred.topic_id || i} style={s.predCard}>
                    <div style={{ ...s.predAccent, background: ps.color }} />
                    <div style={s.predCardContent}>
                      <div style={s.predCardHeader}>
                        <div style={s.predTopic}>{pred.topics?.name}</div>
                        <div style={{ ...s.predPattern, color: ps.color }}>{ps.label}</div>
                      </div>
                      <div style={s.predRationale}>{pred.rationale}</div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>Probability</span>
                          <span style={{ fontSize: '0.76rem', fontWeight: '600', color: ps.color }}>{pct}%</span>
                        </div>
                        <div style={s.predBar}>
                          <div style={{ ...s.predBarFill, width: `${pct}%`, background: ps.color }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <button style={s.btnPrimary} onClick={() => navigate('/mock')}>
                Take a mock exam using these topics
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--cream)', fontFamily: 'var(--ff-sans)' },
  main: { flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' },
  topbarBadge: { background: 'var(--gold-pale)', color: 'var(--gold)', border: '1px solid var(--gold-border)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  content: { flex: 1, padding: '20px 20px 60px', maxWidth: '800px' },
  disclaimer: { background: 'var(--forest-mid)', borderRadius: 'var(--r-lg)', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', position: 'relative', overflow: 'hidden' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  disclaimerTitle: { fontSize: '0.84rem', fontWeight: '600', color: 'var(--gold-light)', marginBottom: '3px' },
  disclaimerSub: { fontSize: '0.76rem', color: 'rgba(247,243,238,0.5)', lineHeight: 1.5 },
  fallbackBanner: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 16px', display: 'flex', gap: '12px', marginBottom: '14px', boxShadow: 'var(--shadow-sm)' },
  fallbackIcon: { fontSize: '1.3rem', flexShrink: 0 },
  fallbackTitle: { fontSize: '0.86rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '3px' },
  fallbackSub: { fontSize: '0.76rem', color: 'var(--ink-muted)', lineHeight: 1.5 },
  subjectTabs: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' },
  subjectTab: { padding: '7px 14px', background: 'var(--surface)', border: '1.5px solid var(--border-mid)', borderRadius: '20px', color: 'var(--ink-muted)', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--ff-sans)', transition: 'all 0.15s' },
  subjectTabActive: { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-pale)' },
  loadingCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '40px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' },
  genDots: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px' },
  genDot: { width: '9px', height: '9px', borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 1s infinite' },
  loadingText: { fontSize: '0.86rem', color: 'var(--ink-muted)' },
  emptyCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '40px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' },
  emptyIcon: { fontSize: '2.5rem', marginBottom: '12px' },
  emptyTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '8px' },
  emptySub: { fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '20px' },
  predHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  predTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)' },
  regenBtn: { background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink-muted)', fontSize: '0.78rem', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  predCard: { display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' },
  predAccent: { width: '4px', flexShrink: 0 },
  predCardContent: { flex: 1, padding: '14px 16px' },
  predCardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', flexWrap: 'wrap', gap: '8px' },
  predTopic: { fontSize: '0.92rem', fontWeight: '600', color: 'var(--ink)' },
  predPattern: { fontSize: '0.72rem', fontWeight: '600' },
  predRationale: { fontSize: '0.76rem', color: 'var(--ink-muted)', marginBottom: '10px', lineHeight: 1.4 },
  predBar: { height: '5px', background: 'var(--cream-mid)', borderRadius: '3px', overflow: 'hidden' },
  predBarFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
  btnPrimary: { width: '100%', padding: '13px', background: 'var(--forest-mid)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)', marginTop: '4px' },
}