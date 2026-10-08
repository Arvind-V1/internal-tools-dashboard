import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../test/utils'
import ToolsPage from './ToolsPage'

const renderPage = (route = '/tools') =>
  renderWithProviders(
    <Routes>
      <Route path="/tools" element={<ToolsPage />} />
    </Routes>,
    route,
  )

const loaded = () => screen.findByRole('table', { name: 'Tools catalog' })
const rows = () => screen.getAllByRole('row').slice(1)
const rowNames = () => rows().map((row) => within(row).getAllByRole('cell')[1].querySelector('button')?.textContent)
const location = () => screen.getByTestId('location').textContent
const dialog = () => screen.getByRole('dialog')

describe('ToolsPage : catalogue', () => {
  it('affiche des squelettes puis les 10 premiers outils, du plus récent au plus ancien', async () => {
    renderPage()
    expect(screen.getByRole('status', { name: 'Loading tools' })).toBeInTheDocument()

    await loaded()
    expect(screen.getByRole('heading', { level: 1, name: 'Tools Catalog' })).toBeInTheDocument()
    expect(rows()).toHaveLength(10)
    expect(rowNames().slice(0, 3)).toEqual(['Slack', 'Figma', 'GitHub'])
    expect(screen.getByText('Showing 1–10 of 20')).toBeInTheDocument()
    expect(screen.getByText('Showing 20 of 20')).toBeInTheDocument()
  })

  it('montre toutes les informations d\'un outil', async () => {
    renderPage()
    await loaded()

    const slack = rows()[0]
    expect(within(slack).getByText('Team messaging and channels for company-wide communication')).toBeInTheDocument()
    expect(within(slack).getAllByText('Communication')).toHaveLength(2) // catégorie + département
    expect(within(slack).getByText('245')).toBeInTheDocument()
    expect(within(slack).getByText('€2,450')).toBeInTheDocument()
    expect(within(slack).getByText('Active')).toBeInTheDocument()
    expect(within(slack).getByText('yesterday')).toBeInTheDocument()
  })

  it('pagine : la page 2 contient les 10 autres outils', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()

    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    expect(rows()).toHaveLength(10)
    expect(screen.getByText('Showing 11–20 of 20')).toBeInTheDocument()
    expect(rowNames()).not.toContain('Slack')
  })

  it('trie par coût, croissant puis décroissant', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    const header = screen.getByRole('columnheader', { name: /Monthly Cost/ })

    await user.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    expect(rowNames()[0]).toBe('Canva') // €195, le moins cher

    await user.click(within(header).getByRole('button'))
    expect(rowNames()[0]).toBe('Salesforce') // €4,500
  })

  it('affiche une erreur avec « Try again »', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/tools?mock=error')
    renderPage('/tools?mock=error')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Unable to load your tools')

    window.history.replaceState({}, '', '/tools')
    await user.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(await loaded()).toBeInTheDocument()
  })
})

describe('ToolsPage : filtres et recherche', () => {
  it('filtre par département avec le menu, et met à jour l\'URL', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()

    await user.selectOptions(screen.getByLabelText('Department'), 'Design')

    expect(rowNames()).toEqual(['Figma', 'Miro'])
    expect(location()).toBe('/tools?department=Design')
    expect(screen.getByText('2 tools found')).toBeInTheDocument()
  })

  it('combine département, catégorie et statuts (multi-sélection)', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()

    await user.selectOptions(screen.getByLabelText('Category'), 'Design')
    await user.click(screen.getByRole('button', { name: /^Expiring/ }))
    await user.click(screen.getByRole('button', { name: /^Unused/ }))

    expect(rowNames()).toEqual(['Adobe CC', 'Canva', 'Miro'])
    expect(screen.getByRole('button', { name: /^Expiring/ })).toHaveAttribute('aria-pressed', 'true')
    expect(location()).toBe('/tools?category=Design&status=expiring%2Cunused')
  })

  it('filtre par fourchette de coût et signale une fourchette incohérente', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()

    await user.type(screen.getByLabelText('Min cost (€)'), '1500')
    expect(rowNames()).toEqual(['Slack', 'Zoom', 'Salesforce', 'Microsoft 365', 'Datadog'])

    await user.type(screen.getByLabelText('Max cost (€)'), '1000')
    expect(screen.getByText('Max must be higher than min')).toBeInTheDocument()
    expect(screen.getByText('No tools match your filters')).toBeInTheDocument()
  })

  it('lit les filtres depuis l\'URL (lien partageable)', async () => {
    renderPage('/tools?department=Engineering&status=expiring')
    await loaded()

    expect(rowNames()).toEqual(['Jira'])
    expect(screen.getByLabelText('Department')).toHaveValue('Engineering')
  })

  it('cache les outils archivés, sauf avec le filtre « Archived »', async () => {
    renderPage('/tools?status=archived')
    expect(await screen.findByText('No tools match your filters')).toBeInTheDocument()
  })

  it('recherche multi-critères via ?q= (nom, description, éditeur...)', async () => {
    renderPage('/tools?q=issue atlassian')
    await loaded()
    expect(rowNames()).toEqual(['Jira'])
  })

  it('« Clear filters » remet tout à zéro, recherche comprise', async () => {
    const user = userEvent.setup()
    renderPage('/tools?department=Design&q=miro')
    await loaded()
    expect(rowNames()).toEqual(['Miro'])

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(location()).toBe('/tools')
    expect(rows()).toHaveLength(10)
  })

  it('propose d\'effacer les filtres quand rien ne correspond', async () => {
    const user = userEvent.setup()
    renderPage('/tools?q=zzzz')
    await screen.findByText('No tools match your filters')

    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])

    expect(await loaded()).toBeInTheDocument()
    expect(location()).toBe('/tools')
  })
})

describe('ToolsPage : sélection et actions groupées', () => {
  it('sélectionne des outils et affiche la barre d\'actions', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Select Slack'))
    await user.click(screen.getByLabelText('Select Figma'))

    const bar = screen.getByRole('region', { name: 'Bulk actions' })
    expect(within(bar).getByText('2 selected')).toBeInTheDocument()
    expect(screen.getByLabelText('Select all tools on this page')).toBePartiallyChecked()

    await user.click(within(bar).getByRole('button', { name: 'Clear selection' }))
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument()
  })

  it('sélection intelligente : toute la page, puis tous les outils correspondants', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()

    await user.click(screen.getByLabelText('Select all tools on this page'))
    expect(screen.getByText('All 10 tools on this page are selected.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Select all 20 matching tools' }))
    expect(screen.getByText('All 20 matching tools are selected.')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Bulk actions' })).getByText('20 selected')).toBeInTheDocument()
  })

  it('désactive plusieurs outils d\'un coup et confirme par un message', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await user.click(screen.getByLabelText('Select Slack'))
    await user.click(screen.getByLabelText('Select Figma'))

    await user.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Disable' }))

    expect(await screen.findByText('2 tools disabled')).toBeInTheDocument()
    expect(within(rows()[0]).getByText('Disabled')).toBeInTheDocument()
    expect(within(rows()[1]).getByText('Disabled')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument()
  })

  it('archive après confirmation : les outils disparaissent mais restent dans le filtre « Archived »', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await user.click(screen.getByLabelText('Select Slack'))

    await user.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Archive' }))
    expect(dialog()).toHaveAccessibleName('Archive Slack?')
    await user.click(within(dialog()).getByRole('button', { name: 'Archive' }))

    expect(await screen.findByText('Slack archived')).toBeInTheDocument()
    expect(rowNames()).not.toContain('Slack')
    const statusGroup = within(screen.getByRole('group', { name: 'Filter by status' }))
    expect(statusGroup.getByRole('button', { name: /Archived\s*1/ })).toBeInTheDocument()

    await user.click(statusGroup.getByRole('button', { name: /Archived/ }))
    expect(rowNames()).toEqual(['Slack'])
    expect(within(rows()[0]).getByText('Archived')).toBeInTheDocument()
  })

  it('restaure un outil archivé', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await user.click(screen.getByRole('button', { name: 'Actions for Slack' }))
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }))
    await user.click(within(dialog()).getByRole('button', { name: 'Archive' }))
    await screen.findByText('Slack archived')

    await user.click(screen.getByRole('button', { name: /^Archived/ }))
    await user.click(screen.getByRole('button', { name: 'Actions for Slack' }))
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['View details', 'Edit', 'Restore', 'Delete'])
    await user.click(screen.getByRole('menuitem', { name: 'Restore' }))

    expect(await screen.findByText('Slack restored')).toBeInTheDocument()
  })

  it('annuler la confirmation ne change rien', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await user.click(screen.getByRole('button', { name: 'Actions for Figma' }))
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }))

    await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(rowNames()).toContain('Figma')
  })

  it('supprime définitivement après confirmation', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()

    await user.click(screen.getByRole('button', { name: 'Actions for Figma' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(dialog()).toHaveAccessibleName('Delete Figma?')
    await user.click(within(dialog()).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Figma deleted')).toBeInTheDocument()
    expect(screen.getByText('Showing 19 of 19')).toBeInTheDocument()
  })

  it('affiche une erreur si l\'écriture échoue, sans modifier la liste', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    window.history.replaceState({}, '', '/tools?mock=write-error')

    await user.click(screen.getByRole('button', { name: 'Actions for Figma' }))
    await user.click(screen.getByRole('menuitem', { name: 'Disable' }))

    expect(await screen.findByText("Couldn't update Figma. Please try again.")).toBeInTheDocument()
    expect(within(rows()[1]).getByText('Active')).toBeInTheDocument()
  })
})

describe('ToolsPage : détail et modification', () => {
  it('ouvre le détail via l\'URL (?view=) avec toutes les informations', async () => {
    renderPage('/tools?view=5')

    const modal = await screen.findByRole('dialog', { name: 'Adobe CC' })
    expect(within(modal).getByText('Adobe Systems')).toBeInTheDocument()
    expect(within(modal).getByText('Unused')).toBeInTheDocument()
    expect(within(modal).getByText('€720')).toBeInTheDocument()
    expect(within(modal).getByText('€60')).toBeInTheDocument() // coût par utilisateur
    expect(within(modal).getByText('€8,640')).toBeInTheDocument() // estimation annuelle
    expect(within(modal).getByRole('link', { name: /adobe\.com/ })).toHaveAttribute('href', 'https://adobe.com')
  })

  it('ouvrir « View details » depuis le tableau, puis fermer retire le paramètre de l\'URL', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()

    await user.click(screen.getByRole('button', { name: 'Actions for Zoom' }))
    await user.click(screen.getByRole('menuitem', { name: 'View details' }))
    expect(location()).toBe('/tools?view=6')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(location()).toBe('/tools')
  })

  it('ignore un identifiant inconnu', async () => {
    renderPage('/tools?view=999')
    await loaded()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('change le statut depuis le détail', async () => {
    const user = userEvent.setup()
    renderPage('/tools?view=1')
    const modal = await screen.findByRole('dialog', { name: 'Slack' })

    await user.click(within(modal).getByRole('button', { name: 'Disable' }))

    expect(await screen.findByText('Slack disabled')).toBeInTheDocument()
    expect(within(await screen.findByRole('dialog', { name: 'Slack' })).getByText('Disabled')).toBeInTheDocument()
  })

  it('modifie un outil via le formulaire en 3 étapes', async () => {
    const user = userEvent.setup()
    renderPage('/tools?edit=1')
    const modal = await screen.findByRole('dialog', { name: 'Edit Slack' })

    const name = within(modal).getByLabelText(/^Name/)
    expect(name).toHaveValue('Slack')
    await user.clear(name)
    await user.type(name, 'Slack Enterprise')
    await user.click(within(modal).getByRole('button', { name: 'Next' }))
    await user.clear(within(modal).getByLabelText(/^Monthly cost/))
    await user.type(within(modal).getByLabelText(/^Monthly cost/), '3000')
    await user.click(within(modal).getByRole('button', { name: 'Next' }))
    expect(within(modal).getByText('Slack Enterprise')).toBeInTheDocument()
    await user.click(within(modal).getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Slack Enterprise updated')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(rowNames()[0]).toBe('Slack Enterprise') // le plus récemment modifié
    expect(within(rows()[0]).getByText('€3,000')).toBeInTheDocument()
  })
})

// Le texte d'erreur est aussi le libellé de l'option vide du <select> : on ignore les <option>
const errorText = (root: HTMLElement, text: string) =>
  within(root).getAllByText(text).find((el) => el.tagName !== 'OPTION') as HTMLElement

describe('ToolsPage : ajout d\'un outil (formulaire multi-étapes)', () => {
  const open = async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await user.click(screen.getByRole('button', { name: 'Add tool' }))
    return { user, modal: await screen.findByRole('dialog', { name: 'Add new tool' }) }
  }

  it('valide chaque étape avant de passer à la suivante', async () => {
    const { user, modal } = await open()
    expect(modal).toHaveTextContent('Step 1 of 3 · Basics')

    await user.click(within(modal).getByRole('button', { name: 'Next' }))

    expect(within(modal).getByText('Name is required')).toBeInTheDocument()
    expect(within(modal).getByText('Vendor is required')).toBeInTheDocument()
    expect(errorText(modal, 'Select a category')).toBeInTheDocument()
    expect(within(modal).getByLabelText(/^Name/)).toHaveFocus()
    expect(modal).toHaveTextContent('Step 1 of 3')
  })

  it('efface l\'erreur d\'un champ dès qu\'on le corrige', async () => {
    const { user, modal } = await open()
    await user.click(within(modal).getByRole('button', { name: 'Next' }))

    await user.type(within(modal).getByLabelText(/^Name/), 'Linear')

    expect(within(modal).queryByText('Name is required')).not.toBeInTheDocument()
  })

  it('refuse une URL invalide', async () => {
    const { user, modal } = await open()
    await user.type(within(modal).getByLabelText(/^Name/), 'Linear')
    await user.type(within(modal).getByLabelText(/^Vendor/), 'Linear Orbit')
    await user.selectOptions(within(modal).getByLabelText(/^Category/), 'Development')
    await user.type(within(modal).getByLabelText('Website'), 'linear')

    await user.click(within(modal).getByRole('button', { name: 'Next' }))

    expect(within(modal).getByText(/valid URL/)).toBeInTheDocument()
  })

  it('crée l\'outil : 3 étapes, récapitulatif modifiable, message de succès', async () => {
    const { user, modal } = await open()

    await user.type(within(modal).getByLabelText(/^Name/), 'Linear')
    await user.type(within(modal).getByLabelText(/^Vendor/), 'Linear Orbit')
    await user.selectOptions(within(modal).getByLabelText(/^Category/), 'Development')
    await user.click(within(modal).getByRole('button', { name: 'Next' }))

    expect(modal).toHaveTextContent('Step 2 of 3 · Cost & ownership')
    await user.click(within(modal).getByRole('button', { name: 'Next' }))
    expect(errorText(modal, 'Select a department')).toBeInTheDocument()
    expect(within(modal).getByText('Enter an amount between 0 and 1,000,000')).toBeInTheDocument()
    await user.selectOptions(within(modal).getByLabelText(/^Department/), 'Engineering')
    await user.type(within(modal).getByLabelText(/^Monthly cost/), '96')
    expect(within(modal).getByText(/≈ €1,152 per year/)).toBeInTheDocument()
    await user.clear(within(modal).getByLabelText(/^Active users/))
    await user.type(within(modal).getByLabelText(/^Active users/), '12')
    await user.click(within(modal).getByRole('button', { name: 'Next' }))

    expect(modal).toHaveTextContent('Step 3 of 3 · Review')
    expect(within(modal).getByText('Linear Orbit')).toBeInTheDocument()
    expect(within(modal).getByText('€96')).toBeInTheDocument()

    await user.click(within(modal).getByRole('button', { name: 'Back' }))
    expect(modal).toHaveTextContent('Step 2 of 3')
    await user.click(within(modal).getByRole('button', { name: 'Next' }))
    await user.click(within(modal).getByRole('button', { name: 'Add tool' }))

    expect(await screen.findByText('Linear added to the catalog')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(rowNames()[0]).toBe('Linear')
    expect(screen.getByText('Showing 21 of 21')).toBeInTheDocument()
    expect(location()).toBe('/tools')
  })

  it('un nom déjà utilisé ramène à la première étape avec l\'erreur', async () => {
    const { user, modal } = await open()
    await user.type(within(modal).getByLabelText(/^Name/), 'slack')
    await user.type(within(modal).getByLabelText(/^Vendor/), 'Someone')
    await user.selectOptions(within(modal).getByLabelText(/^Category/), 'Communication')
    await user.click(within(modal).getByRole('button', { name: 'Next' }))
    await user.selectOptions(within(modal).getByLabelText(/^Department/), 'Sales')
    await user.type(within(modal).getByLabelText(/^Monthly cost/), '10')
    await user.click(within(modal).getByRole('button', { name: 'Next' }))

    await user.click(within(modal).getByRole('button', { name: 'Add tool' }))

    expect(await within(modal).findByText('A tool named “slack” already exists')).toBeInTheDocument()
    expect(modal).toHaveTextContent('Step 1 of 3')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('affiche une erreur de sauvegarde et garde la saisie', async () => {
    const { user, modal } = await open()
    window.history.replaceState({}, '', '/tools?mock=write-error')
    await user.type(within(modal).getByLabelText(/^Name/), 'Linear')
    await user.type(within(modal).getByLabelText(/^Vendor/), 'Linear Orbit')
    await user.selectOptions(within(modal).getByLabelText(/^Category/), 'Development')
    await user.click(within(modal).getByRole('button', { name: 'Next' }))
    await user.selectOptions(within(modal).getByLabelText(/^Department/), 'Engineering')
    await user.type(within(modal).getByLabelText(/^Monthly cost/), '96')
    await user.click(within(modal).getByRole('button', { name: 'Next' }))

    await user.click(within(modal).getByRole('button', { name: 'Add tool' }))

    expect(await within(modal).findByRole('alert')).toHaveTextContent("We couldn't save this tool")
    expect(within(modal).getByText('Linear Orbit')).toBeInTheDocument()
  })

  it('« Cancel » ferme la fenêtre sans rien créer', async () => {
    const { user, modal } = await open()
    await user.click(within(modal).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 20 of 20')).toBeInTheDocument()
  })
})

describe('ToolsPage : suggestions intelligentes', () => {
  it('propose des conseils calculés sur le catalogue, avec les économies potentielles', async () => {
    renderPage()
    const panel = await screen.findByRole('region', { name: 'Smart suggestions' })

    expect(within(panel).getByText('Adobe CC looks unused')).toBeInTheDocument()
    expect(within(panel).getByText('Notion is about to expire')).toBeInTheDocument()
    expect(within(panel).getByText('5 tools overlap in Productivity')).toBeInTheDocument()
    expect(within(panel).getByText('Salesforce costs €100 per user')).toBeInTheDocument()
    expect(within(panel).getByText('€1,283/month')).toBeInTheDocument()
  })

  it('« Compare » applique le filtre de la catégorie concernée', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Compare' }))

    expect(location()).toBe('/tools?category=Productivity')
    expect(screen.getByLabelText('Category')).toHaveValue('Productivity')
  })

  it('« Archive » demande confirmation, « Review » ouvre le détail', async () => {
    const user = userEvent.setup()
    renderPage()
    const panel = await screen.findByRole('region', { name: 'Smart suggestions' })

    await user.click(within(panel).getByRole('button', { name: 'Archive' }))
    expect(dialog()).toHaveAccessibleName('Archive Adobe CC?')
    await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }))

    await user.click(within(panel).getByRole('button', { name: 'Review' }))
    expect(await screen.findByRole('dialog', { name: 'Notion' })).toBeInTheDocument()
  })

  it('une suggestion peut être masquée', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Dismiss suggestion: Adobe CC looks unused' }))
    expect(screen.queryByText('Adobe CC looks unused')).not.toBeInTheDocument()
  })
})
