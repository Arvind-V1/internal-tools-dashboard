import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeTools } from '../../test/utils'
import { RecentToolsTable } from './RecentToolsTable'

const handlers = { onClearSearch: vi.fn(), onView: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }

function setup(count: number, query = '') {
  const tools = makeTools(count)
  render(<RecentToolsTable tools={tools} query={query} {...handlers} />)
  return tools
}

const rowNames = () =>
  screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[0].textContent?.replace('🧩', '').trim())

afterEach(() => vi.clearAllMocks())

describe('RecentToolsTable', () => {
  it('affiche les colonnes et les lignes', () => {
    setup(3)

    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Tool', 'Department', 'Users', 'Monthly Cost', 'Status'])
    expect(rowNames()).toEqual(['Tool 01', 'Tool 02', 'Tool 03'])
    expect(screen.getByText('€300')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Expiring')).toBeInTheDocument()
    expect(screen.getByText('Unused')).toBeInTheDocument()
  })

  it('trie par colonne : croissant, décroissant, puis ordre d\'origine', async () => {
    const user = userEvent.setup()
    setup(3) // coûts 300, 200, 100
    const header = screen.getByRole('columnheader', { name: /Monthly Cost/ })

    await user.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    expect(rowNames()).toEqual(['Tool 03', 'Tool 02', 'Tool 01'])

    await user.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'descending')
    expect(rowNames()).toEqual(['Tool 01', 'Tool 02', 'Tool 03'])

    await user.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'none')
  })

  it('pagine par 10 lignes', async () => {
    const user = userEvent.setup()
    setup(12)

    expect(rowNames()).toHaveLength(10)
    expect(screen.getByText('Showing 1–10 of 12')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(rowNames()).toEqual(['Tool 11', 'Tool 12'])
    expect(screen.getByText('Showing 11–12 of 12')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('revient à la page 1 quand on change le tri', async () => {
    const user = userEvent.setup()
    setup(12)
    await user.click(screen.getByRole('button', { name: 'Next page' }))

    await user.click(within(screen.getByRole('columnheader', { name: /Tool/ })).getByRole('button'))

    expect(screen.getByText('Showing 1–10 of 12')).toBeInTheDocument()
  })

  it('n\'affiche pas la pagination quand tout tient sur une page', () => {
    setup(8)
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
  })

  it('filtre avec la recherche et gère l\'absence de résultat', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<RecentToolsTable tools={makeTools(5)} query="tool 02" {...handlers} />)
    expect(rowNames()).toEqual(['Tool 02'])

    rerender(<RecentToolsTable tools={makeTools(5)} query="zzz" {...handlers} />)
    expect(screen.getByText('No tools match “zzz”')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(handlers.onClearSearch).toHaveBeenCalled()
  })

  it('propose View, Edit et Delete dans le menu d\'actions de la ligne', async () => {
    const user = userEvent.setup()
    const tools = setup(3)

    await user.click(screen.getByRole('button', { name: 'Actions for Tool 02' }))
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['View', 'Edit', 'Delete'])

    await user.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(handlers.onEdit).toHaveBeenCalledWith(tools[1])
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Tool 03' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(handlers.onDelete).toHaveBeenCalledWith(tools[2])
  })

  it('ferme le menu avec Échap', async () => {
    const user = userEvent.setup()
    setup(2)

    await user.click(screen.getByRole('button', { name: 'Actions for Tool 01' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
