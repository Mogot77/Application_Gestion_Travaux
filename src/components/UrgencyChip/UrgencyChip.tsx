import Chip from '@/components/ui/Chip'
import { URG } from '@/helpers/domain'
import type { UrgencyChipProps } from './types'

const UrgencyChip = ({ k }: UrgencyChipProps) => (k && URG[k] ? <Chip tone={URG[k][1]}>{URG[k][0]}</Chip> : null)

export default UrgencyChip
