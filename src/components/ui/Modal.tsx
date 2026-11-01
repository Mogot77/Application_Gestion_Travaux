import { useEffect, useRef, type FormEvent } from 'react'
import type { ModalSpec } from '../../store/context'

export function Modal({ spec, onClose }: { spec: ModalSpec; onClose: () => void }) {
  const form = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const first = form.current?.querySelector<HTMLElement>('input:not([type=hidden]),select,textarea')
    first?.focus()
  }, [])

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    if (!spec.onOk || spec.onOk(f ? new FormData(f) : new FormData(), f) !== false) onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/45 p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <form
        ref={form} noValidate onSubmit={submit}
        className={`max-h-[calc(100vh-32px)] w-full overflow-auto rounded-xl bg-white shadow-[0_20px_50px_rgba(17,24,39,.3)] ${spec.wide ? 'max-w-[900px]' : 'max-w-[520px]'}`}
      >
        <header className="flex items-center justify-between border-b border-line2 px-5 py-4">
          <strong className="text-base">{spec.title}</strong>
          <button type="button" className="cursor-pointer border-0 bg-transparent text-xl text-muted" aria-label="Fermer" onClick={onClose}>×</button>
        </header>
        <div className="flex flex-col gap-3.5 px-5 py-[18px]">{spec.body}</div>
        {!spec.noFooter && (
          <footer className="flex justify-end gap-2 border-t border-line2 px-5 py-3.5">
            <button type="button" className="btn" onClick={onClose}>Annuler</button>
            <button type="submit" className={`btn ${spec.danger ? 'btnd' : 'btnp'}`}>{spec.okLabel || 'Valider'}</button>
          </footer>
        )}
      </form>
    </div>
  )
}
