import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ToolUsage } from '../../lib/analytics'
import type { AnalyticsModel } from '../../lib/analyticsModel'
import { formatEuro } from '../../lib/format'
import { BarList } from '../charts/BarList'
import { GrowthChart } from '../charts/GrowthChart'
import { Heatmap } from '../charts/Heatmap'
import { Sparkline } from '../charts/Sparkline'
import { DEPARTMENTS } from '../../lib/constants'
import { StatusBadge } from '../ui/StatusBadge'
import { ChartCard } from './ChartCard'

const pct = (v: number) => `${Math.round(v * 100)}%`

function Trend({ value }: { value: number }) {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  const color = value > 0 ? 'text-emerald-500' : value < 0 ? 'text-red-500' : 'text-fg-subtle'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`} aria-label={`${value > 0 ? 'Up' : value < 0 ? 'Down' : 'No change'} ${Math.abs(value)} points`}>
      <Icon size={14} aria-hidden="true" />
      {Math.abs(value)} pts
    </span>
  )
}

const toneOf = (u: ToolUsage) => (u.trend > 0 ? 'good' : u.trend < 0 ? 'bad' : 'brand')

function AdoptionTable({ usage }: { usage: ToolUsage[] }) {
  const [expanded, setExpanded] = useState(false)
  const sorted = [...usage].sort((a, b) => b.adoption - a.adoption || a.tool.name.localeCompare(b.tool.name))
  const rows = expanded ? sorted : sorted.slice(0, 8)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <caption className="sr-only">User adoption by tool</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs text-fg-subtle">
              <th scope="col" className="py-2 pr-3 font-medium">Tool</th>
              <th scope="col" className="px-3 py-2 font-medium">Adoption</th>
              <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">Active / licences</th>
              <th scope="col" className="px-3 py-2 font-medium">Trend</th>
              <th scope="col" className="py-2 pl-3 text-right font-medium">Activity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.tool.id} className="border-b border-line-soft last:border-0">
                <td className="py-2.5 pr-3">
                  <Link to={`/tools?view=${u.tool.id}`} className="flex items-center gap-2 font-medium hover:underline">
                    <span aria-hidden="true">{u.tool.icon}</span>
                    <span className="truncate">{u.tool.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-fg/[0.08] sm:w-24" aria-hidden="true">
                      <div className="h-full rounded-full bg-linear-to-r from-blue-500 to-violet-600" style={{ width: pct(u.adoption) }} />
                    </div>
                    <span className="w-10 font-semibold">{pct(u.adoption)}</span>
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 text-fg-muted sm:table-cell">{u.active} / {u.licensed}</td>
                <td className="px-3 py-2.5"><Trend value={u.trend} /></td>
                <td className="py-2.5 pl-3"><div className="flex justify-end"><Sparkline values={u.history} tone={toneOf(u)} label={`${u.tool.name} active users over the period`} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > 8 && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-3 text-sm font-medium text-violet-500 hover:underline">
          {expanded ? 'Show fewer tools' : `Show all ${sorted.length} tools`}
        </button>
      )}
    </>
  )
}

function Ranking({ title, items, id }: { title: string; items: ToolUsage[]; id: string }) {
  return (
    <ChartCard id={id} title={title}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">Nothing to rank yet.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((u, i) => (
            <li key={u.tool.id} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-fg/[0.07] text-xs font-semibold text-fg-muted">{i + 1}</span>
              <Link to={`/tools?view=${u.tool.id}`} className="min-w-0 flex-1 hover:underline">
                <span className="block truncate text-sm font-medium"><span aria-hidden="true">{u.tool.icon} </span>{u.tool.name}</span>
                <span className="block text-xs text-fg-subtle">{u.active} of {u.licensed} users</span>
              </Link>
              <Sparkline values={u.history} tone={toneOf(u)} label={`${u.tool.name} trend`} width={72} />
              <span className="w-10 text-right text-sm font-semibold">{pct(u.adoption)}</span>
            </li>
          ))}
        </ol>
      )}
    </ChartCard>
  )
}

interface UsageAnalyticsProps {
  model: AnalyticsModel
  department: string
  onDrill: (department: string) => void
  dimmed?: boolean
}

export function UsageAnalytics({ model, department, onDrill, dimmed }: UsageAnalyticsProps) {
  const { usage, departments, growth, recent } = model

  return (
    <div className={`grid gap-6 transition-opacity lg:grid-cols-2 ${dimmed ? 'opacity-60' : ''}`}>
      <ChartCard id="adoption-title" title="User Adoption Rates" subtitle="Active users per licence, with the trend over the selected range" className="lg:col-span-2">
        {usage.length === 0 ? <p className="py-6 text-center text-sm text-fg-muted">No active tools for this selection.</p> : <AdoptionTable usage={usage} />}
      </ChartCard>

      <Ranking id="most-title" title="Most Used Tools" items={model.mostUsed} />
      <Ranking id="least-title" title="Least Used Tools" items={model.leastUsed} />

      <ChartCard id="activity-title" title="Department Activity" subtitle={department ? `Showing ${department}. Select it again to reset` : 'Adoption by department · select one to drill down'}>
        {departments.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">No activity to compare.</p>
        ) : (
          <BarList
            label="Adoption by department"
            items={departments.map((d) => ({
              key: d.department,
              label: d.department,
              value: d.adoption,
              valueLabel: pct(d.adoption),
              hint: `${d.active}/${d.licensed} users · ${formatEuro(d.cost)}`,
              colorIndex: Math.max(0, DEPARTMENTS.indexOf(d.department as (typeof DEPARTMENTS)[number])),
              onSelect: () => onDrill(department === d.department ? '' : d.department),
              selected: department ? department === d.department : undefined,
            }))}
          />
        )}
      </ChartCard>

      <ChartCard id="growth-title" title="Growth Trends" subtitle="New tools added per period">
        <GrowthChart points={growth} />
        {recent.length > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 text-xs text-fg-subtle">Recently added</p>
            <ul className="flex flex-wrap gap-2">
              {recent.map((t) => (
                <li key={t.id}>
                  <Link to={`/tools?view=${t.id}`} className="inline-flex items-center gap-2 rounded-lg border border-field-line bg-field px-3 py-1.5 text-sm transition-colors hover:bg-hover">
                    <span aria-hidden="true">{t.icon}</span>{t.name}<StatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </ChartCard>

      <ChartCard id="heat-title" title="Usage Patterns" subtitle="When your teams are connected, by weekday and hour" className="lg:col-span-2">
        <Heatmap data={model.heatmap} />
      </ChartCard>
    </div>
  )
}
