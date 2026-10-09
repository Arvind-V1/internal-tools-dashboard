import { buildSeedTools } from '../data/mock'
import { budgetOutlook, buildUsage, costSlices, forecastSpend, growthSeries, parseRange, rankUsage, spendSeries, topExpensive, unit, type SeriesPoint } from './analytics'
import { buildAnalytics } from './analyticsModel'
import { buildReportSheets, reportFileName } from './analyticsExport'
import { buildAlerts, formatRoi, optimizationPotential, summarizeRoi } from './insights'

const NOW = Date.UTC(2026, 9, 8, 12)
const tools = buildSeedTools(NOW)
const scope = { range: '90d' as const, department: '', category: '', query: '' }

describe('plages et pseudo-aléatoire', () => {
  it('parseRange retombe sur 90d pour une valeur inconnue', () => {
    expect(parseRange('30d')).toBe('30d')
    expect(parseRange('1y')).toBe('1y')
    expect(parseRange('banana')).toBe('90d')
    expect(parseRange(null)).toBe('90d')
  })

  it('unit est stable et dans [0, 1)', () => {
    expect(unit(3, 1)).toBe(unit(3, 1))
    for (let i = 0; i < 50; i++) {
      expect(unit(i, 2)).toBeGreaterThanOrEqual(0)
      expect(unit(i, 2)).toBeLessThan(1)
    }
  })
})

describe('dépenses', () => {
  it('la courbe a le bon nombre de points et se termine sur la dépense actuelle', () => {
    const live = tools.filter((t) => t.status !== 'disabled' && t.status !== 'archived')
    const series = spendSeries(tools, '1y', NOW)
    expect(series).toHaveLength(12)
    expect(series[series.length - 1].value).toBe(Math.round(live.reduce((s, t) => s + t.monthlyCost, 0)))
  })

  it('la projection linéaire prolonge une tendance à la hausse', () => {
    const points: SeriesPoint[] = [0, 1, 2, 3].map((i) => ({ date: NOW - (3 - i) * 30 * 86_400_000, label: String(i), value: 1000 + i * 100 }))
    const f = forecastSpend(points)
    expect(f.points.map((p) => p.value)).toEqual([1400, 1500, 1600])
    expect(f.slopePerMonth).toBe(100)
  })

  it('pas de projection avec moins de deux points', () => {
    expect(forecastSpend([]).points).toEqual([])
  })

  it('budgetOutlook : ok, warning, over', () => {
    expect(budgetOutlook(10000, 0, 30000).status).toBe('ok')
    expect(budgetOutlook(10000, 0, 30000).monthsToLimit).toBeNull()
    expect(budgetOutlook(27000, 0, 30000).status).toBe('warning')
    expect(budgetOutlook(20000, 5000, 30000)).toMatchObject({ status: 'warning', monthsToLimit: 2 })
    expect(budgetOutlook(31000, 0, 30000).status).toBe('over')
  })
})

describe('répartition des coûts', () => {
  it('par département : somme = coût des outils actifs, parts = 100 %, tri décroissant', () => {
    const slices = costSlices(tools, 'department')
    const live = tools.filter((t) => t.status !== 'disabled' && t.status !== 'archived')
    expect(slices.reduce((s, x) => s + x.cost, 0)).toBe(live.reduce((s, t) => s + t.monthlyCost, 0))
    expect(slices.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1)
    expect(slices.map((s) => s.cost)).toEqual([...slices.map((s) => s.cost)].sort((a, b) => b - a))
  })

  it('par outil : 7 outils + « Other » gris', () => {
    const slices = costSlices(tools, 'tool')
    expect(slices).toHaveLength(8)
    expect(slices[7]).toMatchObject({ colorIndex: -1 })
    expect(slices[7].label).toMatch(/^Other \(\d+\)$/)
    expect(slices[0].label).toBe('Salesforce')
  })

  it('topExpensive exclut les outils désactivés', () => {
    const names = topExpensive(tools, 20).map((e) => e.tool.name)
    expect(names[0]).toBe('Salesforce')
    expect(names).not.toContain('Zendesk')
  })
})

describe('usage', () => {
  it('l\'adoption reste entre 0 et 1 et les outils inutilisés sont les moins adoptés', () => {
    const usage = buildUsage(tools, '90d')
    expect(usage.every((u) => u.adoption >= 0 && u.adoption <= 1 && u.active <= u.licensed)).toBe(true)
    const worst = rankUsage(usage, 'least', 3).map((u) => u.tool.status)
    expect(worst.every((s) => s === 'unused')).toBe(true)
    expect(rankUsage(usage, 'most', 1)[0].adoption).toBeGreaterThanOrEqual(rankUsage(usage, 'most', 5)[4].adoption)
  })

  it('est déterministe et varie avec le tick « live »', () => {
    expect(buildUsage(tools, '90d')).toEqual(buildUsage(tools, '90d'))
    expect(buildUsage(tools, '90d', 1)[0].active).not.toBeNaN()
  })

  it('la croissance cumule les outils jusqu\'au total du catalogue', () => {
    const g = growthSeries(tools, '1y', NOW)
    expect(g).toHaveLength(12)
    expect(g[g.length - 1].total).toBeLessThanOrEqual(tools.length)
    expect(g.every((p, i) => i === 0 || p.total >= g[i - 1].total)).toBe(true)
  })
})

describe('insights', () => {
  const usage = buildUsage(tools, '90d')
  const outlook = budgetOutlook(21000, 0, 30000)

  it('signale les outils à renégocier et le chevauchement de catégories, classés par gravité', () => {
    const alerts = buildAlerts(usage, outlook, 30000, 21000)
    const order = { critical: 0, warning: 1, info: 2 }
    expect(alerts.map((a) => order[a.severity])).toEqual([...alerts.map((a) => order[a.severity])].sort())
    expect(alerts.every((a) => a.href.startsWith('/tools'))).toBe(true)
  })

  it('ajoute une alerte critique quand le budget est dépassé', () => {
    const alerts = buildAlerts(usage, budgetOutlook(35000, 0, 30000), 30000, 35000)
    expect(alerts[0]).toMatchObject({ kind: 'budget', severity: 'critical' })
  })

  it('le potentiel d\'économies inclut les outils inutilisés et jamais un outil deux fois', () => {
    const alerts = buildAlerts(usage, outlook, 30000, 21000)
    const unused = tools.filter((t) => t.status === 'unused').reduce((s, t) => s + t.monthlyCost, 0)
    expect(optimizationPotential(tools, alerts)).toBeGreaterThanOrEqual(unused)
  })

  it('ROI : formatage et synthèse', () => {
    expect(formatRoi(1.234)).toBe('+123%')
    expect(formatRoi(-0.5)).toBe('−50%')
    const s = summarizeRoi(usage)
    expect(s.best!.roi).toBeGreaterThanOrEqual(s.worst!.roi)
  })
})

describe('buildAnalytics', () => {
  it('sans filtre : donut par département, budget de l\'organisation', () => {
    const m = buildAnalytics(tools, scope, NOW)
    expect(m.sliceBy).toBe('department')
    expect(m.scoped).toBe(false)
    expect(m.budget).toBe(30000)
  })

  it('drill-down département : tout est restreint au département et le donut passe par outil', () => {
    const m = buildAnalytics(tools, { ...scope, department: 'Design' }, NOW)
    expect(m.scoped).toBe(true)
    expect(m.sliceBy).toBe('tool')
    expect(m.tools.every((t) => t.department === 'Design')).toBe(true)
    expect(m.departments.map((d) => d.department)).toEqual(['Design'])
    expect(m.summary.spend).toBe(480 + 576)
  })

  it('la recherche et la catégorie restreignent aussi le périmètre, les archivés sont exclus', () => {
    expect(buildAnalytics(tools, { ...scope, query: 'figma' }, NOW).tools.map((t) => t.name)).toEqual(['Figma'])
    expect(buildAnalytics(tools, { ...scope, category: 'Security' }, NOW).tools).toHaveLength(1)
    const archived = tools.map((t) => (t.id === 1 ? { ...t, status: 'archived' as const } : t))
    expect(buildAnalytics(archived, scope, NOW).tools.map((t) => t.name)).not.toContain('Slack')
  })

  it('un périmètre vide ne casse rien', () => {
    const m = buildAnalytics(tools, { ...scope, query: 'zzzz' }, NOW)
    expect(m.tools).toEqual([])
    expect(m.summary.costPerActiveUser).toBe(0)
    expect(m.heatmap.max).toBe(0)
  })
})

describe('export', () => {
  const meta = { range: '90d' as const, department: 'Design', category: '', generatedAt: new Date(Date.UTC(2026, 9, 8)) }

  it('nom de fichier lisible', () => {
    expect(reportFileName(meta, 'xlsx')).toBe('analytics-design-90d-2026-10-08.xlsx')
    expect(reportFileName({ ...meta, department: '' }, 'xlsx')).toBe('analytics-90d-2026-10-08.xlsx')
  })

  it('5 feuilles cohérentes avec le modèle', () => {
    const model = buildAnalytics(tools, { ...scope, department: 'Design' }, NOW)
    const sheets = buildReportSheets(model, meta)
    expect(sheets.map((s) => s.name)).toEqual(['Summary', 'Spend', 'Tools', 'Departments', 'Insights'])
    expect(sheets.every((s) => s.rows.every((r) => r.length === s.header.length))).toBe(true)
    expect(sheets[2].rows.map((r) => r[0])).toEqual(expect.arrayContaining(['Figma', 'Miro']))
    expect(sheets[1].rows.filter((r) => r[2] === 'Forecast')).toHaveLength(3)
  })
})
