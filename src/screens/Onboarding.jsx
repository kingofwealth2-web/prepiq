import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SUBJECTS = {
  WASSCE: ['Core Mathematics','English Language','Integrated Science','Social Studies','Physics','Chemistry','Biology','Elective Mathematics','Economics','Geography','History','French'],
  BECE: ['Mathematics','English Language','Integrated Science','Social Studies','French','Religious & Moral Education','Creative Arts','ICT'],
  University: ['Mathematics','English','Biology','Chemistry','Physics','Economics','Geography']
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [examType, setExamType] = useState('')
  const [subjects, setSubjects] = useState([])
  const [examDate, setExamDate] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleSubject = (s) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const getDaysLeft = () => {
    if (!examDate) return 0
    const diff = Math.ceil((new Date(examDate) - new Date()) / 86400000)
    return Math.max(0, diff)
  }

  const handleFinish = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('users').update({
      exam_type: examType,
      exam_date: examDate || null,
    }).eq('id', user.id)
    navigate('/dashboard')
  }

  return (
    <div style={s.shell}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logo}>Prep<span style={s.gold}>IQ</span></div>

        {/* Progress */}
        <div style={s.stepLabel}>STEP {step} OF 3</div>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${(step/3)*100}%` }} />
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div>
            <h2 style={s.heading}>Which exam are you preparing for?</h2>
            <p style={s.sub}>We'll tailor your content and study plan to match.</p>
            <div style={s.optionList}>
              {[
                { key:'WASSCE', label:'WASSCE', desc:'West Africa Senior School Certificate Exam' },
                { key:'BECE', label:'BECE', desc:'Basic Education Certificate Exam — JHS' },
                { key:'University', label:'University Entrance', desc:'Tertiary admission examinations' },
              ].map(opt => (
                <div key={opt.key} style={{ ...s.option, ...(examType===opt.key ? s.optionSel : {}) }}
                  onClick={() => setExamType(opt.key)}>
                  <div style={{ ...s.optionDot, ...(examType===opt.key ? s.optionDotSel : {}) }} />
                  <div>
                    <div style={s.optionLabel}>{opt.label}</div>
                    <div style={s.optionDesc}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button style={{ ...s.btn, opacity: examType ? 1 : 0.5 }}
              disabled={!examType} onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div>
            <h2 style={s.heading}>Select your subjects</h2>
            <p style={s.sub}>Pick all the subjects you're studying for.</p>
            <div style={s.chipWrap}>
              {(SUBJECTS[examType] || []).map(sub => (
                <div key={sub}
                  style={{ ...s.chip, ...(subjects.includes(sub) ? s.chipSel : {}) }}
                  onClick={() => toggleSubject(sub)}>
                  {sub}
                </div>
              ))}
            </div>
            <div style={s.row}>
              <button style={s.btnOutline} onClick={() => setStep(1)}>Back</button>
              <button style={{ ...s.btn, opacity: subjects.length ? 1 : 0.5 }}
                disabled={!subjects.length} onClick={() => setStep(3)}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div>
            <h2 style={s.heading}>When is your exam?</h2>
            <p style={s.sub}>We'll build your study plan backwards from this date.</p>
            <div style={s.group}>
              <label style={s.fieldLabel}>Exam date</label>
              <input style={s.input} type="date" value={examDate}
                onChange={e => setExamDate(e.target.value)} />
            </div>
            {examDate && (
              <div style={s.countdownCard}>
                <div style={s.countdownLabel}>DAYS UNTIL YOUR EXAM</div>
                <div style={s.countdownNum}>{getDaysLeft()}</div>
                <div style={s.countdownSub}>
                  {getDaysLeft() > 60 ? "Plenty of time — let's make it count." :
                   getDaysLeft() > 30 ? "Getting close — time to focus." :
                   "Final stretch — stay consistent."}
                </div>
              </div>
            )}
            <div style={s.row}>
              <button style={s.btnOutline} onClick={() => setStep(2)}>Back</button>
              <button style={s.btn} onClick={handleFinish} disabled={loading}>
                {loading ? 'Setting up...' : "Let's go"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  shell: { minHeight:'100vh', background:'#0D1117', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:'DM Sans, sans-serif' },
  card: { background:'#161B22', border:'1px solid rgba(240,246,252,0.08)', borderRadius:'20px', padding:'48px', width:'100%', maxWidth:'520px' },
  logo: { fontFamily:'Georgia, serif', fontSize:'1.6rem', fontWeight:'700', color:'#F0F6FC', marginBottom:'28px' },
  gold: { color:'#F0A500' },
  stepLabel: { fontSize:'0.7rem', fontWeight:'600', letterSpacing:'0.1em', color:'#F0A500', marginBottom:'8px' },
  progressTrack: { height:'4px', background:'#1C2330', borderRadius:'2px', marginBottom:'28px', overflow:'hidden' },
  progressFill: { height:'100%', background:'#F0A500', borderRadius:'2px', transition:'width 0.4s ease' },
  heading: { fontSize:'1.4rem', fontWeight:'700', color:'#F0F6FC', marginBottom:'6px', fontFamily:'Georgia, serif' },
  sub: { fontSize:'0.88rem', color:'#8B949E', marginBottom:'24px' },
  optionList: { display:'flex', flexDirection:'column', gap:'10px', marginBottom:'24px' },
  option: { display:'flex', alignItems:'center', gap:'14px', padding:'16px 18px', border:'2px solid rgba(240,246,252,0.08)', borderRadius:'10px', cursor:'pointer', transition:'all 0.2s', background:'#1C2330' },
  optionSel: { borderColor:'#F0A500', background:'rgba(240,165,0,0.08)' },
  optionDot: { width:'18px', height:'18px', borderRadius:'50%', border:'2px solid rgba(240,246,252,0.2)', flexShrink:0, transition:'all 0.2s' },
  optionDotSel: { background:'#F0A500', borderColor:'#F0A500' },
  optionLabel: { fontSize:'0.95rem', fontWeight:'600', color:'#F0F6FC', marginBottom:'2px' },
  optionDesc: { fontSize:'0.78rem', color:'#8B949E' },
  chipWrap: { display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'24px' },
  chip: { padding:'7px 14px', borderRadius:'20px', border:'1.5px solid rgba(240,246,252,0.1)', background:'#1C2330', color:'#8B949E', fontSize:'0.82rem', fontWeight:'500', cursor:'pointer', transition:'all 0.2s' },
  chipSel: { borderColor:'#F0A500', background:'rgba(240,165,0,0.1)', color:'#F0A500' },
  group: { display:'flex', flexDirection:'column', gap:'6px', marginBottom:'16px' },
  fieldLabel: { fontSize:'0.78rem', fontWeight:'600', color:'#8B949E', letterSpacing:'0.04em' },
  input: { padding:'12px 14px', background:'#1C2330', border:'1.5px solid rgba(240,246,252,0.1)', borderRadius:'8px', color:'#F0F6FC', fontSize:'0.9rem', fontFamily:'DM Sans, sans-serif', outline:'none' },
  countdownCard: { background:'#1C2330', border:'1px solid rgba(240,165,0,0.2)', borderRadius:'12px', padding:'20px', textAlign:'center', marginBottom:'24px' },
  countdownLabel: { fontSize:'0.68rem', fontWeight:'600', letterSpacing:'0.1em', color:'#8B949E', marginBottom:'6px' },
  countdownNum: { fontFamily:'Georgia, serif', fontSize:'3.5rem', fontWeight:'700', color:'#F0A500', lineHeight:'1' },
  countdownSub: { fontSize:'0.8rem', color:'#8B949E', marginTop:'6px' },
  btn: { flex:1, padding:'13px', background:'#F0A500', border:'none', borderRadius:'8px', color:'#0D1117', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
  btnOutline: { flex:1, padding:'13px', background:'transparent', border:'1.5px solid rgba(240,246,252,0.1)', borderRadius:'8px', color:'#F0F6FC', fontWeight:'600', fontSize:'0.9rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
  row: { display:'flex', gap:'10px' },
}