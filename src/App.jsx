import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import SignUp from './screens/SignUp'
import Login from './screens/Login'
import Onboarding from './screens/Onboarding'
import Dashboard from './screens/Dashboard'
import Practice from './screens/Practice'
import Question from './screens/Question'
import MockSetup from './screens/MockSetup'
import MockExam from './screens/MockExam'
import MockResults from './screens/MockResults'
import Performance from './screens/Performance'

function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  if (session === undefined) return (
    <div style={{ background:'#0D1117', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#F0A500', fontFamily:'Georgia, serif', fontSize:'2rem' }}>PrepIQ</div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={session ? "/dashboard" : "/signup"} />} />
        <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/onboarding" element={session ? <Onboarding /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/practice" element={session ? <Practice /> : <Navigate to="/login" />} />
        <Route path="/question/:id" element={session ? <Question /> : <Navigate to="/login" />} />
        <Route path="/mock" element={session ? <MockSetup /> : <Navigate to="/login" />} />
        <Route path="/mock/:id" element={session ? <MockExam /> : <Navigate to="/login" />} />
        <Route path="/mock/:id/results" element={session ? <MockResults /> : <Navigate to="/login" />} /> 
        <Route path="/performance" element={session ? <Performance /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App