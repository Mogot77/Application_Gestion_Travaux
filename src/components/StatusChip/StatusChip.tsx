import Chip from '@/components/ui/Chip'
import { useApp } from '@/hooks/useApp'
import { statInfo } from './helpers'
import type { StatusChipProps } from './types'


const StatusChip = ({ d }: StatusChipProps) => {
  const { S } = useApp()
  const [l, c] = statInfo(S, d)
  return <Chip tone={c}>{l}</Chip>
}

export default StatusChip
