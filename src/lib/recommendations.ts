import type { Tool } from '../types/tool'
import { formatEuro } from './format'
import { costPerUser, isLive } from './tools'

export type RecommendationKind = 'unused' | 'expiring' | 'overlap' | 'cost'

export type RecommendationAction =
  | { type: 'archive'; toolId: number }
  | { type: 'view'; toolId: number }
  | { type: 'filter-category'; category: string }

export interface Recommendation {
  id: string
  kind: RecommendationKind
  title: string
  detail: string
  actionLabel: string
  action: RecommendationAction
}

const OVERLAP_THRESHOLD = 3
const COST_OUTLIER_FACTOR = 3

export const potentialSavings = (tools: Tool[]) =>
  tools.filter((t) => t.status === 'unused').reduce((sum, t) => sum + t.monthlyCost, 0)

export function buildRecommendations(tools: Tool[], limit = 4): Recommendation[] {
  const live = tools.filter(isLive)
  const byCostDesc = (a: Tool, b: Tool) => b.monthlyCost - a.monthlyCost
  const picks: Recommendation[] = []

  const unused = live.filter((t) => t.status === 'unused').sort(byCostDesc)[0]
  if (unused) {
    picks.push({
      id: `unused-${unused.id}`,
      kind: 'unused',
      title: `${unused.name} looks unused`,
      detail: `${unused.users} users · archiving saves ${formatEuro(unused.monthlyCost)}/month`,
      actionLabel: 'Archive',
      action: { type: 'archive', toolId: unused.id },
    })
  }

  const expiring = live.filter((t) => t.status === 'expiring').sort(byCostDesc)[0]
  if (expiring) {
    picks.push({
      id: `expiring-${expiring.id}`,
      kind: 'expiring',
      title: `${expiring.name} is about to expire`,
      detail: `${expiring.department} · ${formatEuro(expiring.monthlyCost)}/month to renew or cancel`,
      actionLabel: 'Review',
      action: { type: 'view', toolId: expiring.id },
    })
  }

  const counts = new Map<string, Tool[]>()
  for (const tool of live) counts.set(tool.category, [...(counts.get(tool.category) ?? []), tool])
  const crowded = [...counts.entries()].filter(([, group]) => group.length >= OVERLAP_THRESHOLD).sort((a, b) => b[1].length - a[1].length)[0]
  if (crowded) {
    const [category, group] = crowded
    picks.push({
      id: `overlap-${category}`,
      kind: 'overlap',
      title: `${group.length} tools overlap in ${category}`,
      detail: `${group.slice(0, 3).map((t) => t.name).join(', ')}${group.length > 3 ? '…' : ''} · consider consolidating`,
      actionLabel: 'Compare',
      action: { type: 'filter-category', category },
    })
  }

  const withUsers = live.filter((t) => t.users > 0)
  const totalUsers = withUsers.reduce((sum, t) => sum + t.users, 0)
  const average = totalUsers ? withUsers.reduce((sum, t) => sum + t.monthlyCost, 0) / totalUsers : 0
  const outlier = [...withUsers].sort((a, b) => costPerUser(b) - costPerUser(a))[0]
  if (outlier && average > 0 && costPerUser(outlier) >= average * COST_OUTLIER_FACTOR) {
    picks.push({
      id: `cost-${outlier.id}`,
      kind: 'cost',
      title: `${outlier.name} costs ${formatEuro(Math.round(costPerUser(outlier)))} per user`,
      detail: `${(costPerUser(outlier) / average).toFixed(1)}× the company average · worth a licence review`,
      actionLabel: 'View',
      action: { type: 'view', toolId: outlier.id },
    })
  }

  return picks.slice(0, limit)
}
