import { TONE } from './constants'
import type { ToastsProps } from './types'

const Toasts = ({ items }: ToastsProps) => (
  <div className="noprint pointer-events-none fixed bottom-5 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2">
    {items.map(t => (
      <div key={t.id} className={`max-w-[90vw] animate-[tin_.2s_ease-out] rounded-lg px-4 py-2.5 text-[13px] text-white shadow-[0_8px_24px_rgba(0,0,0,.25)] ${TONE[t.kind]}`}>{t.msg}</div>
    ))}
  </div>
)

export default Toasts
