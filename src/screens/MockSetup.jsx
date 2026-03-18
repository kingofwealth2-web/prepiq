import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function MockSetup() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [selected, setSelected] = useState({ subject: '', year: '', mode: 'past_paper' })

  useEffect(() => {
    supabase.from('subjects').select('*').order('name').then(({ data }) => setSubjects(data || []))
  }, [])

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  const handleStart = async () => {
    if (!selected.subject) return
    const { data: { user } } = await supabase.auth.getUser()
    let query = supabase.from('questions').select('id').eq('subject_id', selected.subject).eq('question_type', 'OBJ').limit(40)
    if (selected.year) query = query.eq('year', selected.year)
    const { data: questions } = await query
    if (!questions || questions.length === 0) { alert('No questions found for this selection. Try a different subject or year.'); return }
    const { data: exam } = await supabase.from('mock_exams').insert({
      user_id: user.id, mode: selected.mode,
      config: { subject_id: selected.subject, year: selected.year },
      total_questions: questions.length, duration_minutes: 45,
    }).select().single()
    navigate(`/mock/${exam.id}`, { state: { questions, examId: exam.id } })
  }

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <div style={s.kente} />
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <div style={s.logo}>Prep<em style={s.em}>IQ</em></div>
        <h2 style={s.heading}>Mock exam</h2>
        <p style={s.sub}>Choose how you want to be tested.</p>

        <div style={s.modeList}>
          {[
            { key: 'past_paper', label: 'Past paper', desc: 'Sit a real past paper under timed conditions' },
            { key: 'custom', label: 'Custom mock', desc: 'Choose subject, topics and question count' },
          ].map(mode => (
            <div key={mode.key} style={{ ...s.modeOpt, ...(selected.mode === mode.key ? s.modeOptSel : {}) }}
              onClick={() => setSelected({ ...selected, mode: mode.key })}>
              <div style={{ ...s.modeDot, ...(selected.mode === mode.key ? s.modeDotSel : {}) }} />
              <div>
                <div style={s.modeLabel}>{mode.label}</div>
                <div style={s.modeDesc}>{mode.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ ...s.modeOpt, opacity: 0.5 }} onClick={() => navigate('/premium')}>
            <div style={s.modeDot} />
            <div>
              <div style={s.modeLabel}>Predicted exam <span style={s.premBadge}>Premium</span></div>
              <div style={s.modeDesc}>AI-generated questions weighted to high-probability topics</div>
            </div>
          </div>
        </div>

        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.label}>Subject</label>
            <select style={s.selectEl} value={selected.subject} onChange={e => setSelected({ ...selected, subject: e.target.value })}>
              <option value="">Select subject</option>
              {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Year (optional)</label>
            <select style={s.selectEl} value={selected.year} onChange={e => setSelected({ ...selected, year: e.target.value })}>
              <option value="">Any year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <button style={{ ...s.btnPrimary, opacity: selected.subject ? 1 : 0.45 }} onClick={handleStart} disabled={!selected.subject}>
          Start exam →
        </button>
      </div>
    </div>
  )
}

const s = {
  shell: { minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'var(--ff-sans)' },
  card: { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '40px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-md)', position: 'relative', overflow: 'hidden' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  back: { background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.84rem', fontFamily: 'var(--ff-sans)', padding: '0', marginBottom: '16px', display: 'block' },
  logo: { fontFamily: 'var(--ff-serif)', fontSize: '1.3rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' },
  em: { color: 'var(--gold-light)', fontStyle: 'italic' },
  heading: { fontFamily: 'var(--ff-serif)', fontSize: '1.4rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '4px' },
  sub: { fontSize: '0.86rem', color: 'var(--ink-muted)', marginBottom: '22px' },
  modeList: { display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '22px' },
  modeOpt: { display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 16px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', cursor: 'pointer', background: 'var(--cream)', transition: 'all 0.15s' },
  modeOptSel: { borderColor: 'var(--gold)', background: 'var(--gold-pale)' },
  modeDot: { width: '17px', height: '17px', borderRadius: '50%', border: '2px solid var(--border-mid)', flexShrink: 0, transition: 'all 0.15s' },
  modeDotSel: { background: 'var(--gold)', borderColor: 'var(--gold)' },
  modeLabel: { fontSize: '0.9rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px' },
  modeDesc: { fontSize: '0.76rem', color: 'var(--ink-muted)' },
  premBadge: { background: 'var(--gold-pale)', color: 'var(--gold)', padding: '2px 7px', borderRadius: '20px', fontSize: '0.67rem', fontWeight: '600', marginLeft: '6px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.7rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  selectEl: { padding: '10px 12px', background: 'var(--cream)', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontSize: '0.86rem', fontFamily: 'var(--ff-sans)', cursor: 'pointer', outline: 'none' },
  btnPrimary: { width: '100%', padding: '13px', background: 'var(--forest)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
}
