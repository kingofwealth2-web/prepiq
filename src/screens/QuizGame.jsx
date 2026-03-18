import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { updateStreak } from '../lib/streak'
import MathText from '../components/MathText'

export default function QuizGame() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('setup')
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [countdown, setCountdown] = useState(3)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [results, setResults] = useState([])
  const [showResult, setShowResult] = useState(null)
  const timerRef = useRef(null)
  const questionTimerRef = useRef(null)

  useEffect(() => {
    supabase.from('subjects').select('*').order('name').then(({ data }) => { const seen = new Set(); setSubjects((data || []).filter(s => { if (seen.has(s.name)) return false; seen.add(s.name); return true; })) })
    return () => { clearInterval(timerRef.current); clearInterval(questionTimerRef.current) }
  }, [])

  async function startGame() {
    if (!selectedSubject) return
    const { data } = await supabase.from('questions').select(`*, answer_options(*)`).eq('subject_id', selectedSubject.id).eq('question_type', 'OBJ').limit(100)
    if (!data || data.length === 0) { alert('No questions available for this subject yet.'); return }
    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 10)
    setQuestions(shuffled.map(q => ({ ...q, answer_options: q.answer_options.sort((a, b) => a.label.localeCompare(b.label)) })))
    setPhase('countdown'); setScore(0); setStreak(0); setBestStreak(0); setResults([]); setCurrent(0)
    let c = 3; setCountdown(c)
    timerRef.current = setInterval(() => {
      c--; setCountdown(c)
      if (c <= 0) { clearInterval(timerRef.current); setPhase('playing'); startQuestionTimer() }
    }, 1000)
  }

  function startQuestionTimer() {
    setTimeLeft(15); setSelected(null); setAnswered(false); setShowResult(null)
    clearInterval(questionTimerRef.current)
    let t = 15
    questionTimerRef.current = setInterval(() => {
      t--; setTimeLeft(t)
      if (t <= 0) { clearInterval(questionTimerRef.current); handleTimeout() }
    }, 1000)
  }

  function handleTimeout() {
    clearInterval(questionTimerRef.current); setAnswered(true); setShowResult('timeout')
    setStreak(0); setResults(prev => [...prev, { correct: false, timeout: true }])
    setTimeout(() => moveNext(), 1500)
  }

  function handleSelect(option) {
    if (answered) return
    clearInterval(questionTimerRef.current); setSelected(option); setAnswered(true)
    const isCorrect = option.is_correct
    const timeBonus = Math.floor(timeLeft / 3)
    const streakBonus = streak >= 2 ? streak * 2 : 0
    const points = isCorrect ? 10 + timeBonus + streakBonus : 0
    if (isCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak); setBestStreak(prev => Math.max(prev, newStreak))
      setScore(prev => prev + points); setShowResult('correct')
    } else { setStreak(0); setShowResult('wrong') }
    setResults(prev => [...prev, { correct: isCorrect, points, question: questions[current], selected: option }])
    setTimeout(() => moveNext(), 1500)
  }

  async function moveNext() {
    setCurrent(prev => {
      const next = prev + 1
      if (next >= questions.length) {
        setPhase('finished')
        // Update streak — completing a quiz counts as activity
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) updateStreak(user.id)
        })
        return prev
      }
      startQuestionTimer()
      return next
    })
    setShowResult(null)
  }

  const q = questions[current]
  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0
  const correctCount = results.filter(r => r.correct).length

  if (phase === 'setup') return (
    <div style={s.shell}>
      <div style={s.header}>
        <div style={s.kente} />
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
          <div style={s.headerTitle}>Quiz Game</div>
        </div>
      </div>
      <div style={s.centred}>
        <div style={s.setupCard}>
          <div style={s.kente} />
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚡</div>
          <h2 style={s.setupTitle}>Quick Quiz</h2>
          <p style={s.setupSub}>10 questions · 15 seconds each · Earn points for speed and streaks</p>
          <div style={s.subjectList}>
            {subjects.map(sub => (
              <div key={sub.id} style={{ ...s.subjectOpt, ...(selectedSubject?.id === sub.id ? s.subjectOptSel : {}) }}
                onClick={() => setSelectedSubject(sub)}>
                <div style={{ ...s.subjectDot, ...(selectedSubject?.id === sub.id ? s.subjectDotSel : {}) }} />
                <span style={s.subjectLabel}>{sub.name}</span>
              </div>
            ))}
          </div>
          <button style={{ ...s.btnPrimary, opacity: selectedSubject ? 1 : 0.45 }} onClick={startGame} disabled={!selectedSubject}>
            Start Quiz →
          </button>
        </div>
      </div>
    </div>
  )

  if (phase === 'countdown') return (
    <div style={s.shell}>
      <div style={s.centred}>
        <div style={{ textAlign: 'center' }}>
          <div style={s.countdownNum}>{countdown}</div>
          <div style={s.countdownLabel}>Get ready!</div>
        </div>
      </div>
    </div>
  )

  if (phase === 'finished') return (
    <div style={s.shell}>
      <div style={s.header}>
        <div style={s.kente} />
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
          <div style={s.headerTitle}>Quiz complete!</div>
        </div>
      </div>
      <div style={s.contentNarrow}>
        <div style={s.finishedHero}>
          <div style={s.kente} />
          <div style={{ fontSize: '3rem', marginBottom: '6px' }}>
            {correctCount >= 8 ? '🏆' : correctCount >= 5 ? '🎯' : '💪'}
          </div>
          <div style={s.finalScore}>{score}</div>
          <div style={s.finalScoreLabel}>POINTS</div>
          <div style={s.finalStats}>
            <div style={s.finalStat}>
              <div style={{ ...s.finalStatNum, color: 'var(--green)' }}>{correctCount}/10</div>
              <div style={s.finalStatLabel}>Correct</div>
            </div>
            <div style={s.finalStat}>
              <div style={{ ...s.finalStatNum, color: 'var(--accent-primary)' }}>{bestStreak}</div>
              <div style={s.finalStatLabel}>Best streak</div>
            </div>
            <div style={s.finalStat}>
              <div style={{ ...s.finalStatNum, color: '#1A5DC8' }}>{Math.round((correctCount / 10) * 100)}%</div>
              <div style={s.finalStatLabel}>Accuracy</div>
            </div>
          </div>
        </div>
        <div style={s.resultsList}>
          {results.map((r, i) => (
            <div key={i} style={{ ...s.resultItem, borderLeftColor: r.correct ? 'var(--green)' : 'var(--red)' }}>
              <div style={{ ...s.resultStatus, color: r.correct ? 'var(--green)' : 'var(--red)' }}>{r.correct ? '✓' : '✗'}</div>
              <div style={s.resultQ}>{r.question?.body?.slice(0, 60)}...</div>
              {r.correct && <div style={s.resultPts}>+{r.points}pts</div>}
            </div>
          ))}
        </div>
        <div style={s.finishedActions}>
          <button style={s.btnPrimary} onClick={() => { setPhase('setup'); setSelectedSubject(null) }}>Play again</button>
          <button style={s.btnOutline} onClick={() => navigate('/practice')}>Practice mode</button>
        </div>
      </div>
    </div>
  )

  const timerColor = timeLeft <= 5 ? 'var(--red)' : timeLeft <= 10 ? 'var(--accent-primary)' : 'var(--green)'
  const timerDash = 157 - (157 * timeLeft / 15)

  return (
    <div style={s.shell}>
      <div style={s.kente} />
      <div style={s.gameTopbar}>
        <div style={s.scoreDisplay}>
          <div style={s.scoreName}>SCORE</div>
          <div style={s.scoreNum}>{score}</div>
        </div>
        <div style={s.timerWrap}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="5" />
            <circle cx="30" cy="30" r="25" fill="none" stroke={timerColor} strokeWidth="5" strokeLinecap="round" strokeDasharray="157" strokeDashoffset={timerDash} />
          </svg>
          <div style={{ ...s.timerNum, color: timerColor }}>{timeLeft}</div>
        </div>
        <div style={s.streakDisplay}>
          <div style={s.scoreName}>STREAK</div>
          <div style={{ ...s.scoreNum, color: streak >= 3 ? 'var(--accent-primary)' : 'var(--ink)' }}>{streak > 0 ? `${streak}🔥` : '0'}</div>
        </div>
      </div>

      <div style={s.gameProgress}><div style={{ ...s.gameProgressFill, width: `${progress}%` }} /></div>
      <div style={s.questionCount}>Question {current + 1} of {questions.length}</div>

      {showResult && (
        <div style={{ ...s.resultOverlay, background: showResult === 'correct' ? 'rgba(0,158,115,0.12)' : showResult === 'timeout' ? 'rgba(200,136,10,0.12)' : 'rgba(200,16,46,0.12)' }}>
          <div style={s.resultEmoji}>{showResult === 'correct' ? '✓' : showResult === 'timeout' ? '⏱' : '✗'}</div>
          <div style={{ ...s.resultText, color: showResult === 'correct' ? 'var(--green)' : showResult === 'timeout' ? 'var(--accent-primary)' : 'var(--red)' }}>
            {showResult === 'correct' ? `+${results[results.length - 1]?.points} pts` : showResult === 'timeout' ? "Time's up!" : 'Wrong answer'}
          </div>
        </div>
      )}

      <div style={s.gameContent}>
        <div style={s.questionCard}>
          <div style={s.questionText}><MathText text={q?.body} /></div>
        </div>
        <div style={s.optionsGrid}>
          {q?.answer_options?.map(option => {
            let optStyle = s.gameOption
            if (answered) {
              if (option.is_correct) optStyle = { ...s.gameOption, ...s.gameOptionCorrect }
              else if (selected?.id === option.id) optStyle = { ...s.gameOption, ...s.gameOptionWrong }
              else optStyle = { ...s.gameOption, ...s.gameOptionDim }
            } else if (selected?.id === option.id) {
              optStyle = { ...s.gameOption, ...s.gameOptionSelected }
            }
            return (
              <div key={option.id} style={optStyle} onClick={() => handleSelect(option)}>
                <span style={s.gameOptLetter}>{option.label}</span>
                <span style={s.gameOptText}><MathText text={option.body} /></span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const s = {
  shell: { minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)', display: 'flex', flexDirection: 'column', position: 'relative' },
  header: { background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)' },
  kente: { height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  headerInner: { display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 24px' },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.86rem', fontFamily: 'var(--ff)' },
  headerTitle: { fontFamily: 'var(--ff)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)' },
  centred: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px' },
  setupCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '36px', maxWidth: '460px', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: 'none' },
  setupTitle: { fontFamily: 'var(--ff)', fontSize: '1.6rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '8px' },
  setupSub: { fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '24px' },
  subjectList: { display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '22px', textAlign: 'left' },
  subjectOpt: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 15px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'all 0.15s', background: 'var(--bg)' },
  subjectOptSel: { borderColor: 'var(--accent-primary)', background: 'var(--accent-soft)' },
  subjectDot: { width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border-mid)', flexShrink: 0 },
  subjectDotSel: { background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' },
  subjectLabel: { fontSize: '0.88rem', fontWeight: '500', color: 'var(--ink)' },
  btnPrimary: { width: '100%', padding: '13px', background: 'var(--surface-solid)', border: 'none', borderRadius: 'var(--r-md)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  btnOutline: { width: '100%', padding: '13px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  countdownNum: { fontFamily: 'var(--ff)', fontSize: '8rem', fontWeight: '900', color: 'var(--accent-primary)', lineHeight: 1, animation: 'pulse 1s ease infinite' },
  countdownLabel: { fontSize: '1.2rem', color: 'var(--ink-muted)', marginTop: '8px' },
  gameTopbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)' },
  scoreDisplay: { textAlign: 'center', minWidth: '70px' },
  scoreName: { fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.14em', color: 'var(--ink-faint)', marginBottom: '2px' },
  scoreNum: { fontFamily: 'var(--ff)', fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-primary)', lineHeight: 1 },
  timerWrap: { position: 'relative', width: '60px', height: '60px' },
  timerNum: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--ff)', fontSize: '1.2rem', fontWeight: '700' },
  streakDisplay: { textAlign: 'center', minWidth: '70px' },
  gameProgress: { height: '3px', background: 'rgba(255,255,255,.04)' },
  gameProgressFill: { height: '100%', background: 'linear-gradient(90deg,var(--accent-primary),var(--green))', transition: 'width 0.4s ease' },
  questionCount: { textAlign: 'center', fontSize: '0.7rem', color: 'var(--ink-faint)', padding: '7px', fontWeight: '600', letterSpacing: '0.08em' },
  resultOverlay: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' },
  resultEmoji: { fontSize: '4rem', marginBottom: '8px' },
  resultText: { fontFamily: 'var(--ff)', fontSize: '1.8rem', fontWeight: '700' },
  gameContent: { flex: 1, padding: '18px', maxWidth: '680px', margin: '0 auto', width: '100%' },
  questionCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px', marginBottom: '14px', boxShadow: 'none' },
  questionText: { fontSize: '1.02rem', lineHeight: '1.65', color: 'var(--ink)', textAlign: 'center' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' },
  gameOption: { display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-solid)', border: '2px solid var(--border)', borderRadius: 'var(--r-md)', padding: '13px 15px', cursor: 'pointer', transition: 'all 0.12s', boxShadow: 'none' },
  gameOptionSelected: { borderColor: 'var(--accent-primary)', background: 'var(--accent-soft)' },
  gameOptionCorrect: { borderColor: 'var(--green)', background: 'var(--green-soft)', cursor: 'default' },
  gameOptionWrong: { borderColor: 'var(--red)', background: 'var(--red-soft)', cursor: 'default' },
  gameOptionDim: { opacity: 0.38, cursor: 'default' },
  gameOptLetter: { width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.76rem', fontWeight: '700', color: 'var(--ink-muted)', flexShrink: 0 },
  gameOptText: { fontSize: '0.86rem', color: 'var(--ink)', flex: 1 },
  contentNarrow: { padding: '24px', maxWidth: '560px', margin: '0 auto', width: '100%' },
  finishedHero: { background: 'var(--surface-solid)', borderRadius: 'var(--r-xl)', padding: '32px', textAlign: 'center', marginBottom: '18px', position: 'relative', overflow: 'hidden' },
  finalScore: { fontFamily: 'var(--ff)', fontSize: '4rem', fontWeight: '900', color: 'var(--accent-light)', lineHeight: 1 },
  finalScoreLabel: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.16em', color: 'var(--ink-muted)', marginBottom: '20px' },
  finalStats: { display: 'flex', justifyContent: 'center', gap: '32px' },
  finalStat: { textAlign: 'center' },
  finalStatNum: { fontFamily: 'var(--ff)', fontSize: '1.6rem', fontWeight: '700', lineHeight: 1 },
  finalStatLabel: { fontSize: '0.7rem', color: 'var(--ink-muted)', marginTop: '2px' },
  resultsList: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '18px' },
  resultItem: { display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-solid)', borderLeft: '3px solid', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 14px', boxShadow: 'none' },
  resultStatus: { fontSize: '1rem', fontWeight: '700', flexShrink: 0 },
  resultQ: { fontSize: '0.78rem', color: 'var(--ink-muted)', flex: 1 },
  resultPts: { fontSize: '0.76rem', fontWeight: '600', color: 'var(--accent-primary)', flexShrink: 0 },
  finishedActions: { display: 'flex', flexDirection: 'column', gap: '8px' },
}