import { buildSeedTools } from '../data/mock'
import { buildAnalytics } from '../lib/analyticsModel'
import { exportExcel, exportPdf } from './exportReport'

const toFile = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const writeXlsxFile = vi.hoisted(() => vi.fn(() => ({ toFile })))
vi.mock('write-excel-file/browser', () => ({ default: writeXlsxFile }))

const NOW = Date.UTC(2026, 9, 8, 12)
const model = buildAnalytics(buildSeedTools(NOW), { range: '90d', department: '', category: '', query: '' }, NOW)
const meta = { range: '90d' as const, department: '', category: '', generatedAt: new Date(NOW) }

describe('exportReport', () => {
  it('génère un classeur de 5 feuilles, en-têtes figés et colorés, et le télécharge', async () => {
    const file = await exportExcel(model, meta)

    expect(file).toBe('analytics-90d-2026-10-08.xlsx')
    expect(toFile).toHaveBeenCalledWith(file)
    const sheets = (writeXlsxFile.mock.calls[0] as unknown as [{ sheet: string; stickyRowsCount: number; data: { value: unknown; backgroundColor?: string }[][] }[]])[0]
    expect(sheets.map((s) => s.sheet)).toEqual(['Summary', 'Spend', 'Tools', 'Departments', 'Insights'])
    expect(sheets.every((s) => s.stickyRowsCount === 1 && s.data[0].every((c) => c.backgroundColor === '#6d5bf0'))).toBe(true)
    expect(sheets[2].data).toHaveLength(1 + model.usage.length)
  })

  it('exportPdf ouvre la boîte d\'impression', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    exportPdf()
    expect(print).toHaveBeenCalledOnce()
  })
})
