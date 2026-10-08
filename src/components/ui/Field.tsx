import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { inputClass } from '../../lib/styles'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

function FieldShell({ label, error, hint, required, id, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span aria-hidden="true" className="text-red-500"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-fg-muted">{hint}</p>
      )}
    </div>
  )
}

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined)

export function TextField({ label, error, hint, required, ...input }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <FieldShell {...{ label, error, hint, required, id }}>
      <input id={id} required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} className={inputClass(Boolean(error))} {...input} />
    </FieldShell>
  )
}

interface SelectFieldProps extends FieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({ label, error, hint, required, options, placeholder, ...select }: SelectFieldProps) {
  const id = useId()
  return (
    <FieldShell {...{ label, error, hint, required, id }}>
      <select id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} className={inputClass(Boolean(error))} {...select}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldShell>
  )
}

export function TextAreaField({ label, error, hint, required, ...area }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <FieldShell {...{ label, error, hint, required, id }}>
      <textarea id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} className={`${inputClass(Boolean(error))} h-24 resize-none py-2`} {...area} />
    </FieldShell>
  )
}
