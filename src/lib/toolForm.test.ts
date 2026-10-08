import { buildSeedTools } from '../data/mock'
import { emptyForm, formFromTool, hasErrors, toToolInput, validateAll, validateStep, type ToolFormValues } from './toolForm'

const valid = (patch: Partial<ToolFormValues> = {}): ToolFormValues => ({
  ...emptyForm(),
  name: 'Linear',
  vendor: 'Linear Orbit',
  category: 'Development',
  department: 'Engineering',
  monthlyCost: '96',
  users: '12',
  ...patch,
})

describe('validateStep', () => {
  it('étape 1 : nom, éditeur et catégorie obligatoires', () => {
    expect(validateStep(0, emptyForm())).toEqual({ name: 'Name is required', vendor: 'Vendor is required', category: 'Select a category' })
  })

  it.each([
    ['A', 'Name must be 2-100 characters'],
    ['x'.repeat(101), 'Name must be 2-100 characters'],
  ])('nom invalide %#', (name, message) => {
    expect(validateStep(0, valid({ name })).name).toBe(message)
  })

  it('valide l\'URL du site (facultative) et la longueur de la description', () => {
    expect(validateStep(0, valid({ websiteUrl: '' }))).toEqual({})
    expect(validateStep(0, valid({ websiteUrl: 'https://linear.app' }))).toEqual({})
    expect(validateStep(0, valid({ websiteUrl: 'linear' })).websiteUrl).toMatch(/valid URL/)
    expect(validateStep(0, valid({ websiteUrl: 'ftp://linear.app' })).websiteUrl).toMatch(/valid URL/)
    expect(validateStep(0, valid({ description: 'x'.repeat(501) })).description).toMatch(/500/)
  })

  it('étape 2 : département, coût et utilisateurs', () => {
    expect(hasErrors(validateStep(1, valid()))).toBe(false)
    expect(validateStep(1, valid({ department: '' })).department).toBe('Select a department')
    expect(validateStep(1, valid({ monthlyCost: '' })).monthlyCost).toBeDefined()
    expect(validateStep(1, valid({ monthlyCost: '-3' })).monthlyCost).toBeDefined()
    expect(validateStep(1, valid({ users: '2.5' })).users).toBeDefined()
    expect(validateStep(1, valid({ users: '-1' })).users).toBeDefined()
  })

  it('l\'étape de récapitulatif n\'a pas de règle propre', () => {
    expect(validateStep(2, emptyForm())).toEqual({})
  })
})

describe('validateAll / conversions', () => {
  it('cumule les erreurs des deux étapes', () => {
    expect(Object.keys(validateAll(emptyForm())).sort()).toEqual(['category', 'department', 'monthlyCost', 'name', 'vendor'])
    expect(hasErrors(validateAll(valid()))).toBe(false)
  })

  it('nettoie et convertit les valeurs saisies', () => {
    expect(toToolInput(valid({ name: '  Linear  ', websiteUrl: ' https://linear.app ', monthlyCost: '96.5' }))).toEqual({
      name: 'Linear',
      vendor: 'Linear Orbit',
      category: 'Development',
      description: '',
      websiteUrl: 'https://linear.app',
      department: 'Engineering',
      monthlyCost: 96.5,
      users: 12,
      status: 'active',
    })
  })

  it('pré-remplit le formulaire d\'édition depuis un outil', () => {
    const slack = buildSeedTools()[0]
    const form = formFromTool(slack)
    expect(form).toMatchObject({ name: 'Slack', monthlyCost: '2450', users: '245', status: 'active' })
    expect(hasErrors(validateAll(form))).toBe(false)
  })
})
