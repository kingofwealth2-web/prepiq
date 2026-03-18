import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import { useMobileMenu } from '../App'

// Generate a real daily task list from weak topics and subjects
function buildTaskList(weakTopics, userSubjects, examType) {
  const tasks = []

  if (weakTopics && weakTopics.length > 0) {
    // Prioritise weakest topics first (already sorted by score asc)
    weakTopics.slice(0, 3).forEach((t, i) => {
      tasks.push({
        id: i + 1,
        subject: t.subject,
        topic: t.topic,
        task: `${t.topic} — practice questions`,
        detail: `You scored ${t.score}% on this topic. Focus here today.`,
        duration: '20 mins',
        type: 'practice',
        priority: 'weak',
        score: t.score,
      })
    })

    // Add a flashcard session for the weakest subject
    const weakestSubject = weakTopics[0]?.subject
    if (weakestSubject) {
      tasks.push({
        id: tasks.length + 1,
        subject: weakestSubject,
        topic: 'Key definitions',
        task: `Flashcards — ${weakestSubject}`,
        detail: 'Reinforce key terms and definitions.',
        duration: '10 mins',
        type: 'flashcard',
        priority: 'normal',
      })
    }
  } else {
    // No mock data yet — build a balanced default plan
    const defaultSubjects = examType === 'BECE'
      ? ['Mathematics', 'English Language', 'Integrated Science', 'Social Studies']
      : ['Core Mathematics', 'English Language', 'Integrated Science', 'Social Studies']

    const subjects = userSubjects?.length > 0
      ? userSubjects.slice(0, 3)
      : defaultSubjects.slice(0, 3)

    subjects.forEach((subj, i) => {
      tasks.push({
        id: i + 1,
        subject: typeof subj === 'string' ? subj : subj.name,
        topic: 'General practice',
        task: `${typeof subj === 'string' ? subj : subj.name} — 15 questions`,
        detail: 'Build your question bank confidence.',
        duration: '20 mins',
        type: 'practice',
        priority: 'normal',
      })
    })
  }

  // Always add a quiz game session at the end
  tasks.push({
    id: tasks.length + 1,
    subject: 'Quiz',
    topic: 'Speed challenge',
    task: 'Quick quiz game — 10 questions',
    detail: 'Fast answers earn bonus points.',
    duration: '8 mins',
    type: 'game',
    priority: 'normal',
  })

  return tasks
}

export default function StudyPlan() {
  const navigate = useNavigate()
  const { open: mobileMenuOpen, setOpen: setMobileMenuOpen } = useMobileMenu()
  const [user, setUser] = useState(null)
  const [weakTopics, setWeakTopics] = useState([])
  const [tasks, setTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState({})
  const [loading, setLoading] = useState(true)
  const [hasMockData, setHasMockData] = useState(false)

  useEffect(() => { loadPlan() }, [])

  async function loadPlan() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(profile)

    // Load weak topics from last 3 mock exams
    const { data: exams } = await supabase
      .from('mock_exams').select('id')
      .eq('user_id', authUser.id)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(3)

    let weak = []

    if (exams && exams.length > 0) {
      setHasMockData(true)
      const { data: responses } = await supabase
        .from('mock_responses')
        .select(`*, questions(topics(name), subjects(name))`)
        .in('exam_id', exams.map(e => e.id))

      const topicMap = {}
      responses?.forEach(r => {
        const topic = r.questions?.topics?.name || 'General'
        const subject = r.questions?.subjects?.name || 'General'
        const key = `${subject}|||${topic}`
        if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0, subject, topic }
        topicMap[key].total++
        if (r.is_correct) topicMap[key].correct++
      })

      weak = Object.entries(topicMap)
        .map(([, d]) => ({
          subject: d.subject,
          topic: d.topic,
          score: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
          total: d.total,
        }))
        .filter(t => t.score < 70 && t.total >= 2)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)

      setWeakTopics(weak)
    }

    // Restore completed tasks from localStorage
    const savedCompleted = localStorage.getItem(`prepiq-tasks-${authUser.id}-${new Date().toDateString()}`)
    if (savedCompleted) {
      try { setCompletedTasks(JSON.parse(savedCompleted)) } catch { /* ignore */ }
    }

    const generatedTasks = buildTaskList(weak, [], profile?.exam_type)
    setTasks(generatedTasks)
    setLoading(false)
  }

  const toggleTask = (taskId) => {
    const updated = { ...completedTasks, [taskId]: !completedTasks[taskId] }
    setCompletedTasks(updated)
    // Persist to localStorage keyed by user + date
    if (user) {
      localStorage.setItem(
        `prepiq-tasks-${user.id}-${new Date().toDateString()}`,
        JSON.stringify(updated)
      )
    }
  }

  const getDaysLeft = () => !user?.exam_date
    ? null
    : Math.max(0, Math.ceil((new Date(user.exam_date) - new Date()) / 86400000))

  const completedCount = Object.values(completedTasks).filter(Boolean).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const priorityColor = priority => {
    if (priority === 'weak') return 'var(--red)'
    return 'var(--accent-primary)'
  }

  if (loading) return <div style={s.loadShell}><div style={s.spinner} /></div>

  return (
    <div style={s.shell}>
      <Sidebar user={user} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main style={s.main}>
        <MobileHeader title="Study Plan" onMenuOpen={() => setMobileMenuOpen(true)} />
        <div style={{...s.topbar, display: 'flex'}}>
          <div style={s.topbarTitle}>Study Plan</div>
          {getDaysLeft() !== null && (
            <div style={s.countdown}>
              <span style={s.countdownNum}>{getDaysLeft()}</span>
              <span style={s.countdownLabel}>days to exam</span>
            </div>
          )}
        </div>
        <div style={s.content} className="has-bottom-nav">

          {/* Weak topics insight */}
          {weakTopics.length > 0 && (
            <div style={s.weakCard}>
              <div style={s.kente} />
              <div style={s.weakHeader}>
                <div style={s.weakTitle}>Your weak areas</div>
                <div style={s.weakSub}>Based on your last {hasMockData ? 'mock exams' : 'activity'}</div>
              </div>
              <div style={s.weakList}>
                {weakTopics.map((t, i) => (
                  <div key={i} style={s.weakItem}>
                    <div style={s.weakInfo}>
                      <div style={s.weakTopic}>{t.topic}</div>
                      <div style={s.weakSubject}>{t.subject}</div>
                    </div>
                    <div style={s.weakBar}>
                      <div style={{ ...s.weakFill, width: `${t.score}%`, background: t.score < 50 ? 'var(--red)' : 'var(--accent-primary)' }} />
                    </div>
                    <div style={{ ...s.weakScore, color: t.score < 50 ? 'var(--red)' : 'var(--accent-primary)' }}>{t.score}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasMockData && (
            <div style={s.noDataBanner}>
              <div style={s.noDataIcon}>💡</div>
              <div>
                <div style={s.noDataTitle}>No mock exam data yet</div>
                <div style={s.noDataSub}>Take a mock exam and your plan will automatically adapt to your weak areas.</div>
              </div>
              <button style={s.btnSmall} onClick={() => navigate('/mock')}>Take a mock →</button>
            </div>
          )}

          {/* Today's tasks */}
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
                {task.priority === 'weak' && <div style={s.taskUrgentBar} />}
                <div style={s.taskCheckWrap} onClick={() => toggleTask(task.id)}>
                  <div style={{ ...s.checkbox, ...(completedTasks[task.id] ? s.checkboxDone : {}) }}>
                    {completedTasks[task.id] && '✓'}
                  </div>
                </div>
                <div style={s.taskInfo}>
                  <div style={{ ...s.taskSubject, color: priorityColor(task.priority) }}>
                    {task.subject}{task.priority === 'weak' ? ' · Weak area' : ''}
                  </div>
                  <div style={{ ...s.taskName, ...(completedTasks[task.id] ? s.taskNameDone : {}) }}>{task.task}</div>
                  <div style={s.taskDetail}>{task.detail}</div>
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
                <div style={s.doneSub}>Novazing work. Come back tomorrow to keep your streak going.</div>
              </div>
            </div>
          )}

          {/* Weekly calendar */}
          <div style={s.weekCard}>
            <h3 style={s.cardTitle}>This week</h3>
            <div style={s.weekGrid}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                const today = new Date().getDay()
                // getDay() returns 0=Sun, 1=Mon ... so adjust
                const dayIndex = today === 0 ? 6 : today - 1
                const isToday = i === dayIndex
                const isPast = i < dayIndex
                return (
                  <div key={day} style={{ ...s.dayCell, ...(isToday ? s.dayCellToday : {}), ...(isPast ? s.dayCellPast : {}) }}>
                    <div style={s.dayName}>{day}</div>
                    <div style={{ ...s.dayDot, background: isPast ? 'var(--green)' : isToday ? 'var(--accent-primary)' : 'rgba(255,255,255,.04)' }} />
                  </div>
                )
              })}
            </div>
          </div>
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
  topbar: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'var(--ff)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' },
  countdown: { display: 'flex', alignItems: 'center', gap: '5px' },
  countdownNum: { fontFamily: 'var(--ff)', fontSize: '1.3rem', fontWeight: '700', color: 'var(--accent-primary)' },
  countdownLabel: { fontSize: '0.72rem', color: 'var(--ink-muted)' },
  content: { flex: 1, padding: '20px 20px 60px' },
  weakCard: { background: 'var(--surface-solid)', borderRadius: 'var(--r-xl)', padding: '22px', marginBottom: '14px', position: 'relative', overflow: 'hidden' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  weakHeader: { marginBottom: '14px' },
  weakTitle: { fontSize: '0.92rem', fontWeight: '700', color: '#F7F3EE', marginBottom: '2px', fontFamily: 'var(--ff)' },
  weakSub: { fontSize: '0.72rem', color: 'rgba(247,243,238,0.45)' },
  weakList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  weakItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  weakInfo: { width: '140px', flexShrink: 0 },
  weakTopic: { fontSize: '0.82rem', fontWeight: '600', color: '#F7F3EE', lineHeight: 1.2 },
  weakSubject: { fontSize: '0.68rem', color: 'rgba(247,243,238,0.4)', marginTop: '2px' },
  weakBar: { flex: 1, height: '5px', background: 'rgba(247,243,238,0.1)', borderRadius: '3px', overflow: 'hidden' },
  weakFill: { height: '100%', borderRadius: '3px', transition: 'width 1s ease' },
  weakScore: { fontSize: '0.8rem', fontWeight: '600', width: '36px', textAlign: 'right' },
  noDataBanner: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', boxShadow: 'none' },
  noDataIcon: { fontSize: '1.4rem', flexShrink: 0 },
  noDataTitle: { fontSize: '0.86rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px' },
  noDataSub: { fontSize: '0.76rem', color: 'var(--ink-muted)', lineHeight: 1.4 },
  btnSmall: { padding: '8px 14px', background: 'var(--surface-solid)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--ff)', flexShrink: 0 },
  todayHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  todayTitle: { fontFamily: 'var(--ff)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)' },
  progressPill: { background: 'rgba(255,255,255,.06)', color: 'var(--ink-muted)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: '500' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  progressBar: { flex: 1, height: '5px', background: 'rgba(255,255,255,.04)', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--accent-primary)', borderRadius: '3px', transition: 'width 0.5s ease' },
  progressPct: { fontSize: '0.76rem', fontWeight: '600', color: 'var(--accent-primary)', width: '30px' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
  taskCard: { display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '15px', boxShadow: 'none', position: 'relative', overflow: 'hidden', transition: 'opacity 0.2s' },
  taskDone: { opacity: 0.5 },
  taskUrgentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'var(--red)' },
  taskCheckWrap: { cursor: 'pointer', flexShrink: 0, marginLeft: '4px' },
  checkbox: { width: '22px', height: '22px', borderRadius: '6px', border: '2px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: '#fff', transition: 'all 0.15s' },
  checkboxDone: { background: 'var(--green)', borderColor: 'var(--green)' },
  taskInfo: { flex: 1, minWidth: 0 },
  taskSubject: { fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' },
  taskName: { fontSize: '0.88rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px' },
  taskNameDone: { textDecoration: 'line-through', color: 'var(--ink-faint)' },
  taskDetail: { fontSize: '0.72rem', color: 'var(--ink-muted)', marginBottom: '2px', lineHeight: 1.3 },
  taskDuration: { fontSize: '0.7rem', color: 'var(--ink-faint)' },
  taskBtn: { padding: '7px 12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--ff)', flexShrink: 0 },
  doneBanner: { background: 'var(--green-soft)', border: '1px solid rgba(0,158,115,0.2)', borderRadius: 'var(--r-md)', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' },
  doneTitle: { fontFamily: 'var(--ff)', fontSize: '1rem', fontWeight: '700', color: 'var(--green)', marginBottom: '3px' },
  doneSub: { fontSize: '0.8rem', color: 'var(--ink-muted)' },
  weekCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px', boxShadow: 'none' },
  cardTitle: { fontFamily: 'var(--ff)', fontSize: '1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '14px' },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' },
  dayCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 0', borderRadius: 'var(--r-sm)', background: 'var(--bg)' },
  dayCellToday: { background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' },
  dayCellPast: { background: 'var(--green-soft)' },
  dayName: { fontSize: '0.68rem', fontWeight: '600', color: 'var(--ink-muted)' },
  dayDot: { width: '7px', height: '7px', borderRadius: '50%', transition: 'background 0.3s' },
}