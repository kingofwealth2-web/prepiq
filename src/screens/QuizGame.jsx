import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import MathText from '../components/MathText'

export default function QuizGame() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('setup') // setup | countdown | playing | finished
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
  const [showResult, setShowResult] = useState(null) // 'correct' | 'wrong' | 'timeout'
  const timerRef = useRef(null)
  const questionTimerRef = useRef(null)

  useEffect(() => {
    supabase.from('subjects').select('*').order('name').then(({ data }) => setSubjects(data || []))
    return () => { clearInterval(timerRef.current); clearInterval(questionTimerRef.current) }
  }, [])

  async function startGame() {
    if (!selectedSubject) return
    const { data } = await supabase
      .from('questions')
      .select(`*, answer_options(*)`)
      .eq('subject_id', selectedSubject.id)
      .eq('question_type', 'OBJ')
      .limit(100)

    if (!data || data.length === 0) {
      alert('No questions available for this subject yet.')
      return
    }

    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 10)
    const withOptions = shuffled.map(q => ({
      ...q,
      answer_options: q.answer_options.sort((a, b) => a.label.localeCompare(b.label))
    }))

    setQuestions(withOptions)
    setPhase('countdown')
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setResults([])
    setCurrent(0)

    let c = 3
    setCountdown(c)
    timerRef.current = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 0) {
        clearInterval(timerRef.current)
        setPhase('playing')
        startQuestionTimer()
      }
    }, 1000)
  }

  function startQuestionTimer() {
    setTimeLeft(15)
    setSelected(null)
    setAnswered(false)
    setShowResult(null)
    clearInterval(questionTimerRef.current)
    let t = 15
    questionTimerRef.current = setInterval(() => {
      t--
      setTimeLeft(t)
      if (t <= 0) {
        clearInterval(questionTimerRef.current)
        handleTimeout()
      }
    }, 1000)
  }

  function handleTimeout() {
    clearInterval(questionTimerRef.current)
    setAnswered(true)
    setShowResult('timeout')
    setStreak(0)
    setResults(prev => [...prev, { correct: false, timeout: true }])
    setTimeout(() => moveNext(), 1500)
  }

  function handleSelect(option) {
    if (answered) return
    clearInterval(questionTimerRef.current)
    setSelected(option)
    setAnswered(true)

    const isCorrect = option.is_correct
    const timeBonus = Math.floor(timeLeft / 3)
    const streakBonus = streak >= 2 ? streak * 2 : 0
    const points = isCorrect ? 10 + timeBonus + streakBonus : 0

    if (isCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak)
      setBestStreak(prev => Math.max(prev, newStreak))
      setScore(prev => prev + points)
      setShowResult('correct')
    } else {
      setStreak(0)
      setShowResult('wrong')
    }

    setResults(prev => [...prev, { correct: isCorrect, points, question: questions[current], selected: option }])
    setTimeout(() => moveNext(), 1500)
  }

  function moveNext() {
    setCurrent(prev => {
      const next = prev + 1
      if (next >= questions.length) {
        setPhase('finished')
        return prev
      }
      startQuestionTimer()
      return next
    })
    setShowResult(null)
  }

  const q = questions[current]
  const progress = questions.length > 0 ? ((current) / questions.length) * 100 : 0
  const correctCount = results.filter(r => r.correct).length

  // SETUP
  if (phase === 'setup') return (
    <div style={s.shell}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
        <div style={s.headerTitle}>Quiz Game</div>
      </div>
      <div style={s.centred}>
        <div style={s.setupCard}>
          <div style={s.setupKente} />
          <div style={s.setupIcon}>⚡</div>
          <h2 style={s.setupTitle}>Quick Quiz</h2>
          <p style={s.setupSub}>10 questions · 15 seconds each · Earn points for speed and streaks</p>
          <div style={s.subjectList}>
            {subjects.map(sub => (
              <div key={sub.id}
                style={{ ...s.subjectOption, ...(selectedSubject?.id === sub.id ? s.subjectOptionSel : {}) }}
                onClick={() => setSelectedSubject(sub)}>
                <div style={{ ...s.subjectDot, ...(selectedSubject?.id === sub.id ? s.subjectDotSel : {}) }} />
                <span style={s.subjectLabel}>{sub.name}</span>
              </div>
            ))}
          </div>
          <button style={{ ...s.btnGold, opacity: selectedSubject ? 1 : 0.5 }}
            onClick={startGame} disabled={!selectedSubject}>
            Start Quiz →
          </button>
        </div>
      </div>
    </div>
  )

  // COUNTDOWN
  if (phase === 'countdown') return (
    <div style={s.shell}>
      <div style={s.centred}>
        <div style={s.countdownWrap}>
          <div style={s.countdownNum}>{countdown}</div>
          <div style={s.countdownLabel}>Get ready!</div>
        </div>
      </div>
    </div>
  )

  // FINISHED
  if (phase === 'finished') return (
    <div style={s.shell}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
        <div style={s.headerTitle}>Quiz Complete!</div>
      </div>
      <div style={s.content}>
        <div style={s.finishedHero}>
          <div style={s.finishedKente} />
          <div style={s.finishedIcon}>
            {correctCount >= 8 ? '🏆' : correctCount >= 5 ? '🎯' : '💪'}
          </div>
          <div style={s.finalScore}>{score}</div>
          <div style={s.finalScoreLabel}>POINTS</div>
          <div style={s.finalStats}>
            <div style={s.finalStat}>
              <div style={{ ...s.finalStatNum, color: '#00C896' }}>{correctCount}/10</div>
              <div style={s.finalStatLabel}>Correct</div>
            </div>
            <div style={s.finalStat}>
              <div style={{ ...s.finalStatNum, color: '#F0A500' }}>{bestStreak}</div>
              <div style={s.finalStatLabel}>Best streak</div>
            </div>
            <div style={s.finalStat}>
              <div style={{ ...s.finalStatNum, color: '#4A9EFF' }}>{Math.round((correctCount / 10) * 100)}%</div>
              <div style={s.finalStatLabel}>Accuracy</div>
            </div>
          </div>
        </div>

        <div style={s.resultsList}>
          {results.map((r, i) => (
            <div key={i} style={{ ...s.resultItem, borderColor: r.correct ? 'rgba(0,200,150,0.3)' : 'rgba(255,107,107,0.3)' }}>
              <div style={{ ...s.resultStatus, color: r.correct ? '#00C896' : '#FF6B6B' }}>
                {r.correct ? '✓' : '✗'}
              </div>
              <div style={s.resultQ}>{r.question?.body?.slice(0, 60)}...</div>
              {r.correct && <div style={s.resultPts}>+{r.points}pts</div>}
            </div>
          ))}
        </div>

        <div style={s.finishedActions}>
          <button style={s.btnGold} onClick={() => { setPhase('setup'); setSelectedSubject(null) }}>Play again</button>
          <button style={s.btnOutline} onClick={() => navigate('/practice')}>Practice mode</button>
        </div>
      </div>
    </div>
  )

  // PLAYING
  return (
    <div style={s.shell}>
      {/* TOP BAR */}
      <div style={s.gameTopbar}>
        <div style={s.scoreDisplay}>
          <div style={s.scoreName}>SCORE</div>
          <div style={s.scoreNum}>{score}</div>
        </div>
        <div style={s.timerWrap}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="30" cy="30" r="25" fill="none" stroke="#1C2330" strokeWidth="5" />
            <circle cx="30" cy="30" r="25" fill="none"
              stroke={timeLeft <= 5 ? '#FF6B6B' : timeLeft <= 10 ? '#F0A500' : '#00C896'}
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray="157"
              strokeDashoffset={157 - (157 * timeLeft / 15)} />
          </svg>
          <div style={{ ...s.timerNum, color: timeLeft <= 5 ? '#FF6B6B' : timeLeft <= 10 ? '#F0A500' : '#F0F6FC' }}>
            {timeLeft}
          </div>
        </div>
        <div style={s.streakDisplay}>
          <div style={s.scoreName}>STREAK</div>
          <div style={{ ...s.scoreNum, color: streak >= 3 ? '#F0A500' : '#F0F6FC' }}>
            {streak > 0 ? `${streak}🔥` : '0'}
          </div>
        </div>
      </div>

      {/* PROGRESS */}
      <div style={s.gameProgress}>
        <div style={{ ...s.gameProgressFill, width: `${progress}%` }} />
      </div>
      <div style={s.questionCount}>Question {current + 1} of {questions.length}</div>

      {/* RESULT OVERLAY */}
      {showResult && (
        <div style={{
          ...s.resultOverlay,
          background: showResult === 'correct' ? 'rgba(0,200,150,0.15)' :
                       showResult === 'timeout' ? 'rgba(240,165,0,0.15)' : 'rgba(255,107,107,0.15)'
        }}>
          <div style={s.resultEmoji}>
            {showResult === 'correct' ? '✓' : showResult === 'timeout' ? '⏱' : '✗'}
          </div>
          <div style={{ ...s.resultText, color: showResult === 'correct' ? '#00C896' : showResult === 'timeout' ? '#F0A500' : '#FF6B6B' }}>
            {showResult === 'correct' ? `+${results[results.length - 1]?.points} pts` :
             showResult === 'timeout' ? 'Time\'s up!' : 'Wrong answer'}
          </div>
        </div>
      )}

      {/* QUESTION */}
      <div style={s.gameContent}>
        <div style={s.questionCard}>
          <div style={s.questionText}>
            <MathText text={q?.body} />
          </div>
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
  shell: { minHeight: '100vh', background: '#0D1117', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', position: 'relative' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', background: '#161B22', borderBottom: '1px solid rgba(240,246,252,0.06)' },
  backBtn: { background: 'transparent', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'DM Sans, sans-serif' },
  headerTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: '600', color: '#F0F6FC' },
  centred: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px' },
  setupCard: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '20px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' },
  setupKente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#F0A500 0,#F0A500 20px,#00C896 20px,#00C896 40px,#FF6B6B 40px,#FF6B6B 60px,#4A9EFF 60px,#4A9EFF 80px)' },
  setupIcon: { fontSize: '3rem', marginBottom: '12px' },
  setupTitle: { fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: '700', color: '#F0F6FC', marginBottom: '8px' },
  setupSub: { fontSize: '0.85rem', color: '#8B949E', marginBottom: '28px' },
  subjectList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', textAlign: 'left' },
  subjectOption: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '2px solid rgba(240,246,252,0.08)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', background: '#1C2330' },
  subjectOptionSel: { borderColor: '#F0A500', background: 'rgba(240,165,0,0.08)' },
  subjectDot: { width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(240,246,252,0.2)', flexShrink: 0 },
  subjectDotSel: { background: '#F0A500', borderColor: '#F0A500' },
  subjectLabel: { fontSize: '0.9rem', fontWeight: '500', color: '#F0F6FC' },
  btnGold: { width: '100%', padding: '14px', background: '#F0A500', border: 'none', borderRadius: '10px', color: '#0D1117', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  btnOutline: { width: '100%', padding: '14px', background: 'transparent', border: '1.5px solid rgba(240,246,252,0.1)', borderRadius: '10px', color: '#F0F6FC', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  countdownWrap: { textAlign: 'center' },
  countdownNum: { fontFamily: 'Georgia, serif', fontSize: '8rem', fontWeight: '900', color: '#F0A500', lineHeight: 1, animation: 'pulse 1s ease infinite' },
  countdownLabel: { fontSize: '1.2rem', color: '#8B949E', marginTop: '8px' },
  gameTopbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#161B22', borderBottom: '1px solid rgba(240,246,252,0.06)' },
  scoreDisplay: { textAlign: 'center', minWidth: '70px' },
  scoreName: { fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.1em', color: '#8B949E', marginBottom: '2px' },
  scoreNum: { fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: '700', color: '#F0A500', lineHeight: 1 },
  timerWrap: { position: 'relative', width: '60px', height: '60px' },
  timerNum: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: '700' },
  streakDisplay: { textAlign: 'center', minWidth: '70px' },
  gameProgress: { height: '4px', background: '#1C2330' },
  gameProgressFill: { height: '100%', background: 'linear-gradient(90deg,#F0A500,#00C896)', transition: 'width 0.4s ease' },
  questionCount: { textAlign: 'center', fontSize: '0.72rem', color: '#484F58', padding: '8px', fontWeight: '600', letterSpacing: '0.06em' },
  resultOverlay: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' },
  resultEmoji: { fontSize: '4rem', marginBottom: '8px' },
  resultText: { fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontWeight: '700' },
  gameContent: { flex: 1, padding: '20px', maxWidth: '700px', margin: '0 auto', width: '100%' },
  questionCard: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '16px' },
  questionText: { fontSize: '1.05rem', lineHeight: '1.65', color: '#F0F6FC', textAlign: 'center' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  gameOption: { display: 'flex', alignItems: 'center', gap: '10px', background: '#161B22', border: '2px solid rgba(240,246,252,0.08)', borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' },
  gameOptionSelected: { borderColor: '#F0A500', background: 'rgba(240,165,0,0.08)' },
  gameOptionCorrect: { borderColor: '#00C896', background: 'rgba(0,200,150,0.1)', cursor: 'default' },
  gameOptionWrong: { borderColor: '#FF6B6B', background: 'rgba(255,107,107,0.1)', cursor: 'default' },
  gameOptionDim: { opacity: 0.4, cursor: 'default' },
  gameOptLetter: { width: '28px', height: '28px', borderRadius: '50%', background: '#1C2330', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: '700', color: '#8B949E', flexShrink: 0 },
  gameOptText: { fontSize: '0.88rem', color: '#F0F6FC', flex: 1 },
  content: { padding: '24px', maxWidth: '600px', margin: '0 auto', width: '100%' },
  finishedHero: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '20px', padding: '36px', textAlign: 'center', marginBottom: '20px', position: 'relative', overflow: 'hidden' },
  finishedKente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#F0A500 0,#F0A500 20px,#00C896 20px,#00C896 40px,#FF6B6B 40px,#FF6B6B 60px,#4A9EFF 60px,#4A9EFF 80px)' },
  finishedIcon: { fontSize: '3rem', marginBottom: '8px' },
  finalScore: { fontFamily: 'Georgia, serif', fontSize: '4rem', fontWeight: '900', color: '#F0A500', lineHeight: 1 },
  finalScoreLabel: { fontSize: '0.72rem', fontWeight: '600', letterSpacing: '0.15em', color: '#8B949E', marginBottom: '20px' },
  finalStats: { display: 'flex', justifyContent: 'center', gap: '32px' },
  finalStat: { textAlign: 'center' },
  finalStatNum: { fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: '700' },
  finalStatLabel: { fontSize: '0.72rem', color: '#8B949E', marginTop: '2px' },
  resultsList: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
  resultItem: { display: 'flex', alignItems: 'center', gap: '10px', background: '#161B22', border: '1px solid', borderRadius: '8px', padding: '10px 14px' },
  resultStatus: { fontSize: '1rem', fontWeight: '700', flexShrink: 0 },
  resultQ: { fontSize: '0.8rem', color: '#8B949E', flex: 1 },
  resultPts: { fontSize: '0.78rem', fontWeight: '600', color: '#F0A500', flexShrink: 0 },
  finishedActions: { display: 'flex', flexDirection: 'column', gap: '10px' },
}