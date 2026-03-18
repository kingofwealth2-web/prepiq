import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({ isDark: true, toggle: () => {} })

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('prepiq-theme') !== 'light' } catch { return true }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    try { localStorage.setItem('prepiq-theme', isDark ? 'dark' : 'light') } catch {}
  }, [isDark])

  const toggle = () => setIsDark(d => !d)

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)