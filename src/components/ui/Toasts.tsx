import type { ToastKind } from '../../store/context'

export interface ToastItem { id: number; msg: string; kind: ToastKind }

const TONE: Record<ToastKind, string> = { '': 'bg-ink', ok: 'bg-good', err: 'bg-danger' }

export function Toasts({ items }: { items: ToastItem[] }) {
  return (
    <div className="noprint pointer-events-none fixed bottom-5 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2">
      {items.map(t => (
        <div key={t.id} className={`max-w-[90vw] animate-[tin_.2s_ease-out] rounded-lg px-4 py-2.5 text-[13px] text-white shadow-[0_8px_24px_rgba(0,0,0,.25)] ${TONE[t.kind]}`}>{t.msg}</div>
      ))}
    </div>
  )
}
