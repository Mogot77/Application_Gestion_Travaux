import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import { getD, hist, nextId } from '@/helpers/domain'
import { proposeFacture } from '@/helpers/billing'
import { go } from '@/hooks/useRoute'
import { reserveIds } from '@/store/queries/counters'
import { buildBillingModel } from './helpers'
import type { BillingUi } from './types'
import BillingView from './BillingView'

/** Conteneur de la refacturation : liste des factures et création d'une facture à partir d'une demande. */
const Billing = () => {
  const { S, mutate, getS, toast } = useApp()
  const [ui, setUi] = useUiState<BillingUi>('fact', { q: '', statut: '' })

  const create = async (demandeId: string) => {
    if (!getD(getS(), demandeId)) return
    await reserveIds(getS(), ['fa'])
    let id = ''
    mutate(s => {
      const d = getD(s, demandeId)
      if (!d) return
      id = nextId(s, 'fa')
      const f = { id, ...proposeFacture(s, d) }
      hist(f, 'Facture créée (brouillon)')
      s.factures.unshift(f)
    }, { now: true })
    if (id) { toast(`Facture ${id} créée`, 'ok'); go(`#/facture/${id}`) }
  }

  return (
    <Layout active="facturation">
      <BillingView ui={ui} model={buildBillingModel(S, ui)} onCreate={create} onChange={setUi} />
    </Layout>
  )
}

export default Billing
