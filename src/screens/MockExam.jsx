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

  useEffect(() => {
    loadExam()
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (!loading && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [loading, submitted])

  async function loadExam() {
    const questionIds = location.state?.questions?.map(q => q.id) || []
    if (questionIds.length === 0) { navigate('/mock'); return }

    const { data } = await supabase
      .from('questions')
      .select(`*, subjects(name), answer_options(*)`)
      .in('id', questionIds)

    const optMap = {}
    data?.forEach(q => {
      optMap[q.id] = q.answer_options.sort((a, b) => a.label.localeCompare(b.label))
    })

    setQuestions(data || [])
    setOptions(optMap)
    setLoading(false)
  }

  const handleSelect = (questionId, optionId) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  async function handleSubmit() {
    if (submitted) return
    setSubmitted(true)
    clearInterval(timerRef.current)

    const responses = questions.map(q => {
      const selectedId = answers[q.id]
      const selectedOption = options[q.id]?.find(o => o.id === selectedId)
      return {
        exam_id: id,
        question_id: q.id,
        selected_option_id: selectedId || null,
        is_correct: selectedOption?.is_correct || false,
        time_spent_secs: 0,
      }
    })

    await supabase.from('mock_responses').insert(responses)
    await supabase.from('mock_exams').update({ submitted_at: new Date().toISOString() }).eq('id', id)

    navigate(`/mock/${id}/results`, { state: { questions, answers, options } })
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const answeredCount = Object.keys(answers).length
  const isUrgent = timeLeft < 300

  if (loading) return (
    <div style={s.loadShell}>
      <div style={s.loadText}>Loading exam...</div>
    </div>
  )

  const q = questions[current]
  const qOptions = options[q?.id] || []

  return (
    <div style={s.shell}>
      <div style={s.topbar}>
        <div>
          <div style={s.examLabel}>{q?.subjects?.name}</div>
          <div style={{ ...s.timer, ...(isUrgent ? s.timerUrgent : {}) }}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div style={s.topbarCenter}>
          {answeredCount} / {questions.length} answered
        </div>
        <button style={s.submitBtn} onClick={() => {
          if (window.confirm(`Submit exam? You have ${questions.length - answeredCount} unanswered questions.`)) {
            handleSubmit()
          }
        }}>
          Submit exam
        </button>
      </div>

      <div style={s.pills}>
        {questions.map((q, i) => (
          <div key={q.id}
            style={{
              ...s.pill,
              ...(i === current ? s.pillCurrent : {}),
              ...(answers[q.id] ? s.pillAnswered : {}),
            }}
            onClick={() => setCurrent(i)}>
            {i + 1}
          </div>
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
              style={{
                ...s.option,
                ...(answers[q?.id] === option.id ? s.optionSelected : {})
              }}
              onClick={() => handleSelect(q?.id, option.id)}>
              <div style={{
                ...s.optLetter,
                ...(answers[q?.id] === option.id ? s.optLetterSelected : {})
              }}>
                {option.label}
              </div>
              <div style={s.optText}><MathText text={option.body} /></div>
            </div>
          ))}
        </div>

        <div style={s.navRow}>
          <button style={s.navBtn}
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}>
            ← Previous
          </button>
          {current < questions.length - 1 ? (
            <button style={s.btnGold} onClick={() => setCurrent(c => c + 1)}>
              Next →
            </button>
          ) : (
            <button style={s.btnGold} onClick={() => {
              if (window.confirm(`Submit exam? You have ${questions.length - answeredCount} unanswered questions.`)) {
                handleSubmit()
              }
            }}>
              Submit exam
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  shell: { minHeight:'100vh', background:'#0D1117', fontFamily:'DM Sans, sans-serif', display:'flex', flexDirection:'column' },
  loadShell: { minHeight:'100vh', background:'#0D1117', display:'flex', alignItems:'center', justifyContent:'center' },
  loadText: { color:'#8B949E', fontSize:'0.9rem' },
  topbar: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', background:'#161B22', borderBottom:'1px solid rgba(240,246,252,0.06)' },
  examLabel: { fontSize:'0.72rem', color:'#8B949E', marginBottom:'2px' },
  timer: { fontFamily:'Georgia, serif', fontSize:'1.6rem', fontWeight:'700', color:'#F0F6FC' },
  timerUrgent: { color:'#FF6B6B' },
  topbarCenter: { fontSize:'0.85rem', color:'#8B949E' },
  submitBtn: { padding:'9px 20px', background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', borderRadius:'8px', color:'#FF6B6B', fontWeight:'600', fontSize:'0.85rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
  pills: { display:'flex', gap:'5px', padding:'12px 24px', background:'#161B22', borderBottom:'1px solid rgba(240,246,252,0.06)', overflowX:'auto', flexWrap:'wrap' },
  pill: { width:'32px', height:'32px', borderRadius:'7px', border:'1.5px solid rgba(240,246,252,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:'600', cursor:'pointer', color:'#8B949E', flexShrink:0, transition:'all 0.2s' },
  pillCurrent: { borderColor:'#F0A500', color:'#F0A500', background:'rgba(240,165,0,0.08)' },
  pillAnswered: { background:'#00C896', borderColor:'#00C896', color:'#0D1117' },
  content: { flex:1, padding:'28px', maxWidth:'760px', margin:'0 auto', width:'100%' },
  questionCard: { background:'#161B22', border:'1px solid rgba(240,246,252,0.06)', borderRadius:'16px', padding:'28px', marginBottom:'20px' },
  questionNum: { fontSize:'0.7rem', fontWeight:'600', letterSpacing:'0.1em', color:'#F0A500', marginBottom:'10px', textTransform:'uppercase' },
  questionText: { fontSize:'1.05rem', lineHeight:'1.7', color:'#F0F6FC' },
  optionsList: { display:'flex', flexDirection:'column', gap:'10px', marginBottom:'24px' },
  option: { display:'flex', alignItems:'center', gap:'14px', background:'#161B22', border:'2px solid rgba(240,246,252,0.08)', borderRadius:'10px', padding:'16px 18px', cursor:'pointer', transition:'all 0.2s' },
  optionSelected: { borderColor:'#F0A500', background:'rgba(240,165,0,0.06)' },
  optLetter: { width:'34px', height:'34px', borderRadius:'50%', border:'2px solid rgba(240,246,252,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:'700', color:'#8B949E', flexShrink:0, transition:'all 0.2s' },
  optLetterSelected: { background:'#F0A500', borderColor:'#F0A500', color:'#0D1117' },
  optText: { fontSize:'0.92rem', color:'#F0F6FC', flex:1 },
  navRow: { display:'flex', gap:'10px', justifyContent:'space-between' },
  navBtn: { padding:'12px 24px', background:'transparent', border:'1.5px solid rgba(240,246,252,0.1)', borderRadius:'8px', color:'#F0F6FC', fontWeight:'600', fontSize:'0.9rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
  btnGold: { padding:'12px 32px', background:'#F0A500', border:'none', borderRadius:'8px', color:'#0D1117', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
}