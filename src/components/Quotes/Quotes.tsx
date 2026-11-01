import type { AppState, Consultation } from '@/types'
import { useApp } from '@/hooks/useApp'
import Layout from '@/components/Layout'
import { getCs, getD, getEnt, hist } from '@/helpers/domain'
import { feur } from '@/helpers/dates'
import { csv, download } from '@/helpers/csv'
import { buildQuotesCsvRows, buildQuotesModel, scoreCs, validerDecision } from './helpers'
import type { DecisionField, DecisionResult, QuotesProps } from './types'
import { reserveIds } from '@/store/queries/counters'
import QuotesView from './QuotesView'

/** Conteneur de la comparaison des devis : état global, notation, décision et validation. */
const Quotes = ({ id }: QuotesProps) => {
  const { S, mutate, getS, toast } = useApp()
  const { model, error } = buildQuotesModel(S, id)
  if (!model) return <Layout active="demandes"><QuotesView model={null} error={error} onRelance={() => {}} onExport={() => {}} onSetDecision={() => {}} onSubmit={() => {}} onValidate={() => {}} onRefuse={() => {}} onQuality={() => {}} onAnswer={() => {}} /></Layout>
  const { c, sc, dec, waitingCount } = model

  const upd = (fn: (x: Consultation, s: AppState) => void, persistNow = false) => mutate(s => { const x = getCs(s, c.id); if (x) fn(x, s) }, { now: persistNow })
  const setDec = (k: DecisionField, v: string) => upd((x, s) => {
    const d0 = getD(s, x.demandeId)
    x.decision = x.decision || { entrepriseId: scoreCs(s, x).best || '', motif: '', imputation: d0 ? d0.lignes[x.lignes[0]].imputation : '', statut: 'brouillon' }
    x.decision[k] = v
  })

  const soumettre = async () => {
    if (!dec.entrepriseId) return toast('Choisissez une entreprise', 'err')
    if (!sc.res[dec.entrepriseId]?.retenable) return toast('Entreprise non retenable : documents ou postes incomplets', 'err')
    if (!dec.motif.trim()) return toast('Le motif du choix est obligatoire', 'err')
    const r = c.reponses[dec.entrepriseId]
    if ((r.montantHT ?? 0) > S.ref.seuils.direction) {
      upd((x, s) => { x.decision = { ...dec }; x.decision.statut = 'a_valider'; hist(x, `Choix soumis à la direction : ${getEnt(s, dec.entrepriseId)?.nom} (${feur(r.montantHT)} HT)`) }, true)
      toast('Soumis à la validation de la direction', 'ok')
    } else {
      await reserveIds(getS(), ['bc'])
      let res: DecisionResult | null = null
      mutate(s => { const x = getCs(s, c.id); if (x) { x.decision = { ...dec }; res = validerDecision(s, c.id, true) } }, { now: true })
      const done = res as DecisionResult | null
      if (done) toast(`Bon de commande ${done.bc} envoyé à ${done.ent}`, 'ok')
    }
  }
  const validerDirection = async () => {
    if (S.profil !== 'dir') return
    await reserveIds(getS(), ['bc'])
    let res: DecisionResult | null = null
    mutate(s => { res = validerDecision(s, c.id, false) }, { now: true })
    const done = res as DecisionResult | null
    if (done) toast(`Bon de commande ${done.bc} envoyé à ${done.ent}`, 'ok')
  }

  return (
    <Layout active="demandes">
      <QuotesView
        model={model}
        onRelance={() => { upd(x => hist(x, `Relance envoyée aux non-répondants (${waitingCount})`), true); toast('Relance envoyée') }}
        onExport={() => download(`${c.id}_comparatif.csv`, csv(buildQuotesCsvRows(S, c, sc)))}
        onSetDecision={setDec}
        onSubmit={soumettre}
        onValidate={validerDirection}
        onRefuse={() => { upd(x => { if (x.decision) x.decision.statut = 'brouillon'; hist(x, 'Choix refusé par la direction : à revoir') }, true) }}
        onQuality={(x, v) => upd(cc => { cc.reponses[x].qualite = Math.min(cc.criteres.qualite, Math.max(0, Number(v) || 0)) })}
        onAnswer={(i, text) => upd(x => { x.questions[i].a = text; hist(x, 'Réponse publiée sur le portail') }, true)}
      />
    </Layout>
  )
}

export default Quotes
