import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { buildNewRequestModel, newDraft } from './helpers'
import NewRequestView from './NewRequestView'
import type { NewRequestModel } from './types'
import type { DraftDemande } from '@/types'
import { withProfile } from '@/stories'

const coord = withProfile('coordination')
const etab = withProfile('etablissement')

/** Modèle réel de la fiche, construit avec le même code que l'application, à partir d'un brouillon ajusté. */
const modelOf = (S = coord, patch: (d: DraftDemande) => void = () => undefined, logId?: string, constatId?: string): NewRequestModel => {
  const dr = newDraft(S, logId, constatId)
  patch(dr)
  return buildNewRequestModel(S, dr)
}

const meta = {
  title: 'Ecrans/NewRequest', component: NewRequestView,
  args: {
    model: modelOf(),
    onField: fn(), onUrgence: fn(), onSinistreInfo: fn(), onLogement: fn(), onAddRdv: fn(), onRemoveRdv: fn(),onLine: fn(), onExtra: fn(), onAddLine: fn(), onRemoveLine: fn(),
    onAddPhotos: fn(), onDeletePhoto: fn(), onOpenPhoto: fn(), onSend: fn(), onSave: fn(), onDiscard: fn(),
  },
} satisfies Meta<typeof NewRequestView>
export default meta
type Story = StoryObj<typeof meta>

/** Brouillon vide : aucun logement, liste de contrôle incomplète. */
export const EmptyDraft: Story = {}

/** Brouillon complet, prêt à être envoyé. */
export const ReadyToSend: Story = {
  args: {
    model: modelOf(coord, d => {
      d.urgence = 'h48'
      d.lignes = [{ piece: 'Cuisine', lot: 'Plomberie / sanitaire', nature: 'Évacuation bouchée', description: 'Évier bouché depuis deux jours', photos: ['seed'], extra: {} }]
    }, 'LOG-0447'),
  },
}

/** Sinistre déclaré avec plusieurs lignes, dont une sans photo. */
export const WithClaim: Story = {
  args: {
    model: modelOf(coord, d => {
      d.urgence = 'urgent'
      d.sinistre = 'Oui'
      d.lignes = [
        { piece: 'Salle de bain', lot: 'Sinistre / assurance', nature: '', description: 'Fuite chez le voisin du dessus', photos: ['seed'], extra: {} },
        { piece: '', lot: '', nature: '', description: '', photos: [], extra: {} },
      ]
    }, 'LOG-0447'),
  },
}

/** Demande créée depuis un constat de visite. */
export const FromInspection: Story = { args: { model: modelOf(coord, undefined, 'LOG-0447', 'CE-2026-0232') } }

/** Profil établissement : pas de canal de réception, logements limités à son périmètre. */
export const EstablishmentProfile: Story = { args: { model: modelOf(etab) } }
