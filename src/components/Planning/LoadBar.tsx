import { DAY_MAX } from '@/helpers/planning'
import { fdurS } from './helpers'
import type { LoadBarProps } from './types'

const LoadBar = ({ min, max = DAY_MAX }: LoadBarProps) => (
  <div className="load">{fdurS(min)} / {fdurS(max)}
    <div className="bar"><span className={min > max ? 'full' : ''} style={{ width: `${Math.min(100, Math.round(min / max * 100))}%` }}></span></div>
  </div>
)

export default LoadBar
