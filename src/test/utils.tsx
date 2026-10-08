import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../components/ThemeProvider'
import { ToastProvider } from '../components/ui/ToastProvider'
import type { Tool } from '../types/tool'
import LocationProbe from './LocationProbe'

export function renderWithProviders(ui: ReactElement, route = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            {ui}
            <LocationProbe />
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

export function makeTools(count: number): Tool[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Tool ${String(i + 1).padStart(2, '0')}`,
    icon: '🧩',
    description: `Description of tool ${i + 1}`,
    vendor: `Vendor ${i + 1}`,
    category: i % 2 ? 'Design' : 'Development',
    department: i % 2 ? 'Sales' : 'Engineering',
    users: (i + 1) * 10,
    monthlyCost: (count - i) * 100,
    status: (['active', 'expiring', 'unused'] as const)[i % 3],
    websiteUrl: `https://tool${i + 1}.example.com`,
    lastUpdate: new Date(Date.UTC(2026, 9, 1) - i * 86_400_000).toISOString(),
  }))
}
