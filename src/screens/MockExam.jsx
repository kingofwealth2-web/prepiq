import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import MathText from '../components/MathText'

export default function MockExam() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [options, setOptions] = useState({})
  const [timeLeft, setTimeLeft] = useState(45 * 60)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => { loadExam(); return () => clearInterval(timerRef.current) }, [])
  useEffect(() => {
    if (!loading && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 } return t - 1 })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [loading, submitted])

  async function loadExam() {
    const questionIds = location.state?.questions?.map(q => q.id) || []
    if (questionIds.length === 0) { navigate('/mock'); return }
    const { data } = await supabase.from('questions').select(`*, subjects(name), answer_options(*)`).in('id', questionIds)
    const optMap = {}
    data?.forEach(q => { optMap[q.id] = q.answer_options.sort((a, b) => a.label.localeCompare(b.label)) })
    setQuestions(data || []); setOptions(optMap); setLoading(false)
  }

  const handleSelect = (questionId, optionId) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  async function handleSubmit() {
    if (submitted) return
    setSubmitted(true); clearInterval(timerRef.current)
    const responses = questions.map(q => {
      const selectedId = answers[q.id]
      const selectedOption = options[q.id]?.find(o => o.id === selectedId)
      return { exam_id: id, question_id: q.id, selected_option_id: selectedId || null, is_correct: selectedOption?.is_correct || false, time_spent_secs: 0 }
    })
    await supabase.from('mock_responses').insert(responses)
    await supabase.from('mock_exams').update({ submitted_at: new Date().toISOString() }).eq('id', id)
    navigate(`/mock/${id}/results`, { state: { questions, answers, options } })
  }

  const formatTime = secs => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`
  const answeredCount = Object.keys(answers).length
  const isUrgent = timeLeft < 300

  if (loading) return (
    <div style={s.loadShell}><div style={s.spinner} /></div>
  )

  const q = questions[current]
  const qOptions = options[q?.id] || []

  return (
    <div style={s.shell}>
      <div style={s.kente} />
      <div style={s.topbar}>
        <div>
          <div style={s.examLabel}>{q?.subjects?.name || 'Mock Exam'}</div>
          <div style={{ ...s.timer, ...(isUrgent ? s.timerUrgent : {}) }}>{formatTime(timeLeft)}</div>
        </div>
        <div style={s.topbarCenter}>{answeredCount} / {questions.length} answered</div>
        <button style={s.submitBtn} onClick={() => {
          if (window.confirm(`Submit exam? You have ${questions.length - answeredCount} unanswered questions.`)) handleSubmit()
        }}>Submit exam</button>
      </div>

      <div style={s.pills}>
        {questions.map((q, i) => (
          <div key={q.id} style={{ ...s.pill, ...(i === current ? s.pillCurrent : {}), ...(answers[q.id] ? s.pillAnswered : {}) }}
            onClick={() => setCurrent(i)}>{i + 1}</div>
        ))}
      </div>

      <div style={s.content}>
        <div style={s.questionCard}>
          <div style={s.questionNum}>Question {current + 1} of {questions.length}</div>
          <div style={s.questionText}><MathText text={q?.body} /></div>
        </div>

        <div style={s.optionsList}>
          {qOptions.map(option => (
            <div key={option.id}
              style={{ ...s.option, ...(answers[q?.id] === option.id ? s.optionSelected : {}) }}
              onClick={() => handleSelect(q?.id, option.id)}>
              <div style={{ ...s.optLetter, ...(answers[q?.id] === option.id ? s.optLetterSelected : {}) }}>{option.label}</div>
              <div style={s.optText}><MathText text={option.body} /></div>
            </div>
          ))}
        </div>

        <div style={s.navRow}>
          <button style={s.navBtn} onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← Previous</button>
          {current < questions.length - 1 ? (
            <button style={s.btnPrimary} onClick={() => setCurrent(c => c + 1)}>Next →</button>
          ) : (
            <button style={s.btnPrimary} onClick={() => {
              if (window.confirm(`Submit exam? You have ${questions.length - answeredCount} unanswered questions.`)) handleSubmit()
            }}>Submit exam</button>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  shell: { minHeight: '100vh', background: 'var(--cream)', fontFamily: 'var(--ff-sans)', display: 'flex', flexDirection: 'column' },
  loadShell: { minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '32px', height: '32px', border: '3px solid var(--border-mid)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  kente: { height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: '#fff', borderBottom: '1px solid var(--border)' },
  examLabel: { fontSize: '0.7rem', color: 'var(--ink-muted)', marginBottom: '2px', fontWeight: '500' },
  timer: { fontFamily: 'var(--ff-serif)', fontSize: '1.6rem', fontWeight: '700', color: 'var(--ink)', lineHeight: 1 },
  timerUrgent: { color: 'var(--red)' },
  topbarCenter: { fontSize: '0.84rem', color: 'var(--ink-muted)', fontWeight: '500' },
  submitBtn: { padding: '9px 18px', background: 'var(--red-pale)', border: '1px solid rgba(200,16,46,0.2)', borderRadius: 'var(--r-sm)', color: 'var(--red)', fontWeight: '600', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  pills: { display: 'flex', gap: '5px', padding: '12px 24px', background: '#fff', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexWrap: 'wrap' },
  pill: { width: '32px', height: '32px', borderRadius: '7px', border: '1.5px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', color: 'var(--ink-muted)', flexShrink: 0, transition: 'all 0.15s' },
  pillCurrent: { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-pale)' },
  pillAnswered: { background: 'var(--teal)', borderColor: 'var(--teal)', color: '#fff' },
  content: { flex: 1, padding: '28px', maxWidth: '760px', margin: '0 auto', width: '100%' },
  questionCard: { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '28px', marginBottom: '18px', boxShadow: 'var(--shadow-sm)' },
  questionNum: { fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: '10px', textTransform: 'uppercase' },
  questionText: { fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--ink)' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '22px' },
  option: { display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', border: '2px solid var(--border)', borderRadius: 'var(--r-md)', padding: '15px 18px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)' },
  optionSelected: { borderColor: 'var(--gold)', background: 'var(--gold-pale)' },
  optLetter: { width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.84rem', fontWeight: '700', color: 'var(--ink-muted)', flexShrink: 0, transition: 'all 0.15s' },
  optLetterSelected: { background: 'var(--gold)', borderColor: 'var(--gold)', color: '#fff' },
  optText: { fontSize: '0.92rem', color: 'var(--ink)', flex: 1 },
  navRow: { display: 'flex', gap: '10px', justifyContent: 'space-between' },
  navBtn: { padding: '12px 24px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  btnPrimary: { padding: '12px 32px', background: 'var(--forest)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
}
