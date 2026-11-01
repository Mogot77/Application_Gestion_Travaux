import { useEffect, useId, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { FOCUSABLE } from './constants'
import type { ModalProps } from './types'

const Modal = ({ spec, onClose }: ModalProps) => {
  const form = useRef<HTMLFormElement>(null)
  const titleId = useId()

  // À l'ouverture : focus sur le premier champ (sinon sur la fenêtre) ; à la fermeture : retour au bouton qui l'avait ouverte.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const first = form.current?.querySelector<HTMLElement>('input:not([type=hidden]),select,textarea')
    ;(first ?? form.current)?.focus()
    return () => { if (opener?.isConnected) opener.focus() }
  }, [])

  /** Garde le focus clavier dans la fenêtre : Tab et Maj+Tab bouclent sur ses éléments. */
  const trap = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Tab' || !form.current) return
    const items = [...form.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null)
    if (!items.length) { e.preventDefault(); return }
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === form.current)) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    if (!spec.onOk || spec.onOk(f ? new FormData(f) : new FormData(), f) !== false) onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/45 p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <form
        ref={form} noValidate onSubmit={submit} onKeyDown={trap}
        role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className={`max-h-[calc(100vh-32px)] w-full overflow-auto rounded-xl bg-surface shadow-[0_20px_50px_rgba(17,24,39,.3)] ${spec.wide ? 'max-w-[900px]' : 'max-w-[520px]'}`}
      >
        <header className="flex items-center justify-between border-b border-line2 px-5 py-4">
          <strong id={titleId} className="text-base">{spec.title}</strong>
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

export default Modal
