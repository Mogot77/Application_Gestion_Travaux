import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState } from '@/stories'
import { buildConsultationModel, newDraft } from './helpers'
import ConsultationView from './ConsultationView'

const demande = mockState.demandes.find(d => d.statut !== 'brouillon' && d.lignes.length > 0) ?? mockState.demandes[0]
const draft = newDraft(mockState, demande)

const callbacks = {
  onSaveDraft: fn(), onSend: fn(), onSetMode: fn(), onField: fn(), onToggleLine: fn(), onAddEnt: fn(), onRemoveEnt: fn(),
  onVisite: fn(), onCreneau: fn(), onCritere: fn(), onOpenPhoto: fn(),
}

const meta = {
  title: 'Ecrans/Consultation', component: ConsultationView,
  args: { model: buildConsultationModel(mockState, demande, draft), ...callbacks },
} satisfies Meta<typeof ConsultationView>
export default meta
type Story = StoryObj<typeof meta>

/** Brouillon fraîchement créé (mise en concurrence par devis). */
export const NewDraft: Story = {}

/** Entreprise unique sans motif, critères incohérents et aucune entreprise retenue. */
export const SingleCompanyIncomplete: Story = {
  args: {
    model: buildConsultationModel(mockState, demande, {
      ...draft, mode: 'unique', entreprises: [], criteres: { prix: 50, delai: 25, qualite: 15 },
    }),
  },
}

/** Estimation élevée avec moins de 3 entreprises : avertissement. */
export const FewCompaniesWarning: Story = {
  args: {
    model: buildConsultationModel(mockState, demande, { ...draft, estimation: '5000', entreprises: draft.entreprises.slice(0, 1) }),
  },
}

/** Demande introuvable. */
export const NotFound: Story = { args: { model: null, error: 'Demande introuvable' } }
