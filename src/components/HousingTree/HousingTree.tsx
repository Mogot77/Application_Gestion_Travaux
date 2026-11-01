import { useApp } from '@/hooks/useApp'
import { STAT } from '@/helpers/domain'
import { docsFor } from '@/helpers/docs'
import HousingTreeView from './HousingTreeView'
import { logFolder } from './helpers'
import type { HousingTreeProps } from './types'

/** Dossier d'un logement dans l'arborescence de classement (constats + une sous-arborescence par demande). */
const HousingTree = ({ l, open }: HousingTreeProps) => {
  const { S } = useApp()
  const docs = docsFor(S, l)
  return (
    <HousingTreeView
      folder={logFolder(l)} open={open} constats={docs.constats}
      demandes={docs.demandes.map(x => ({ folder: x.folder, statut: STAT[x.d.statut][0].toLowerCase(), files: x.files }))}
    />
  )
}

export default HousingTree
