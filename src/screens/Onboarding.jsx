import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AccentPicker, useAccent } from '../context/AccentContext'

const SUBJECTS = {
  WASSCE: ['Core Mathematics','English Language','Integrated Science','Social Studies','Physics','Chemistry','Biology','Elective Mathematics','Economics','Geography','History','French'],
  BECE: ['Mathematics','English Language','Integrated Science','Social Studies','French','Religious & Moral Education','Creative Arts','ICT'],
  University: ['Mathematics','English','Biology','Chemistry','Physics','Economics','Geography'],
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { accent } = useAccent()
  const [step, setStep] = useState(1)
  const [examType, setExamType] = useState('')
  const [subjects, setSubjects] = useState([])
  const [examDate, setExamDate] = useState('')
  const [loading, setLoading] = useState(false)

  const toggle = sub => setSubjects(prev =>
    prev.includes(sub) ? prev.filter(x => x !== sub) : [...prev, sub]
  )

  const daysLeft = () => {
    if (!examDate) return 0
    return Math.max(0, Math.ceil((new Date(examDate) - new Date()) / 86400000))
  }

  const finish = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('users').update({
      exam_type: examType,
      exam_date: examDate || null,
      accent_color: accent,
    }).eq('id', user.id)
    navigate('/dashboard')
  }

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <div style={s.kente} />
        <div style={s.logo}>Prep<em style={s.em}>IQ</em></div>

        <div style={s.progressRow}>
          <div style={s.stepLbl}>Step {step} of 4</div>
          <div style={s.track}>
            <div style={{ ...s.fill, width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {step === 1 && (
          <div>
            <h2 style={s.heading}>Which exam are you preparing for?</h2>
            <p style={s.sub}>We'll tailor everything to match your syllabus.</p>
            <div style={s.optList}>
              {[
                { key: 'WASSCE', label: 'WASSCE', desc: 'West Africa Senior School Certificate Exam' },
                { key: 'BECE', label: 'BECE', desc: 'Basic Education Certificate Exam — JHS' },
                { key: 'University', label: 'University Entrance', desc: 'Tertiary admission examinations' },
              ].map(opt => (
                <div key={opt.key}
                  style={{ ...s.opt, ...(examType === opt.key ? s.optSel : {}) }}
                  onClick={() => setExamType(opt.key)}>
                  <div style={{ ...s.optDot, ...(examType === opt.key ? s.optDotSel : {}) }} />
                  <div>
                    <div style={s.optLabel}>{opt.label}</div>
                    <div style={s.optDesc}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              style={{ ...s.btnPrimary, opacity: examType ? 1 : 0.45 }}
              disabled={!examType}
              onClick={() => setStep(2)}>
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={s.heading}>Select your subjects</h2>
            <p style={s.sub}>Pick all the subjects you're studying for.</p>
            <div style={s.chipWrap}>
              {(SUBJECTS[examType] || []).map(sub => (
                <div key={sub}
                  style={{ ...s.chip, ...(subjects.includes(sub) ? s.chipSel : {}) }}
                  onClick={() => toggle(sub)}>
                  {sub}
                </div>
              ))}
            </div>
            <div style={s.btnRow}>
              <button style={s.btnOutline} onClick={() => setStep(1)}>← Back</button>
              <button
                style={{ ...s.btnPrimary, opacity: subjects.length ? 1 : 0.45 }}
                disabled={!subjects.length}
                onClick={() => setStep(3)}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={s.heading}>When is your exam?</h2>
            <p style={s.sub}>We'll build your study plan from this date.</p>
            <div style={s.formGroup}>
              <label style={s.label}>Exam date</label>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
            </div>
            {examDate && (
              <div style={s.countdownCard}>
                <div style={s.countdownLbl}>Days until your exam</div>
                <div style={{ ...s.countdownNum, color: 'var(--accent-light)' }}>{daysLeft()}</div>
                <div style={s.countdownSub}>
                  {daysLeft() > 60
                    ? "Plenty of time — let's make it count."
                    : daysLeft() > 30
                    ? 'Getting close — time to focus.'
                    : 'Final stretch — stay consistent.'}
                </div>
              </div>
            )}
            <div style={s.btnRow}>
              <button style={s.btnOutline} onClick={() => setStep(2)}>← Back</button>
              <button style={s.btnPrimary} onClick={() => setStep(4)}>Continue →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={s.heading}>Make it yours</h2>
            <p style={s.sub}>Choose an accent colour. Change it anytime in settings.</p>
            <div style={s.pickerCard}>
              <AccentPicker />
            </div>
            <div style={s.previewGrid}>
              <div style={s.previewStat}>
                <div style={s.previewNum}>247</div>
                <div style={s.previewLbl}>Questions</div>
              </div>
              <div style={s.previewStat}>
                <div style={s.previewNum}>74%</div>
                <div style={s.previewLbl}>Accuracy</div>
              </div>
              <div style={s.previewStat}>
                <div style={s.previewNum}>12🔥</div>
                <div style={s.previewLbl}>Streak</div>
              </div>
            </div>
            <div style={s.btnRow}>
              <button style={s.btnOutline} onClick={() => setStep(3)}>← Back</button>
              <button style={s.btnPrimary} onClick={finish} disabled={loading}>
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
  shell: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'var(--ff)', position: 'relative', zIndex: 1 },
  card: { background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-2xl)', padding: '40px', width: '100%', maxWidth: '500px', position: 'relative', overflow: 'hidden' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 14px,#009E73 14px,#009E73 28px,#C8102E 28px,#C8102E 42px,#1A5DC8 42px,#1A5DC8 56px)' },
  logo: { fontSize: '1.4rem', fontWeight: '800', color: 'var(--ink)', marginBottom: '22px', letterSpacing: '-.04em' },
  em: { color: 'var(--accent-light)', fontStyle: 'italic' },
  progressRow: { marginBottom: '26px' },
  stepLbl: { fontSize: '.64rem', fontWeight: '700', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '7px' },
  track: { height: '3px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' },
  fill: { height: '100%', background: 'var(--accent-primary)', borderRadius: '3px', transition: 'width .4s ease' },
  heading: { fontSize: '1.25rem', fontWeight: '800', color: 'var(--ink)', marginBottom: '5px', letterSpacing: '-.03em' },
  sub: { fontSize: '.84rem', color: 'var(--ink-muted)', marginBottom: '18px' },
  optList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  opt: { display: 'flex', alignItems: 'center', gap: '13px', padding: '14px 15px', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-md)', cursor: 'pointer', background: 'var(--surface)', transition: 'border-color .15s, background .15s' },
  optSel: { borderColor: 'var(--accent-primary)', background: 'var(--accent-soft)' },
  optDot: { width: '17px', height: '17px', borderRadius: '50%', border: '2px solid var(--border-mid)', flexShrink: 0, transition: 'all .15s' },
  optDotSel: { background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' },
  optLabel: { fontSize: '.9rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px' },
  optDesc: { fontSize: '.75rem', color: 'var(--ink-muted)' },
  chipWrap: { display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '20px' },
  chip: { padding: '6px 13px', borderRadius: '20px', border: '1px solid var(--border-mid)', background: 'var(--surface)', color: 'var(--ink-muted)', fontSize: '.8rem', fontWeight: '500', cursor: 'pointer', transition: 'all .15s' },
  chipSel: { borderColor: 'var(--accent-primary)', background: 'var(--accent-soft)', color: 'var(--accent-light)' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
  label: { fontSize: '.68rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '.07em', textTransform: 'uppercase' },
  countdownCard: { background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', padding: '20px', textAlign: 'center', marginBottom: '20px' },
  countdownLbl: { fontSize: '.62rem', fontWeight: '700', letterSpacing: '.12em', color: 'var(--ink-muted)', marginBottom: '6px', textTransform: 'uppercase' },
  countdownNum: { fontSize: '3.2rem', fontWeight: '900', lineHeight: 1, letterSpacing: '-.04em' },
  countdownSub: { fontSize: '.76rem', color: 'var(--ink-muted)', marginTop: '6px' },
  pickerCard: { background: 'var(--surface)', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '14px' },
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '18px' },
  previewStat: { background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', padding: '14px', textAlign: 'center', transition: 'background .4s, border-color .4s' },
  previewNum: { fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-light)', lineHeight: 1 },
  previewLbl: { fontSize: '.62rem', color: 'var(--accent-light)', opacity: .6, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '.06em' },
  btnRow: { display: 'flex', gap: '10px' },
  btnPrimary: { flex: 1, padding: '13px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--r-md)', color: '#fff', fontWeight: '700', fontSize: '.9rem', cursor: 'pointer', fontFamily: 'var(--ff)', boxShadow: '0 4px 20px var(--accent-btn-shadow)', transition: 'opacity .15s' },
  btnOutline: { flex: 1, padding: '13px', background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-md)', color: 'var(--ink)', fontWeight: '600', fontSize: '.9rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
}