import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from '../services/dashboard'

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboard,
    retry: false, // l'utilisateur relance lui-même via le bouton "Try again"
    staleTime: 60_000,
  })
}
