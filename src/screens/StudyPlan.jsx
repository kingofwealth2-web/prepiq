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
      const examIds = exams.map(e => e.id)
      const { data: responses } = await supabase.from('mock_responses')
        .select(`*, questions(topics(name), subjects(name))`).in('exam_id', examIds)

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

    const { data: existingPlan } = await supabase.from('study_plans').select('*')
      .eq('user_id', authUser.id).eq('is_active', true).single()

    if (existingPlan) { setPlan(existingPlan); generateTasks(existingPlan, profile) }
    setLoading(false)
  }

  function generateTasks(plan, profile) {
    const dailyTasks = [
      { id: 1, subject: 'Core Mathematics', task: '20 OBJ questions — Algebra', duration: '25 mins', type: 'practice' },
      { id: 2, subject: 'English Language', task: '15 comprehension questions', duration: '20 mins', type: 'practice' },
      { id: 3, subject: 'Physics', task: '10 OBJ questions — Mechanics', duration: '15 mins', type: 'practice' },
      { id: 4, subject: 'Review', task: 'Flashcards — Key definitions', duration: '10 mins', type: 'flashcard' },
      { id: 5, subject: 'Quiz', task: 'Quick quiz game — 10 questions', duration: '10 mins', type: 'game' },
    ]
    setTasks(dailyTasks)
  }

  async function generatePlan() {
    setGenerating(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: newPlan } = await supabase.from('study_plans').upsert({
      user_id: authUser.id, exam_date: user?.exam_date,
      subject_priorities: weakTopics.reduce((acc, t) => { acc[t.subject] = t.score; return acc }, {}),
      is_active: true,
    }, { onConflict: 'user_id' }).select().single()
    setPlan(newPlan)
    generateTasks(newPlan, user)
    setGenerating(false)
  }

  const toggleTask = (taskId) => setCompletedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }))
  const getDaysLeft = () => !user?.exam_date ? null : Math.max(0, Math.ceil((new Date(user.exam_date) - new Date()) / 86400000))
  const completedCount = Object.values(completedTasks).filter(Boolean).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  if (loading) return <div style={s.loadShell}><div style={s.loadText}>Loading study plan...</div></div>

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
            <div style={s.weakAlert}>
              <div style={s.weakAlertKente} />
              <div style={s.weakAlertTitle}>Based on your recent mock exams, focus on these topics:</div>
              <div style={s.weakTopicList}>
                {weakTopics.map(t => (
                  <div key={t.key} style={s.weakTopicItem}>
                    <div style={s.weakTopicInfo}>
                      <div style={s.weakTopicName}>{t.topic}</div>
                      <div style={s.weakTopicSubject}>{t.subject}</div>
                    </div>
                    <div style={s.weakTopicBar}>
                      <div style={{ ...s.weakTopicFill, width: `${t.score}%`, background: t.score < 50 ? '#FF6B6B' : '#F0A500' }} />
                    </div>
                    <div style={{ ...s.weakTopicScore, color: t.score < 50 ? '#FF6B6B' : '#F0A500' }}>{t.score}%</div>
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
              <div style={s.emptyTitle}>No mock exam data yet</div>
              <div style={s.emptySub}>Take a mock exam first and we'll build a personalised study plan based on your weak areas.</div>
              <button style={s.btnGold} onClick={() => navigate('/mock')}>Take a mock exam</button>
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
                  <div key={task.id} style={{ ...s.taskCard, ...(completedTasks[task.id] ? s.taskCardDone : {}) }}>
                    <div style={s.taskCheck} onClick={() => toggleTask(task.id)}>
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
                <div style={s.completedBanner}>
                  <div style={s.completedIcon}>🎉</div>
                  <div>
                    <div style={s.completedTitle}>All done for today!</div>
                    <div style={s.completedSub}>Amazing work. Come back tomorrow to keep your streak going.</div>
                  </div>
                </div>
              )}
            </>
          )}

          {plan && (
            <div style={s.weekCard}>
              <h3 style={s.cardTitle}>This week</h3>
              <div style={s.weekGrid}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const isToday = i === new Date().getDay() - 1
                  const isPast = i < new Date().getDay() - 1
                  return (
                    <div key={day} style={{ ...s.dayCell, ...(isToday ? s.dayCellToday : {}), ...(isPast ? s.dayCellPast : {}) }}>
                      <div style={s.dayName}>{day}</div>
                      <div style={{ ...s.dayDot, background: isPast ? '#00C896' : isToday ? '#F0A500' : '#1C2330' }} />
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
  shell: { display: 'flex', minHeight: '100vh', background: '#0D1117', fontFamily: 'DM Sans, sans-serif' },
  loadShell: { minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadText: { color: '#8B949E' },
  main: { flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: '#161B22', borderBottom: '1px solid rgba(240,246,252,0.06)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: '600', color: '#F0F6FC' },
  countdown: { display: 'flex', alignItems: 'center', gap: '6px' },
  countdownNum: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: '700', color: '#F0A500' },
  countdownLabel: { fontSize: '0.75rem', color: '#8B949E' },
  content: { flex: 1, padding: '28px', paddingBottom: '60px' },
  weakAlert: { background: '#161B22', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' },
  weakAlertKente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#F0A500 0,#F0A500 20px,#00C896 20px,#00C896 40px,#FF6B6B 40px,#FF6B6B 60px,#4A9EFF 60px,#4A9EFF 80px)' },
  weakAlertTitle: { fontSize: '0.88rem', color: '#8B949E', marginBottom: '16px' },
  weakTopicList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  weakTopicItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  weakTopicInfo: { width: '160px', flexShrink: 0 },
  weakTopicName: { fontSize: '0.85rem', fontWeight: '600', color: '#F0F6FC' },
  weakTopicSubject: { fontSize: '0.72rem', color: '#8B949E' },
  weakTopicBar: { flex: 1, height: '6px', background: '#1C2330', borderRadius: '3px', overflow: 'hidden' },
  weakTopicFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
  weakTopicScore: { fontSize: '0.82rem', fontWeight: '600', width: '36px', textAlign: 'right' },
  emptyCard: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '16px', padding: '40px', textAlign: 'center', marginBottom: '20px' },
  emptyIcon: { fontSize: '2.5rem', marginBottom: '12px' },
  emptyTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: '600', color: '#F0F6FC', marginBottom: '8px' },
  emptySub: { fontSize: '0.85rem', color: '#8B949E', marginBottom: '20px' },
  btnGold: { width: '100%', padding: '13px', background: '#F0A500', border: 'none', borderRadius: '8px', color: '#0D1117', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  todayHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  todayTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: '600', color: '#F0F6FC' },
  progressPill: { background: '#1C2330', color: '#8B949E', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '500' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  progressBar: { flex: 1, height: '6px', background: '#1C2330', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#F0A500', borderRadius: '3px', transition: 'width 0.5s ease' },
  progressPct: { fontSize: '0.78rem', fontWeight: '600', color: '#F0A500', width: '32px' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' },
  taskCard: { display: 'flex', alignItems: 'center', gap: '14px', background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '12px', padding: '16px', transition: 'all 0.2s' },
  taskCardDone: { opacity: 0.6 },
  taskCheck: { cursor: 'pointer', flexShrink: 0 },
  checkbox: { width: '22px', height: '22px', borderRadius: '6px', border: '2px solid rgba(240,246,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#0D1117', transition: 'all 0.2s' },
  checkboxDone: { background: '#00C896', borderColor: '#00C896', color: '#0D1117' },
  taskInfo: { flex: 1 },
  taskSubject: { fontSize: '0.72rem', fontWeight: '600', color: '#F0A500', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' },
  taskName: { fontSize: '0.9rem', fontWeight: '500', color: '#F0F6FC', marginBottom: '2px' },
  taskNameDone: { textDecoration: 'line-through', color: '#8B949E' },
  taskDuration: { fontSize: '0.75rem', color: '#8B949E' },
  taskBtn: { padding: '8px 14px', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', color: '#F0A500', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 },
  completedBanner: { background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  completedIcon: { fontSize: '2rem', flexShrink: 0 },
  completedTitle: { fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: '600', color: '#00C896', marginBottom: '4px' },
  completedSub: { fontSize: '0.82rem', color: '#8B949E' },
  weekCard: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '14px', padding: '20px' },
  cardTitle: { fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: '600', color: '#F0F6FC', marginBottom: '16px' },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' },
  dayCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 0', borderRadius: '8px', background: '#1C2330' },
  dayCellToday: { background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)' },
  dayCellPast: { background: 'rgba(0,200,150,0.06)' },
  dayName: { fontSize: '0.72rem', fontWeight: '600', color: '#8B949E' },
  dayDot: { width: '8px', height: '8px', borderRadius: '50%', transition: 'background 0.3s' },
}