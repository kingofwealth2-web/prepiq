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

    // Get questions for this subject/year
    let query = supabase
      .from('questions')
      .select('id')
      .eq('subject_id', selected.subject)
      .eq('question_type', 'OBJ')
      .limit(40)

    if (selected.year) query = query.eq('year', selected.year)
    const { data: questions } = await query

    if (!questions || questions.length === 0) {
      alert('No questions found for this selection. Try a different subject or year.')
      return
    }

    // Create mock exam record
    const { data: exam } = await supabase
      .from('mock_exams')
      .insert({
        user_id: user.id,
        mode: selected.mode,
        config: { subject_id: selected.subject, year: selected.year },
        total_questions: questions.length,
        duration_minutes: 45,
      })
      .select().single()

    navigate(`/mock/${exam.id}`, { state: { questions, examId: exam.id } })
  }

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <div style={s.logo}>Prep<span style={s.gold}>IQ</span></div>
        <h2 style={s.heading}>Mock exam</h2>
        <p style={s.sub}>Choose how you want to be tested.</p>

        {/* MODE */}
        <div style={s.modeList}>
          {[
            { key:'past_paper', label:'Past paper', desc:'Sit a real past paper under timed conditions' },
            { key:'custom', label:'Custom mock', desc:'Choose subject, topics and question count' },
          ].map(mode => (
            <div key={mode.key}
              style={{ ...s.modeOption, ...(selected.mode === mode.key ? s.modeOptionSel : {}) }}
              onClick={() => setSelected({ ...selected, mode: mode.key })}>
              <div style={{ ...s.modeDot, ...(selected.mode === mode.key ? s.modeDotSel : {}) }} />
              <div>
                <div style={s.modeLabel}>{mode.label}</div>
                <div style={s.modeDesc}>{mode.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ ...s.modeOption, opacity:0.5 }}
            onClick={() => navigate('/premium')}>
            <div style={s.modeDot} />
            <div>
              <div style={s.modeLabel}>Predicted exam <span style={s.premBadge}>Premium</span></div>
              <div style={s.modeDesc}>AI-generated questions weighted to high-probability topics</div>
            </div>
          </div>
        </div>

        {/* SUBJECT & YEAR */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.label}>Subject</label>
            <select style={s.select} value={selected.subject}
              onChange={e => setSelected({ ...selected, subject: e.target.value })}>
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Year (optional)</label>
            <select style={s.select} value={selected.year}
              onChange={e => setSelected({ ...selected, year: e.target.value })}>
              <option value="">Any year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <button style={{ ...s.btnGold, opacity: selected.subject ? 1 : 0.5 }}
          onClick={handleStart} disabled={!selected.subject}>
          Start exam →
        </button>
      </div>
    </div>
  )
}

const s = {
  shell: { minHeight:'100vh', background:'#0D1117', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:'DM Sans, sans-serif' },
  card: { background:'#161B22', border:'1px solid rgba(240,246,252,0.08)', borderRadius:'20px', padding:'40px', width:'100%', maxWidth:'520px' },
  back: { background:'transparent', border:'none', color:'#8B949E', cursor:'pointer', fontSize:'0.85rem', fontFamily:'DM Sans, sans-serif', padding:'0', marginBottom:'20px', display:'block' },
  logo: { fontFamily:'Georgia, serif', fontSize:'1.4rem', fontWeight:'700', color:'#F0F6FC', marginBottom:'20px' },
  gold: { color:'#F0A500' },
  heading: { fontFamily:'Georgia, serif', fontSize:'1.5rem', fontWeight:'700', color:'#F0F6FC', marginBottom:'4px' },
  sub: { fontSize:'0.88rem', color:'#8B949E', marginBottom:'24px' },
  modeList: { display:'flex', flexDirection:'column', gap:'10px', marginBottom:'24px' },
  modeOption: { display:'flex', alignItems:'center', gap:'14px', padding:'16px', border:'2px solid rgba(240,246,252,0.08)', borderRadius:'10px', cursor:'pointer', background:'#1C2330', transition:'all 0.2s' },
  modeOptionSel: { borderColor:'#F0A500', background:'rgba(240,165,0,0.06)' },
  modeDot: { width:'18px', height:'18px', borderRadius:'50%', border:'2px solid rgba(240,246,252,0.2)', flexShrink:0 },
  modeDotSel: { background:'#F0A500', borderColor:'#F0A500' },
  modeLabel: { fontSize:'0.92rem', fontWeight:'600', color:'#F0F6FC', marginBottom:'2px' },
  modeDesc: { fontSize:'0.78rem', color:'#8B949E' },
  premBadge: { background:'rgba(240,165,0,0.15)', color:'#F0A500', padding:'2px 8px', borderRadius:'20px', fontSize:'0.68rem', fontWeight:'600', marginLeft:'6px' },
  formRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' },
  formGroup: { display:'flex', flexDirection:'column', gap:'6px' },
  label: { fontSize:'0.75rem', fontWeight:'600', color:'#8B949E', letterSpacing:'0.06em', textTransform:'uppercase' },
  select: { padding:'11px 14px', background:'#1C2330', border:'1.5px solid rgba(240,246,252,0.08)', borderRadius:'8px', color:'#F0F6FC', fontSize:'0.88rem', fontFamily:'DM Sans, sans-serif', cursor:'pointer', outline:'none' },
  btnGold: { width:'100%', padding:'14px', background:'#F0A500', border:'none', borderRadius:'8px', color:'#0D1117', fontWeight:'700', fontSize:'0.92rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
}