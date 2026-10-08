import { useEffect, useRef, type InputHTMLAttributes } from 'react'
import { CHECKBOX } from '../../lib/styles'

export function Checkbox({ indeterminate = false, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return <input ref={ref} type="checkbox" className={CHECKBOX} {...props} />
}
