import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { ThemeProvider } from './context/ThemeContext'
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

// Context for mobile menu — avoids prop drilling into every screen
import { createContext, useContext } from 'react'
export const MobileMenuContext = createContext({ open: false, setOpen: () => {} })
export const useMobileMenu = () => useContext(MobileMenuContext)

function AppRoutes() {
  const [session, setSession] = useState(undefined)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  if (session === undefined) return (
    <div style={{ background: 'var(--forest)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--ff-serif)', fontSize: '2rem', fontWeight: '700', color: '#F7F3EE' }}>
        Prep<em style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>IQ</em>
      </div>
    </div>
  )

  return (
    <MobileMenuContext.Provider value={{ open: mobileMenuOpen, setOpen: setMobileMenuOpen }}>
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
    </MobileMenuContext.Provider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}