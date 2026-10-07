import '@testing-library/jest-dom/vitest'

beforeEach(() => {
  vi.stubEnv('VITE_MOCK_DELAY', '0')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/')
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})
