import '@testing-library/jest-dom/vitest'
import { resetToolsDb } from '../services/toolsRepository'

beforeEach(() => {
  vi.stubEnv('VITE_MOCK_DELAY', '0')
})

afterEach(() => {
  resetToolsDb()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/')
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})
