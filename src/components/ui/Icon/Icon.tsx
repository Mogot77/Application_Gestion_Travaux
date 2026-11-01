import { PATHS } from './constants'
import type { IconProps } from './types'

const Icon = ({ name, s, c, w }: IconProps) => {
  const p = PATHS[name]
  return (
    <svg width={s ?? p.s} height={s ?? p.s} viewBox="0 0 24 24" fill="none" stroke={c ?? p.c} strokeWidth={w ?? p.w ?? 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p.d}</svg>
  )
}

export default Icon
