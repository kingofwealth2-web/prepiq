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

  const toggleSubject = s => setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const getDaysLeft = () => {
    if (!examDate) return 0
    return Math.max(0, Math.ceil((new Date(examDate) - new Date()) / 86400000))
  }

  const handleFinish = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('users').update({ exam_type: examType, exam_date: examDate || null }).eq('id', user.id)
    navigate('/dashboard')
  }

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <div style={s.kente} />
        <div style={s.logo}>Prep<em style={s.em}>IQ</em></div>

        {/* Progress */}
        <div style={s.progressRow}>
          <div style={s.stepLabel}>Step {step} of 3</div>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ animation: 'fadeUp 0.3s ease both' }}>
            <h2 style={s.heading}>Which exam are you preparing for?</h2>
            <p style={s.sub}>We'll tailor your content and study plan to match.</p>
            <div style={s.optionList}>
              {[
                { key: 'WASSCE', label: 'WASSCE', desc: 'West Africa Senior School Certificate Exam' },
                { key: 'BECE', label: 'BECE', desc: 'Basic Education Certificate Exam — JHS' },
                { key: 'University', label: 'University Entrance', desc: 'Tertiary admission examinations' },
              ].map(opt => (
                <div key={opt.key}
                  style={{ ...s.option, ...(examType === opt.key ? s.optionSel : {}) }}
                  onClick={() => setExamType(opt.key)}>
                  <div style={{ ...s.optDot, ...(examType === opt.key ? s.optDotSel : {}) }} />
                  <div>
                    <div style={s.optLabel}>{opt.label}</div>
                    <div style={s.optDesc}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button style={{ ...s.btnPrimary, opacity: examType ? 1 : 0.45 }} disabled={!examType} onClick={() => setStep(2)}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ animation: 'fadeUp 0.3s ease both' }}>
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
            <div style={s.btnRow}>
              <button style={s.btnOutline} onClick={() => setStep(1)}>← Back</button>
              <button style={{ ...s.btnPrimary, opacity: subjects.length ? 1 : 0.45 }} disabled={!subjects.length} onClick={() => setStep(3)}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ animation: 'fadeUp 0.3s ease both' }}>
            <h2 style={s.heading}>When is your exam?</h2>
            <p style={s.sub}>We'll build your study plan backwards from this date.</p>
            <div style={s.formGroup}>
              <label style={s.label}>Exam date</label>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
            </div>
            {examDate && (
              <div style={s.countdownCard}>
                <div style={s.countdownLabel}>Days until your exam</div>
                <div style={s.countdownNum}>{getDaysLeft()}</div>
                <div style={s.countdownSub}>
                  {getDaysLeft() > 60 ? "Plenty of time — let's make it count." :
                   getDaysLeft() > 30 ? 'Getting close — time to focus.' : 'Final stretch — stay consistent.'}
                </div>
              </div>
            )}
            <div style={s.btnRow}>
              <button style={s.btnOutline} onClick={() => setStep(2)}>← Back</button>
              <button style={s.btnPrimary} onClick={handleFinish} disabled={loading}>
                {loading ? 'Setting up...' : "Let's go →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  shell: { minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'var(--ff-sans)' },
  card: { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '40px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-md)', position: 'relative', overflow: 'hidden' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  logo: { fontFamily: 'var(--ff-serif)', fontSize: '1.4rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '24px' },
  em: { color: 'var(--gold-light)', fontStyle: 'italic' },
  progressRow: { marginBottom: '28px' },
  stepLabel: { fontSize: '0.68rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' },
  progressTrack: { height: '3px', background: 'var(--cream-mid)', borderRadius: '2px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--gold)', borderRadius: '2px', transition: 'width 0.4s ease' },
  heading: { fontFamily: 'var(--ff-serif)', fontSize: '1.3rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '6px' },
  sub: { fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '20px' },
  optionList: { display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '22px' },
  option: { display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 16px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'all 0.15s', background: 'var(--cream)' },
  optionSel: { borderColor: 'var(--gold)', background: 'var(--gold-pale)' },
  optDot: { width: '17px', height: '17px', borderRadius: '50%', border: '2px solid var(--border-mid)', flexShrink: 0, transition: 'all 0.15s' },
  optDotSel: { background: 'var(--gold)', borderColor: 'var(--gold)' },
  optLabel: { fontSize: '0.92rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px' },
  optDesc: { fontSize: '0.76rem', color: 'var(--ink-muted)' },
  chipWrap: { display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '22px' },
  chip: { padding: '6px 13px', borderRadius: '20px', border: '1.5px solid var(--border-mid)', background: 'var(--cream)', color: 'var(--ink-muted)', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s' },
  chipSel: { borderColor: 'var(--gold)', background: 'var(--gold-pale)', color: 'var(--gold)' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
  label: { fontSize: '0.72rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  countdownCard: { background: 'var(--forest)', border: '1px solid rgba(200,136,10,0.2)', borderRadius: 'var(--r-md)', padding: '20px', textAlign: 'center', marginBottom: '22px' },
  countdownLabel: { fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.12em', color: 'rgba(247,243,238,0.45)', marginBottom: '6px', textTransform: 'uppercase' },
  countdownNum: { fontFamily: 'var(--ff-serif)', fontSize: '3.5rem', fontWeight: '700', color: 'var(--gold-light)', lineHeight: 1 },
  countdownSub: { fontSize: '0.78rem', color: 'rgba(247,243,238,0.5)', marginTop: '8px' },
  btnRow: { display: 'flex', gap: '10px' },
  btnPrimary: { flex: 1, padding: '13px', background: 'var(--forest)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)', transition: 'opacity 0.15s' },
  btnOutline: { flex: 1, padding: '13px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
}
