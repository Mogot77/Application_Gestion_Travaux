import Chip from '@/components/ui/Chip'
import { URG } from '@/helpers/domain'
import type { CardTagProps } from './types'

const CardTag = ({ d }: CardTagProps) => d.statut === 'acces_impossible' ? <Chip tone="u">REPROG.</Chip> : d.origine === 'supp' ? <Chip tone="tl">AJOUT SUR PLACE</Chip> : <Chip tone={URG[d.urgence][1]}>{URG[d.urgence][2]}</Chip>

export default CardTag
