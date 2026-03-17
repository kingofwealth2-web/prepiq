import Onboarding from './screens/Onboarding'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import SignUp from './screens/SignUp'
import Login from './screens/Login'

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
        <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={<Navigate to={session ? "/dashboard" : "/signup"} />} />
        <Route path="/dashboard" element={session ? <div style={{color:'#F0F6FC',background:'#0D1117',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',fontFamily:'Georgia,serif'}}>Dashboard coming soon</div> : <Navigate to="/login" />} />
        <Route path="/onboarding" element={session ? <Onboarding /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App