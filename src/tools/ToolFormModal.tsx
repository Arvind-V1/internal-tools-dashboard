import { clsx } from 'clsx'
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useToast } from '../hooks/toastContext'
import { useToolMutations } from '../hooks/useToolMutations'
import { CATEGORIES, DEPARTMENTS, FORM_STATUSES } from '../lib/constants'
import { formatEuro } from '../lib/format'
import { BUTTON, STATUS_STYLES } from '../lib/styles'
import {
  emptyForm, formFromTool, hasErrors, STEP_LABELS, toToolInput, validateAll, validateStep,
  type FormErrors, type ToolFormValues,
} from '../lib/toolForm'
import { ApiError } from '../services/errors'
import type { Tool } from '../types/tool'
import { Modal } from '../components/ui/Modal'
import { SelectField, TextAreaField, TextField } from '../components/ui/Field'

const toOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }))
const LAST_STEP = STEP_LABELS.length - 1

function Stepper({ step }: { step: number }) {
  return (
    <ol aria-label="Progress" className="mb-6 flex items-center gap-2">
      {STEP_LABELS.map((label, index) => (
        <li key={label} aria-current={index === step ? 'step' : undefined} className="flex flex-1 items-center gap-2 last:flex-none">
          <span
            className={clsx(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              index < step && 'bg-linear-to-br from-emerald-500 to-teal-600 text-white',
              index === step && 'bg-linear-to-br from-blue-500 to-violet-600 text-white',
              index > step && 'border border-field-line text-fg-muted',
            )}
          >
            {index < step ? <Check size={14} aria-label="completed" /> : index + 1}
          </span>
          <span className={clsx('hidden text-sm sm:block', index === step ? 'font-medium' : 'text-fg-muted')}>{label}</span>
          {index < LAST_STEP && <span aria-hidden="true" className="mx-1 h-px flex-1 bg-line" />}
        </li>
      ))}
    </ol>
  )
}

function ReviewSection({ title, onEdit, rows }: { title: string; onEdit: () => void; rows: [string, string][] }) {
  return (
    <section className="rounded-xl border border-line-soft p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button type="button" onClick={onEdit} className="text-sm text-violet-500 hover:underline">Edit<span className="sr-only"> {title}</span></button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="min-w-0 break-words">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function ToolFormModal({ tool, onClose }: { tool?: Tool; onClose: () => void }) {
  const isEdit = Boolean(tool)
  const toast = useToast()
  const { create, update } = useToolMutations()
  const createAsync = create.mutateAsync
  const updateAsync = update.mutateAsync
  const formId = useId()
  const formRef = useRef<HTMLFormElement>(null)

  const [step, setStep] = useState(0)
  const [values, setValues] = useState<ToolFormValues>(() => (tool ? formFromTool(tool) : emptyForm()))
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors])

  const set = <K extends keyof ToolFormValues>(key: K, value: ToolFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const next = () => {
    const found = validateStep(step, values)
    setErrors(found)
    if (!hasErrors(found)) setStep(step + 1)
  }

  const save = async () => {
    const found = validateAll(values)
    if (hasErrors(found)) {
      setErrors(found)
      setStep(hasErrors(validateStep(0, values)) ? 0 : 1)
      return
    }
    setSaving(true)
    setSubmitError(null)
    try {
      const input = toToolInput(values)
      if (tool) await updateAsync({ id: tool.id, patch: input })
      else await createAsync(input)
      toast.success(isEdit ? `${input.name} updated` : `${input.name} added to the catalog`)
      onClose()
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'conflict') {
        setErrors({ name: error.message })
        setStep(0)
      } else {
        setSubmitError("We couldn't save this tool. Please try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (step < LAST_STEP) next()
    else void save()
  }

  const statusOptions = [...FORM_STATUSES, ...(values.status === 'archived' ? (['archived'] as const) : [])].map((s) => ({ value: s, label: STATUS_STYLES[s].label }))

  return (
    <Modal
      size="lg"
      title={tool ? `Edit ${tool.name}` : 'Add new tool'}
      description={`Step ${step + 1} of ${STEP_LABELS.length} · ${STEP_LABELS[step]}`}
      onClose={onClose}
      footer={
        <>
          {step === 0 ? (
            <button type="button" className={BUTTON.secondary} onClick={onClose}>Cancel</button>
          ) : (
            <button type="button" className={BUTTON.secondary} onClick={() => setStep(step - 1)} disabled={saving}>Back</button>
          )}
          <button type="submit" form={formId} className={BUTTON.primary} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {step < LAST_STEP ? 'Next' : isEdit ? 'Save changes' : 'Add tool'}
          </button>
        </>
      }
    >
      <Stepper step={step} />
      <form id={formId} ref={formRef} noValidate onSubmit={submit} className="space-y-4">
        {step === 0 && (
          <>
            <TextField label="Name" required data-autofocus value={values.name} error={errors.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Linear" maxLength={120} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Vendor" required value={values.vendor} error={errors.vendor} onChange={(e) => set('vendor', e.target.value)} placeholder="e.g. Linear Orbit Inc." />
              <SelectField label="Category" required value={values.category} error={errors.category} onChange={(e) => set('category', e.target.value)} placeholder="Select a category" options={toOptions(CATEGORIES)} />
            </div>
            <TextField label="Website" inputMode="url" value={values.websiteUrl} error={errors.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} placeholder="https://example.com" />
            <TextAreaField
              label="Description"
              value={values.description}
              error={errors.description}
              hint={`${values.description.length}/500`}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What is this tool used for?"
            />
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Department" required data-autofocus value={values.department} error={errors.department} onChange={(e) => set('department', e.target.value)} placeholder="Select a department" options={toOptions(DEPARTMENTS)} />
              <SelectField label="Status" required value={values.status} error={errors.status} onChange={(e) => set('status', e.target.value as ToolFormValues['status'])} options={statusOptions} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Monthly cost (€)"
                required
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={values.monthlyCost}
                error={errors.monthlyCost}
                hint={values.monthlyCost && !errors.monthlyCost && Number(values.monthlyCost) >= 0 ? `Total for all users · ≈ ${formatEuro(Math.round(Number(values.monthlyCost) * 12))} per year` : 'Total for all users'}
                onChange={(e) => set('monthlyCost', e.target.value)}
                placeholder="0"
              />
              <TextField label="Active users" required type="number" inputMode="numeric" min={0} step={1} value={values.users} error={errors.users} onChange={(e) => set('users', e.target.value)} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <ReviewSection
              title="Basics"
              onEdit={() => setStep(0)}
              rows={[['Name', values.name.trim()], ['Vendor', values.vendor.trim()], ['Category', values.category], ['Website', values.websiteUrl.trim()], ['Description', values.description.trim()]]}
            />
            <ReviewSection
              title="Cost & ownership"
              onEdit={() => setStep(1)}
              rows={[['Department', values.department], ['Status', STATUS_STYLES[values.status].label], ['Monthly cost', formatEuro(Number(values.monthlyCost))], ['Active users', values.users]]}
            />
            {submitError && <p role="alert" className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">{submitError}</p>}
          </>
        )}
      </form>
    </Modal>
  )
}
