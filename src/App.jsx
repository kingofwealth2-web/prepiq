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
import ExamReview from './screens/ExamReview'
import Performance from './screens/Performance'
import StudyPlan from './screens/StudyPlan'
import Flashcards from './screens/Flashcards'
import QuizGame from './screens/QuizGame'
import Predictions from './screens/Predictions'
import Profile from './screens/Profile'
import Ama from './components/Ama'

function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  if (session === undefined) return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: '700', color: '#F0F6FC' }}>
        Prep<span style={{ color: '#F0A500' }}>IQ</span>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      {session && <Ama />}
      <Routes>
        <Route path="/" element={<Navigate to={session ? '/dashboard' : '/signup'} />} />
        <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/onboarding" element={session ? <Onboarding /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/practice" element={session ? <Practice /> : <Navigate to="/login" />} />
        <Route path="/question/:id" element={session ? <Question /> : <Navigate to="/login" />} />
        <Route path="/mock" element={session ? <MockSetup /> : <Navigate to="/login" />} />
        <Route path="/mock/:id" element={session ? <MockExam /> : <Navigate to="/login" />} />
        <Route path="/mock/:id/results" element={session ? <MockResults /> : <Navigate to="/login" />} />
        <Route path="/mock/:id/review" element={session ? <ExamReview /> : <Navigate to="/login" />} />
        <Route path="/performance" element={session ? <Performance /> : <Navigate to="/login" />} />
        <Route path="/plan" element={session ? <StudyPlan /> : <Navigate to="/login" />} />
        <Route path="/flashcards" element={session ? <Flashcards /> : <Navigate to="/login" />} />
        <Route path="/game" element={session ? <QuizGame /> : <Navigate to="/login" />} />
        <Route path="/predictions" element={session ? <Predictions /> : <Navigate to="/login" />} />
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/premium" element={session ? <Navigate to="/profile" /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App