import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { gemini } from '../lib/gemini'

// ── Expression definitions ──────────────────────────────────────────────────
const EXPRESSIONS = {
  idle: {
    mouth: 'M67 106 Q80 114 93 106',
    browL: 'M54 68 Q62 64 68 67',
    browR: 'M92 67 Q98 64 106 68',
    blush: 0, stars: 0, sweat: 0, irisY: 81,
  },
  happy: {
    mouth: 'M63 104 Q80 118 97 104',
    browL: 'M54 65 Q62 61 68 64',
    browR: 'M92 64 Q98 61 106 65',
    blush: .35, stars: 0, sweat: 0, irisY: 80,
  },
  excited: {
    mouth: 'M62 103 Q80 120 98 103',
    browL: 'M54 63 Q62 59 68 62',
    browR: 'M92 62 Q98 59 106 63',
    blush: .45, stars: 1, sweat: 0, irisY: 79,
  },
  sad: {
    mouth: 'M67 110 Q80 105 93 110',
    browL: 'M54 67 Q62 71 68 69',
    browR: 'M92 69 Q98 71 106 67',
    blush: .12, stars: 0, sweat: 0, irisY: 83,
  },
  thinking: {
    mouth: 'M69 108 Q80 112 88 108',
    browL: 'M54 67 Q62 62 65 66',
    browR: 'M92 66 Q100 62 106 67',
    blush: 0, stars: 0, sweat: 0, irisY: 79,
  },
  nervous: {
    mouth: 'M69 108 Q80 111 91 108',
    browL: 'M54 69 Q62 65 68 68',
    browR: 'M92 68 Q98 65 106 69',
    blush: 0, stars: 0, sweat: 1, irisY: 82,
  },
}

// ── Proactive nudge logic ───────────────────────────────────────────────────
function getNudge(profile, streak, weakTopics, daysLeft, path) {
  if (daysLeft !== null && daysLeft <= 7) {
    return { text: `${daysLeft} days to your exam. Let's make every session count.`, expr: 'nervous', quick: ['Study plan', 'Mock exam'] }
  }
  if (streak === 0) {
    return { text: "Start a streak today! Even 10 minutes of practice makes a difference.", expr: 'happy', quick: ['Practice now', 'Flashcards'] }
  }
  if (streak >= 7) {
    return { text: `${streak} days in a row — you're on fire! Keep it going!`, expr: 'excited', quick: ['Keep going', 'View progress'] }
  }
  if (weakTopics?.length > 0) {
    const topic = weakTopics[0]
    return { text: `Your weakest area is ${topic.topic} in ${topic.subject}. Want to focus on it today?`, expr: 'thinking', quick: [`Practice ${topic.subject}`, 'Study plan'] }
  }
  if (path === '/mock') {
    return { text: "Good luck on your mock exam! Take your time and read each question carefully.", expr: 'happy', quick: ['Tips for mock exams'] }
  }
  if (path === '/practice') {
    return { text: "Great choice practising today! Consistency is everything.", expr: 'happy', quick: ['Random question', 'AI questions'] }
  }
  const name = profile?.full_name?.split(' ')[0] || 'there'
  return { text: `Hi ${name}! I'm Nova, your study assistant. Ask me anything about your subjects.`, expr: 'idle', quick: ['What should I study?', 'Explain a topic'] }
}

// ── Nova SVG character ──────────────────────────────────────────────────────
function NovaSVG({ expression, size = 72 }) {
  const expr = EXPRESSIONS[expression] || EXPRESSIONS.idle
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <radialGradient id="nvBodyG" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#2D1F54"/>
          <stop offset="100%" stopColor="#1A1030"/>
        </radialGradient>
        <radialGradient id="nvFaceG" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#3D2B6E"/>
          <stop offset="100%" stopColor="#251545"/>
        </radialGradient>
      </defs>

      {/* Glow */}
      <ellipse cx="80" cy="145" rx="44" ry="10" fill="var(--accent-primary)" opacity=".12"/>

      {/* Body */}
      <rect x="52" y="118" width="56" height="32" rx="14" fill="url(#nvBodyG)" stroke="var(--accent-primary)" strokeWidth=".8" strokeOpacity=".5"/>
      <rect x="71" y="112" width="18" height="14" rx="6" fill="url(#nvBodyG)"/>

      {/* Head */}
      <ellipse cx="80" cy="82" rx="44" ry="46" fill="#1E1035" stroke="var(--accent-primary)" strokeWidth=".8" strokeOpacity=".4"/>
      <ellipse cx="80" cy="82" rx="42" ry="44" fill="url(#nvFaceG)"/>

      {/* Ears */}
      <ellipse cx="37" cy="82" rx="6" ry="9" fill="#2D1F54" stroke="var(--accent-primary)" strokeWidth=".6" strokeOpacity=".4"/>
      <ellipse cx="37" cy="82" rx="3" ry="5" fill="var(--accent-primary)" opacity=".3"/>
      <ellipse cx="123" cy="82" rx="6" ry="9" fill="#2D1F54" stroke="var(--accent-primary)" strokeWidth=".6" strokeOpacity=".4"/>
      <ellipse cx="123" cy="82" rx="3" ry="5" fill="var(--accent-primary)" opacity=".3"/>

      {/* Hair */}
      <ellipse cx="80" cy="42" rx="38" ry="16" fill="#1A1030"/>
      <ellipse cx="80" cy="38" rx="34" ry="12" fill="#251545"/>
      <ellipse cx="68" cy="36" rx="10" ry="4" fill="var(--accent-primary)" opacity=".2"/>

      {/* Antenna */}
      <line x1="80" y1="38" x2="80" y2="18" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="80" cy="14" r="5" fill="var(--accent-primary)"/>
      <circle cx="80" cy="14" r="3" fill="var(--accent-light)"/>

      {/* Brows */}
      <path d={expr.browL} fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
      <path d={expr.browR} fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" opacity=".7"/>

      {/* Eyes */}
      <ellipse cx="63" cy="80" rx="12" ry="13" fill="#F0EDF8"/>
      <ellipse cx="97" cy="80" rx="12" ry="13" fill="#F0EDF8"/>
      <circle cx="63" cy={expr.irisY} r="8" fill="var(--accent-primary)"/>
      <circle cx="63" cy={expr.irisY} r="5" fill="#4C1D95"/>
      <circle cx="65" cy={expr.irisY - 2} r="2" fill="#fff" opacity=".9"/>
      <circle cx="97" cy={expr.irisY} r="8" fill="var(--accent-primary)"/>
      <circle cx="97" cy={expr.irisY} r="5" fill="#4C1D95"/>
      <circle cx="99" cy={expr.irisY - 2} r="2" fill="#fff" opacity=".9"/>

      {/* Blush */}
      <ellipse cx="53" cy="93" rx="9" ry="5" fill="#F43F5E" opacity={expr.blush}/>
      <ellipse cx="107" cy="93" rx="9" ry="5" fill="#F43F5E" opacity={expr.blush}/>

      {/* Nose */}
      <circle cx="77" cy="95" r="1.5" fill="var(--accent-primary)" opacity=".5"/>
      <circle cx="83" cy="95" r="1.5" fill="var(--accent-primary)" opacity=".5"/>

      {/* Mouth */}
      <path d={expr.mouth} fill="none" stroke="var(--accent-light)" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Stars */}
      {expr.stars > 0 && (
        <g>
          <circle cx="32" cy="52" r="3" fill="#FCD34D" opacity=".9"/>
          <circle cx="125" cy="45" r="2" fill="#FCD34D" opacity=".8"/>
          <circle cx="118" cy="60" r="1.5" fill="#FCD34D" opacity=".7"/>
        </g>
      )}

      {/* Sweat */}
      {expr.sweat > 0 && (
        <g>
          <ellipse cx="116" cy="58" rx="4" ry="6" fill="#93C5FD" opacity=".8"/>
          <polygon points="112,58 120,58 116,52" fill="#93C5FD" opacity=".8"/>
        </g>
      )}

      {/* Collar */}
      <path d="M60 122 L68 115 L80 118 L92 115 L100 122" fill="none" stroke="var(--accent-primary)" strokeWidth="1.2" strokeOpacity=".6" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Main Nova component ─────────────────────────────────────────────────────
export default function Nova() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [minimised, setMinimised] = useState(false)
  const [expression, setExpression] = useState('idle')
  const [nudge, setNudge] = useState(null)
  const [showNudge, setShowNudge] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [userCtx, setUserCtx] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const blinkRef = useRef(null)
  const bounceRef = useRef(null)
  const nudgeTimerRef = useRef(null)

  // Load user context for personalised responses
  useEffect(() => {
    loadContext()
  }, [])

  // Show nudge on route change
  useEffect(() => {
    if (minimised || open) return
    clearTimeout(nudgeTimerRef.current)
    nudgeTimerRef.current = setTimeout(() => {
      if (userCtx) showContextNudge()
    }, 2500)
    return () => clearTimeout(nudgeTimerRef.current)
  }, [location.pathname, userCtx])

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Blink animation
  useEffect(() => {
    const blink = () => setExpression(e => {
      setTimeout(() => setExpression(e), 200)
      return e + '_blink'
    })
    blinkRef.current = setInterval(blink, 3000 + Math.random() * 2000)
    return () => clearInterval(blinkRef.current)
  }, [])

  async function loadContext() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
      const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', user.id).single()
      const { data: exams } = await supabase.from('mock_exams').select('id').eq('user_id', user.id).not('submitted_at', 'is', null).order('submitted_at', { ascending: false }).limit(3)

      let weakTopics = []
      if (exams?.length) {
        const { data: responses } = await supabase
          .from('mock_responses').select('*, questions(topics(name), subjects(name))')
          .in('exam_id', exams.map(e => e.id))
        const topicMap = {}
        responses?.forEach(r => {
          const key = `${r.questions?.subjects?.name}|||${r.questions?.topics?.name}`
          if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0, subject: r.questions?.subjects?.name, topic: r.questions?.topics?.name }
          topicMap[key].total++
          if (r.is_correct) topicMap[key].correct++
        })
        weakTopics = Object.values(topicMap)
          .map(t => ({ ...t, score: Math.round((t.correct / t.total) * 100) }))
          .filter(t => t.score < 70 && t.total >= 2)
          .sort((a, b) => a.score - b.score)
          .slice(0, 3)
      }

      const daysLeft = profile?.exam_date
        ? Math.max(0, Math.ceil((new Date(profile.exam_date) - new Date()) / 86400000))
        : null

      const ctx = { profile, streak: streakData?.current_streak || 0, weakTopics, daysLeft }
      setUserCtx(ctx)
    } catch { /* non-critical */ }
  }

  function showContextNudge() {
    if (!userCtx) return
    const n = getNudge(userCtx.profile, userCtx.streak, userCtx.weakTopics, userCtx.daysLeft, location.pathname)
    setNudge(n)
    setExpression(n.expr)
    setShowNudge(true)
    setTimeout(() => setShowNudge(false), 6000)
  }

  function buildSystemPrompt() {
    if (!userCtx) return 'You are Nova, a helpful WASSCE/BECE study assistant for Ghanaian students.'
    const { profile, streak, weakTopics, daysLeft } = userCtx
    const name = profile?.full_name?.split(' ')[0] || 'the student'
    const weak = weakTopics?.map(t => `${t.topic} (${t.score}%)`).join(', ') || 'none identified yet'
    return `You are Nova, an AI study assistant for PrepIQ, a Ghanaian exam prep app.

Student profile:
- Name: ${name}
- Exam: ${profile?.exam_type || 'WASSCE'}
- Days until exam: ${daysLeft ?? 'unknown'}
- Current streak: ${streak} days
- Weak topics: ${weak}

Your role:
- Help with subject questions — explain concepts clearly for a Ghanaian secondary school student
- Give study advice based on their weak topics and days remaining
- Be warm, encouraging and concise — never condescending
- When explaining maths or science, show step-by-step working
- Keep responses short enough for a chat interface — 3-5 sentences max unless explaining a concept
- If asked about topics not related to studying, gently redirect to their exam preparation`
  }

  function getMessageCount() {
    const key = `nova-msgs-${new Date().toDateString()}`
    return parseInt(localStorage.getItem(key) || '0')
  }
  function incrementMessageCount() {
    const key = `nova-msgs-${new Date().toDateString()}`
    localStorage.setItem(key, getMessageCount() + 1)
  }

  const FREE_LIMIT = 5
  const isPremium = userCtx?.profile?.plan === 'premium'

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg) return

    // Check free tier limit
    if (!isPremium && getMessageCount() >= FREE_LIMIT) {
      setMessages(prev => [...prev, {
        role: 'nova',
        content: `You've used your ${FREE_LIMIT} free messages today. Upgrade to Premium for unlimited Nova AI access. 💎`
      }])
      setExpression('sad')
      return
    }

    incrementMessageCount()
    setInput('')
    setThinking(true)
    setExpression('thinking')

    const newMessages = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)

    try {
      const history = newMessages.map(m => `${m.role === 'user' ? 'Student' : 'Nova'}: ${m.content}`).join('\n')
      const { text: reply } = await gemini(
        `${history}\nNova:`,
        buildSystemPrompt()
      )
      setMessages(prev => [...prev, { role: 'nova', content: reply }])
      setExpression('happy')
      setTimeout(() => setExpression('idle'), 2000)
    } catch (err) {
      const msg = err?.message || ''
      let userMsg = "Sorry, I couldn't connect right now. Try again in a moment."
      if (msg.includes('quota') || msg.includes('429')) userMsg = "I've hit my AI quota limit. Please wait a minute and try again."
      if (msg.includes('API key') || msg.includes('400')) userMsg = "There's an issue with the AI configuration. Please contact support."
      if (msg.includes('model') || msg.includes('404')) userMsg = "AI model unavailable. Please try again shortly."
      setMessages(prev => [...prev, { role: 'nova', content: userMsg }])
      setExpression('sad')
      setTimeout(() => setExpression('idle'), 2000)
    }
    setThinking(false)
  }

  function handleQuickReply(text) {
    setOpen(true)
    setShowNudge(false)
    setTimeout(() => sendMessage(text), 100)
  }

  function openChat() {
    setOpen(true)
    setShowNudge(false)
    setExpression('happy')
    if (messages.length === 0 && userCtx) {
      const n = getNudge(userCtx.profile, userCtx.streak, userCtx.weakTopics, userCtx.daysLeft, location.pathname)
      setMessages([{ role: 'nova', content: n.text }])
    }
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  if (minimised) return (
    <button style={s.miniFab} onClick={() => setMinimised(false)} title="Open Nova">
      <NovaSVG expression="idle" size={36} />
    </button>
  )

  return (
    <div style={s.wrap}>

      {/* Nudge bubble */}
      {showNudge && nudge && !open && (
        <div style={s.nudgeBubble}>
          <p style={s.nudgeText}>{nudge.text}</p>
          <div style={s.quickRow}>
            {nudge.quick?.map(q => (
              <button key={q} style={s.quickBtn} onClick={() => handleQuickReply(q)}>{q}</button>
            ))}
          </div>
          <button style={s.nudgeClose} onClick={() => setShowNudge(false)}>✕</button>
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div style={s.chatPanel}>
          {/* Chat header */}
          <div style={s.chatHeader}>
            <NovaSVG expression={expression} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.chatName}>Nova</div>
              <div style={s.chatSub}>Your study assistant</div>
            </div>
            <button style={s.iconBtn} onClick={() => setMinimised(true)} title="Minimise">−</button>
            <button style={s.iconBtn} onClick={() => setOpen(false)} title="Close">✕</button>
          </div>

          {/* Messages */}
          <div style={s.messages}>
            {messages.length === 0 && (
              <div style={s.emptyChat}>
                <NovaSVG expression="happy" size={56} />
                <p style={s.emptyChatText}>Hi! Ask me anything about your subjects, exam tips, or study strategies.</p>
                <div style={s.suggestionGrid}>
                  {['What should I study today?', 'Explain quadratic equations', 'Tips for the mock exam', 'How do I improve my streak?'].map(q => (
                    <button key={q} style={s.suggestionBtn} onClick={() => sendMessage(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ ...s.msgRow, ...(msg.role === 'user' ? s.msgRowUser : {}) }}>
                {msg.role === 'nova' && <NovaSVG expression={i === messages.length - 1 ? expression : 'idle'} size={28} />}
                <div style={{ ...s.bubble, ...(msg.role === 'user' ? s.bubbleUser : s.bubbleNova) }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {thinking && (
              <div style={s.msgRow}>
                <NovaSVG expression="thinking" size={28} />
                <div style={{ ...s.bubble, ...s.bubbleNova, ...s.thinkingBubble }}>
                  <span style={s.thinkDot} />
                  <span style={{ ...s.thinkDot, animationDelay: '.18s' }} />
                  <span style={{ ...s.thinkDot, animationDelay: '.36s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={s.inputRow}>
            <input
              ref={inputRef}
              style={s.chatInput}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask Nova anything..."
            />
            <button style={{ ...s.sendBtn, opacity: input.trim() ? 1 : .4 }}
              onClick={() => sendMessage()} disabled={!input.trim() || thinking}>
              →
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      {!open && (
        <div style={s.fabWrap}>
          <button style={s.minBtn} onClick={() => setMinimised(true)} title="Minimise">−</button>
          <button style={s.fab} onClick={openChat}>
            <NovaSVG expression={showNudge ? (nudge?.expr || 'idle') : expression} size={44} />
            <span style={s.fabLabel}>Nova</span>
          </button>
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { position: 'fixed', bottom: '20px', right: '16px', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' },

  // Mini (minimised)
  miniFab: { width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface-solid)', border: '1px solid var(--border-mid)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,.4)', padding: 0 },

  // Nudge bubble
  nudgeBubble: { background: 'var(--surface-solid)', border: '1px solid var(--accent-border)', borderRadius: '16px 16px 4px 16px', padding: '14px 36px 14px 16px', maxWidth: '240px', boxShadow: '0 8px 32px rgba(0,0,0,.5)', position: 'relative', animation: 'popIn .3s cubic-bezier(0.34,1.56,0.64,1)' },
  nudgeText: { fontSize: '.82rem', color: 'var(--ink)', lineHeight: 1.5, marginBottom: '10px' },
  quickRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  quickBtn: { padding: '5px 10px', borderRadius: '20px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent-light)', fontSize: '.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--ff)' },
  nudgeClose: { position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '.8rem', lineHeight: 1, padding: '2px' },

  // Chat panel
  chatPanel: { width: '320px', height: '480px', background: 'var(--surface-solid)', border: '1px solid var(--border-mid)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,.6)', animation: 'popIn .3s cubic-bezier(0.34,1.56,0.64,1)' },
  chatHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--accent-soft)', borderBottom: '1px solid var(--accent-border)', flexShrink: 0 },
  chatName: { fontSize: '.9rem', fontWeight: '700', color: 'var(--accent-light)', letterSpacing: '-.01em' },
  chatSub: { fontSize: '.68rem', color: 'var(--ink-faint)' },
  iconBtn: { background: 'transparent', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '1rem', padding: '4px', lineHeight: 1, flexShrink: 0 },

  // Messages
  messages: { flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '10px' },
  emptyChat: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 0' },
  emptyChatText: { fontSize: '.82rem', color: 'var(--ink-muted)', lineHeight: 1.5, margin: '10px 0 14px' },
  suggestionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', width: '100%' },
  suggestionBtn: { padding: '7px 8px', background: 'var(--glass-bg)', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink-muted)', fontSize: '.72rem', cursor: 'pointer', fontFamily: 'var(--ff)', textAlign: 'left', lineHeight: 1.3 },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: '7px' },
  msgRowUser: { flexDirection: 'row-reverse' },
  bubble: { maxWidth: '200px', padding: '9px 12px', borderRadius: '14px', fontSize: '.82rem', lineHeight: 1.5 },
  bubbleNova: { background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--ink)', borderBottomLeftRadius: '4px' },
  bubbleUser: { background: 'var(--accent-primary)', color: '#fff', borderBottomRightRadius: '4px' },
  thinkingBubble: { display: 'flex', gap: '4px', alignItems: 'center', padding: '12px 14px' },
  thinkDot: { display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse .9s infinite' },

  // Input
  inputRow: { display: 'flex', gap: '8px', padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 },
  chatInput: { flex: 1, padding: '9px 12px', background: 'var(--glass-bg)', border: '1px solid var(--border-mid)', borderRadius: '20px', color: 'var(--ink)', fontSize: '.84rem', outline: 'none', fontFamily: 'var(--ff)' },
  sendBtn: { width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-primary)', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--ff)', transition: 'opacity .15s' },

  // FAB
  fabWrap: { display: 'flex', alignItems: 'center', gap: '6px' },
  minBtn: { width: '22px', height: '22px', borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '8px 12px', background: 'var(--surface-solid)', border: '1px solid var(--border-mid)', borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,.4)', transition: 'transform .2s cubic-bezier(0.34,1.56,0.64,1)' },
  fabLabel: { fontSize: '.68rem', fontWeight: '700', color: 'var(--accent-light)', letterSpacing: '.04em' },
}