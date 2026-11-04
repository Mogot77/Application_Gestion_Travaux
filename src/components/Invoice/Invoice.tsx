import type { Facture } from '@/types'
import { useApp } from '@/hooks/useApp'
import Layout from '@/components/Layout'
import { hist } from '@/helpers/domain'
import { TODAY } from '@/helpers/dates'
import { factureErrors } from '@/helpers/billing'
import { buildInvoiceModel } from './helpers'
import type { InvoiceProps } from './types'
import InvoiceView from './InvoiceView'

/** Conteneur d'une facture de refacturation : édition du brouillon, émission, paiement, annulation, impression. */
const Invoice = ({ id }: InvoiceProps) => {
  const { S, mutate, toast } = useApp()
  const upd = (fn: (f: Facture) => void, now = false) => mutate(s => { const f = s.factures.find(x => x.id === id); if (f) fn(f) }, { now })
  // Les champs ne sont modifiables que sur un brouillon : une facture émise ne change plus.
  const edit = (fn: (f: Facture) => void) => upd(f => { if (f.statut === 'brouillon') fn(f) })

  const emit = () => {
    const f = S.factures.find(x => x.id === id)
    const errors = f ? factureErrors(f) : []
    if (errors.length) return toast(`À compléter : ${errors.join(', ')}`, 'err')
    upd(x => { x.statut = 'emise'; hist(x, 'Facture émise') }, true)
    toast('Facture émise', 'ok')
  }

  return (
    <Layout active="facturation">
      <InvoiceView
        model={buildInvoiceModel(S, id)}
        onMeta={patch => edit(f => Object.assign(f, patch))}
        onEmetteur={patch => edit(f => { f.emetteur = { ...f.emetteur, ...patch } })}
        onDestinataire={patch => edit(f => { f.destinataire = { ...f.destinataire, ...patch } })}
        onLigne={(i, patch) => edit(f => { if (f.lignes[i]) f.lignes[i] = { ...f.lignes[i], ...patch } })}
        onAddLigne={() => edit(f => { f.lignes.push({ libelle: '', qte: 1, unite: 'forfait', puHT: 0, tva: 10 }) })}
        onRemoveLigne={i => edit(f => { f.lignes.splice(i, 1) })}
        onEmit={emit}
        onPaid={() => { upd(f => { if (f.statut === 'emise') { f.statut = 'payee'; f.payeeLe = TODAY; hist(f, 'Paiement reçu') } }, true); toast('Facture marquée payée', 'ok') }}
        onCancel={() => { upd(f => { if (f.statut !== 'payee' && f.statut !== 'annulee') { f.statut = 'annulee'; hist(f, 'Facture annulée') } }, true); toast('Facture annulée') }}
        onPrint={() => window.print()}
      />
    </Layout>
  )
}

export default Invoice
