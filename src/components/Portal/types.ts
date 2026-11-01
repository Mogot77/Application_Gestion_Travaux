import type { Consultation, Demande, DocsEntreprise, Entreprise, Logement, ReponseDevis } from '@/types'
import type { OptItem } from '@/components/ui/Opts'

export type PortalDraft = { montantHT: string; tva: string; delai: string; duree: string; validite: string; postes: number[]; pdf: string; slot: string }

export type PortalProps = { csId: string; eid?: string }

export type DocStatus = 'expired' | 'soon' | 'ok'

/** Ligne de la liste des documents de l'entreprise. */
export type DocRow = { k: keyof DocsEntreprise; label: string; status: DocStatus; exp: string }

/** Données calculées du portail pour une entreprise et une consultation. */
export type PortalModel = {
  c: Consultation
  e: Entreprise
  d: Demande
  log: Logement
  eid: string
  r: ReponseDevis
  closed: boolean
  docsOk: boolean
  docRows: DocRow[]
  photos: string[]
  lotsLabel: string
  entOptions: OptItem[]
}

export type PortalViewProps = {
  /** Null quand le lien est invalide ou expiré. */
  model: PortalModel | null
  /** Brouillon de dépôt de devis (état d'interface persistant). */
  draft: PortalDraft
  onDraft: (patch: Partial<PortalDraft>) => void
  onChooseSlot: (slot: string) => void
  /** Question (déjà nettoyée, non vide) posée à la coordination. */
  onAsk: (text: string) => void
  onDeposit: () => void
  onDecline: () => void
  onUpdateDoc: (key: keyof DocsEntreprise) => void
  onSwitchEnt: (entId: string) => void
  onOpenPhoto: (src: string) => void
}
