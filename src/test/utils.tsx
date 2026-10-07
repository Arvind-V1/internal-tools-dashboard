import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../components/ThemeProvider'
import type { Tool } from '../types/tool'
import LocationProbe from './LocationProbe'

export function renderWithProviders(ui: ReactElement, route = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>
          {ui}
          <LocationProbe />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

export function makeTools(count: number): Tool[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Tool ${String(i + 1).padStart(2, '0')}`,
    icon: '🧩',
    department: i % 2 ? 'Sales' : 'Engineering',
    users: (i + 1) * 10,
    monthlyCost: (count - i) * 100,
    status: (['active', 'expiring', 'unused'] as const)[i % 3],
  }))
}
