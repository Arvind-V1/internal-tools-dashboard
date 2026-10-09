import { buildReportSheets, reportFileName, type ReportMeta } from '../lib/analyticsExport'
import type { AnalyticsModel } from '../lib/analyticsModel'

const HEADER_STYLE = { fontWeight: 'bold' as const, color: '#ffffff', backgroundColor: '#6d5bf0', alignVertical: 'center' as const }

export async function exportExcel(model: AnalyticsModel, meta: ReportMeta): Promise<string> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const sheets = buildReportSheets(model, meta).map((sheet) => ({
    sheet: sheet.name,
    stickyRowsCount: 1,
    columns: sheet.header.map((_, i) => ({ width: i === 0 || (sheet.name === 'Insights' && i === 2) ? 36 : 18 })),
    data: [
      sheet.header.map((value) => ({ value, ...HEADER_STYLE })),
      ...sheet.rows.map((row) =>
        row.map((value, i) => {
          if (typeof value !== 'number') return { value }
          if (sheet.percentColumns?.includes(i) || (sheet.name === 'Summary' && /used|Adoption/.test(String(row[0])))) return { value, format: '0%' }
          if (sheet.euroColumns?.includes(i) || (sheet.name === 'Summary' && /€/.test(String(row[0])))) return { value, format: '#,##0' }
          return { value }
        }),
      ),
    ],
  }))
  const fileName = reportFileName(meta, 'xlsx')
  await writeXlsxFile(sheets).toFile(fileName)
  return fileName
}

export function exportPdf() {
  window.print()
}
