import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function StudyPlan() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [plan, setPlan] = useState(null)
  const [weakTopics, setWeakTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [tasks, setTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState({})

  useEffect(() => { loadPlan() }, [])

  async function loadPlan() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(profile)
    const { data: exams } = await supabase.from('mock_exams').select('id').eq('user_id', authUser.id)
      .not('submitted_at', 'is', null).order('submitted_at', { ascending: false }).limit(3)
    if (exams && exams.length > 0) {
      const { data: responses } = await supabase.from('mock_responses')
        .select(`*, questions(topics(name), subjects(name))`).in('exam_id', exams.map(e => e.id))
      const topicMap = {}
      responses?.forEach(r => {
        const topic = r.questions?.topics?.name || 'General'
        const subject = r.questions?.subjects?.name || 'General'
        const key = `${subject} — ${topic}`
        if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0, subject, topic }
        topicMap[key].total++
        if (r.is_correct) topicMap[key].correct++
      })
      const weak = Object.entries(topicMap)
        .map(([key, d]) => ({ key, subject: d.subject, topic: d.topic, score: Math.round((d.correct / d.total) * 100), total: d.total }))
        .filter(t => t.score < 70).sort((a, b) => a.score - b.score).slice(0, 5)
      setWeakTopics(weak)
    }
    const { data: existingPlan } = await supabase.from('study_plans').select('*').eq('user_id', authUser.id).eq('is_active', true).single()
    if (existingPlan) { setPlan(existingPlan); generateTasks(existingPlan, profile) }
    setLoading(false)
  }

  function generateTasks(plan, profile) {
    setTasks([
      { id: 1, subject: 'Core Mathematics', task: '20 OBJ questions — Algebra', duration: '25 mins', type: 'practice' },
      { id: 2, subject: 'English Language', task: '15 comprehension questions', duration: '20 mins', type: 'practice' },
      { id: 3, subject: 'Physics', task: '10 OBJ questions — Mechanics', duration: '15 mins', type: 'practice' },
      { id: 4, subject: 'Review', task: 'Flashcards — Key definitions', duration: '10 mins', type: 'flashcard' },
      { id: 5, subject: 'Quiz', task: 'Quick quiz game — 10 questions', duration: '10 mins', type: 'game' },
    ])
  }

  async function generatePlan() {
    setGenerating(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: newPlan } = await supabase.from('study_plans').upsert({
      user_id: authUser.id, exam_date: user?.exam_date,
      subject_priorities: weakTopics.reduce((acc, t) => { acc[t.subject] = t.score; return acc }, {}),
      is_active: true,
    }, { onConflict: 'user_id' }).select().single()
    setPlan(newPlan); generateTasks(newPlan, user); setGenerating(false)
  }

  const toggleTask = id => setCompletedTasks(prev => ({ ...prev, [id]: !prev[id] }))
  const getDaysLeft = () => !user?.exam_date ? null : Math.max(0, Math.ceil((new Date(user.exam_date) - new Date()) / 86400000))
  const completedCount = Object.values(completedTasks).filter(Boolean).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  if (loading) return <div style={s.loadShell}><div style={s.spinner} /></div>

  return (
    <div style={s.shell}>
      <Sidebar user={user} />
      <main style={s.main}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>Study Plan</div>
          {getDaysLeft() !== null && (
            <div style={s.countdown}>
              <span style={s.countdownNum}>{getDaysLeft()}</span>
              <span style={s.countdownLabel}>days to exam</span>
            </div>
          )}
        </div>
        <div style={s.content}>

          {weakTopics.length > 0 && (
            <div style={s.weakCard}>
              <div style={s.kente} />
              <div style={s.weakTitle}>Focus areas from your mock exams</div>
              <div style={s.weakList}>
                {weakTopics.map(t => (
                  <div key={t.key} style={s.weakItem}>
                    <div style={s.weakInfo}>
                      <div style={s.weakTopic}>{t.topic}</div>
                      <div style={s.weakSubject}>{t.subject}</div>
                    </div>
                    <div style={s.weakBar}><div style={{ ...s.weakFill, width: `${t.score}%`, background: t.score < 50 ? 'var(--red)' : 'var(--gold)' }} /></div>
                    <div style={{ ...s.weakScore, color: t.score < 50 ? 'var(--red)' : 'var(--gold)' }}>{t.score}%</div>
                  </div>
                ))}
              </div>
              {!plan && (
                <button style={s.btnGold} onClick={generatePlan} disabled={generating}>
                  {generating ? 'Generating plan...' : 'Generate personalised study plan'}
                </button>
              )}
            </div>
          )}

          {weakTopics.length === 0 && !plan && (
            <div style={s.emptyCard}>
              <div style={s.emptyIcon}>📝</div>
              <h3 style={s.emptyTitle}>No mock exam data yet</h3>
              <p style={s.emptySub}>Take a mock exam first and we'll build a personalised study plan based on your weak areas.</p>
              <button style={s.btnPrimary} onClick={() => navigate('/mock')}>Take a mock exam</button>
            </div>
          )}

          {tasks.length > 0 && (
            <>
              <div style={s.todayHeader}>
                <h3 style={s.todayTitle}>Today's tasks</h3>
                <div style={s.progressPill}>{completedCount}/{tasks.length} done</div>
              </div>
              <div style={s.progressWrap}>
                <div style={s.progressBar}><div style={{ ...s.progressFill, width: `${progress}%` }} /></div>
                <div style={s.progressPct}>{progress}%</div>
              </div>
              <div style={s.taskList}>
                {tasks.map(task => (
                  <div key={task.id} style={{ ...s.taskCard, ...(completedTasks[task.id] ? s.taskDone : {}) }}>
                    <div style={s.taskCheckWrap} onClick={() => toggleTask(task.id)}>
                      <div style={{ ...s.checkbox, ...(completedTasks[task.id] ? s.checkboxDone : {}) }}>
                        {completedTasks[task.id] && '✓'}
                      </div>
                    </div>
                    <div style={s.taskInfo}>
                      <div style={s.taskSubject}>{task.subject}</div>
                      <div style={{ ...s.taskName, ...(completedTasks[task.id] ? s.taskNameDone : {}) }}>{task.task}</div>
                      <div style={s.taskDuration}>{task.duration}</div>
                    </div>
                    <button style={s.taskBtn} onClick={() => {
                      if (task.type === 'practice') navigate('/practice')
                      else if (task.type === 'flashcard') navigate('/flashcards')
                      else if (task.type === 'game') navigate('/game')
                    }}>Start →</button>
                  </div>
                ))}
              </div>
              {progress === 100 && (
                <div style={s.doneBanner}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>🎉</div>
                  <div>
                    <div style={s.doneTitle}>All done for today!</div>
                    <div style={s.doneSub}>Amazing work. Come back tomorrow to keep your streak going.</div>
                  </div>
                </div>
              )}
            </>
          )}

          {plan && (
            <div style={s.weekCard}>
              <h3 style={s.cardTitle}>This week</h3>
              <div style={s.weekGrid}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                  const isToday = i === new Date().getDay() - 1
                  const isPast = i < new Date().getDay() - 1
                  return (
                    <div key={day} style={{ ...s.dayCell, ...(isToday ? s.dayCellToday : {}), ...(isPast ? s.dayCellPast : {}) }}>
                      <div style={s.dayName}>{day}</div>
                      <div style={{ ...s.dayDot, background: isPast ? 'var(--teal)' : isToday ? 'var(--gold)' : 'var(--cream-dark)' }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--surface-mid)', fontFamily: 'var(--ff-sans)' },
  loadShell: { minHeight: '100vh', background: 'var(--surface-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '32px', height: '32px', border: '3px solid var(--border-mid)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  main: { flex: 1, marginLeft: '220px', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' },
  countdown: { display: 'flex', alignItems: 'center', gap: '5px' },
  countdownNum: { fontFamily: 'var(--ff-serif)', fontSize: '1.3rem', fontWeight: '700', color: 'var(--gold)' },
  countdownLabel: { fontSize: '0.72rem', color: 'var(--ink-muted)' },
  content: { flex: 1, padding: '24px 28px 60px' },
  weakCard: { background: 'var(--forest)', borderRadius: 'var(--r-xl)', padding: '24px', marginBottom: '18px', position: 'relative', overflow: 'hidden' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  weakTitle: { fontSize: '0.84rem', color: 'rgba(247,243,238,0.6)', marginBottom: '16px' },
  weakList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  weakItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  weakInfo: { width: '150px', flexShrink: 0 },
  weakTopic: { fontSize: '0.84rem', fontWeight: '600', color: '#F7F3EE', lineHeight: 1.2 },
  weakSubject: { fontSize: '0.7rem', color: 'rgba(247,243,238,0.45)', marginTop: '2px' },
  weakBar: { flex: 1, height: '5px', background: 'rgba(247,243,238,0.1)', borderRadius: '3px', overflow: 'hidden' },
  weakFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
  weakScore: { fontSize: '0.8rem', fontWeight: '600', width: '36px', textAlign: 'right' },
  btnGold: { width: '100%', padding: '13px', background: 'var(--gold)', border: 'none', borderRadius: 'var(--r-sm)', color: 'var(--forest)', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  emptyCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '40px', textAlign: 'center', marginBottom: '18px', boxShadow: 'var(--shadow-sm)' },
  emptyIcon: { fontSize: '2.5rem', marginBottom: '12px' },
  emptyTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '8px' },
  emptySub: { fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '20px' },
  btnPrimary: { padding: '13px 24px', background: 'var(--forest)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  todayHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  todayTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)' },
  progressPill: { background: 'var(--cream-mid)', color: 'var(--ink-muted)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: '500' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  progressBar: { flex: 1, height: '5px', background: 'var(--cream-dark)', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--gold)', borderRadius: '3px', transition: 'width 0.5s ease' },
  progressPct: { fontSize: '0.76rem', fontWeight: '600', color: 'var(--gold)', width: '30px' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' },
  taskCard: { display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '15px', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' },
  taskDone: { opacity: 0.55 },
  taskCheckWrap: { cursor: 'pointer', flexShrink: 0 },
  checkbox: { width: '22px', height: '22px', borderRadius: '6px', border: '2px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--surface)', transition: 'all 0.15s' },
  checkboxDone: { background: 'var(--teal)', borderColor: 'var(--teal)' },
  taskInfo: { flex: 1 },
  taskSubject: { fontSize: '0.68rem', fontWeight: '700', color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' },
  taskName: { fontSize: '0.88rem', fontWeight: '500', color: 'var(--ink)', marginBottom: '2px' },
  taskNameDone: { textDecoration: 'line-through', color: 'var(--ink-faint)' },
  taskDuration: { fontSize: '0.72rem', color: 'var(--ink-faint)' },
  taskBtn: { padding: '7px 13px', background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-sm)', color: 'var(--gold)', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--ff-sans)', flexShrink: 0 },
  doneBanner: { background: 'var(--teal-pale)', border: '1px solid rgba(0,158,115,0.2)', borderRadius: 'var(--r-md)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' },
  doneTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: 'var(--teal)', marginBottom: '4px' },
  doneSub: { fontSize: '0.8rem', color: 'var(--ink-muted)' },
  weekCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' },
  cardTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '14px' },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' },
  dayCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 0', borderRadius: 'var(--r-sm)', background: 'var(--surface-mid)' },
  dayCellToday: { background: 'var(--gold-pale)', border: '1px solid var(--gold-border)' },
  dayCellPast: { background: 'var(--teal-pale)' },
  dayName: { fontSize: '0.7rem', fontWeight: '600', color: 'var(--ink-muted)' },
  dayDot: { width: '7px', height: '7px', borderRadius: '50%', transition: 'background 0.3s' },
}
