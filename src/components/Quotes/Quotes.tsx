import { useState } from 'react'
import type { AppState, Consultation, DecisionDevis, ReponseDevis } from '@/types'
import { useApp } from '@/hooks/useApp'
import Layout from '@/components/Layout'
import Chip from '@/components/ui/Chip'
import Opts from '@/components/ui/Opts'
import { getCs, getD, getEnt, getLog, hist, shortLot } from '@/helpers/domain'
import { fd, fday, feur, fnum } from '@/helpers/dates'
import { csv, download } from '@/helpers/csv'
import { scoreCs, validerDecision } from './helpers'
import type { DecisionResult, QuotesProps } from './types'
import Kpi from '@/components/ui/Kpi'
import Crumb from '@/components/ui/Crumb'
import { reserveIds } from '@/store/queries/counters'

const Muted = () => <span className="muted">—</span>

const Quotes = ({ id }: QuotesProps) => {
  const { S, mutate, getS, toast } = useApp()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const c = getCs(S, id)
  if (!c) return <Layout active="demandes"><div className="card pad empty">Consultation introuvable</div></Layout>
  const d = getD(S, c.demandeId)
  if (!d) return <Layout active="demandes"><div className="card pad empty">Demande introuvable</div></Layout>
  const log = getLog(S, d.logementId)
  const sc = scoreCs(S, c)
  const ents = c.entreprises.map(e => getEnt(S, e)).filter((e): e is NonNullable<typeof e> => !!e)
  const rec = sc.rec
  const declined = c.entreprises.filter(x => c.reponses[x] && c.reponses[x].statut === 'decline').length
  const waiting = c.entreprises.filter(x => !c.reponses[x] || c.reponses[x].statut === 'attente')
  const prices = rec.map(x => c.reponses[x].montantHT ?? 0)
  const ecart = prices.length > 1 ? Math.round((Math.max(...prices) - Math.min(...prices)) / Math.min(...prices) * 100) : null
  const dec: DecisionDevis = c.decision || { entrepriseId: sc.best || '', motif: '', imputation: d.lignes[c.lignes[0]].imputation, statut: 'brouillon' }
  const chosen = dec.entrepriseId ? c.reponses[dec.entrepriseId] : undefined
  const needDir = !!chosen && (chosen.montantHT ?? 0) > S.ref.seuils.direction
  const locked = dec.statut === 'validee' || dec.statut === 'a_valider'
  const stChip = c.statut === 'commande' ? <Chip tone="ok">Commande passée</Chip> : dec.statut === 'a_valider' ? <Chip tone="h48">En attente de validation direction</Chip> : <Chip tone="bl">{waiting.length ? 'Réponses en cours' : 'Analyse en cours'}</Chip>

  const upd = (fn: (x: Consultation, s: AppState) => void, persistNow = false) => mutate(s => { const x = getCs(s, c.id); if (x) fn(x, s) }, { now: persistNow })
  const setDec = (k: 'entrepriseId' | 'motif' | 'imputation', v: string) => upd((x, s) => {
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
  const answer = (i: number) => {
    const v = (answers[i] || '').trim()
    if (!v) return
    upd(x => { x.questions[i].a = v; hist(x, 'Réponse publiée sur le portail') }, true)
  }
  const exportCsv = () => {
    const rows: unknown[][] = [['Entreprise', 'Statut', 'Montant HT', 'TVA %', 'Délai (j)', 'Durée (j)', 'Validité (mois)', 'Postes', 'Documents', 'Note prix', 'Note délai', 'Note qualité', 'Total']]
    c.entreprises.forEach(x => {
      const r = c.reponses[x] || {}; const s = sc.res[x]
      rows.push([getEnt(S, x)?.nom, r.statut, r.montantHT, r.tva, r.delai, r.duree, r.validite, r.postes ? r.postes.length + '/' + c.lignes.length : '', s ? (s.docsOk ? 'Conformes' : s.docsLabel) : '', s ? s.prix.toFixed(1) : '', s ? s.delai.toFixed(1) : '', s ? s.qualite : '', s ? s.total.toFixed(1) : ''])
    })
    download(`${c.id}_comparatif.csv`, csv(rows))
  }

  const cell = (x: string, content: React.ReactNode) => <td key={x} className={x === sc.best ? 'best' : ''}>{content}</td>
  const recOr = (x: string, fn: (r: ReponseDevis, s: (typeof sc.res)[string]) => React.ReactNode) => {
    const r = c.reponses[x]
    return r && r.statut === 'recu' ? fn(r, sc.res[x]) : <Muted />
  }
  const row = (label: React.ReactNode, fn: Parameters<typeof recOr>[1]) => <tr><td className="rl">{label}</td>{c.entreprises.map(x => cell(x, recOr(x, fn)))}</tr>
  const bar = (v: number, max: number) => <>{fnum(v, 1)}<div className="mbar"><span style={{ width: `${Math.round(v / max * 100)}%` }}></span></div></>
  const lotsLabel = c.lignes.map(i => shortLot(d.lignes[i].lot)).filter((v, i, a) => a.indexOf(v) === i).join(' et ')

  return (
    <Layout active="demandes">
      <Crumb items={[{ label: 'Demandes', href: '#/demandes' }, { label: d.id, href: `#/demande/${d.id}` }, { label: `Consultation ${c.id}` }]} />
      <div className="pagehead">
        <div className="t"><h1>Devis reçus et décision</h1>{stChip}<span className="muted s13">{lotsLabel} · {log?.id} · {log?.ville} · clôture des réponses le {fd(c.dateLimite)} à {c.heureLimite}</span></div>
        <div className="row !gap-2">
          {waiting.length > 0 && c.statut !== 'commande' && <button className="btn" onClick={() => { upd(x => hist(x, `Relance envoyée aux non-répondants (${waiting.length})`), true); toast('Relance envoyée') }}>Relancer les non-répondants ({waiting.length})</button>}
          <button className="btn" onClick={exportCsv}>Exporter le tableau</button>
        </div>
      </div>
      <div className="kpis">
        <Kpi label="Entreprises consultées" value={c.entreprises.length} sub={<>mode : {{ devis: 'mise en concurrence', unique: 'entreprise unique', accord: 'accord-cadre' }[c.mode]}</>} />
        <Kpi label="Devis reçus" value={rec.length} sub={<>{declined ? declined + ' a décliné · ' : ''}{waiting.length} en attente</>} />
        <Kpi label="Écart entre devis" value={ecart == null ? '—' : ecart + ' %'} sub={<>du moins cher au plus cher</>} />
        <Kpi label="Estimation interne" value={c.estimation ? feur(c.estimation) : '—'} sub={<>HT</>} />
      </div>
      <div className="cols !gap-4">
        <section className="card pad min-w-0" style={{ flex: '999 1 700px' }}>
          <div className="row between mb-3"><h2 className="h2">Tableau comparatif</h2><span className="muted s13">Pondération : prix {c.criteres.prix} % · délai {c.criteres.delai} % · qualité {c.criteres.qualite} %</span></div>
          <div className="tbl-wrap"><table className="t cmp" style={{ minWidth: 180 + 190 * ents.length }}>
            <thead><tr><th></th>{ents.map(e => <th key={e.id} className={e.id === sc.best ? 'best' : ''}>{e.nom}{e.id === sc.best && <div className="mt-1"><Chip tone="bl">Recommandé</Chip></div>}</th>)}</tr></thead>
            <tbody>
              <tr><td className="rl">Statut</td>{c.entreprises.map(x => {
                const r = c.reponses[x] || { statut: 'attente' as const }
                return cell(x, r.statut === 'recu' ? <Chip tone="ok">Devis reçu {fd(r.date)}</Chip>
                  : r.statut === 'decline' ? <><Chip>A décliné</Chip><small>{r.motif || ''}</small></>
                    : <><Chip tone="h48">En attente</Chip> <a className="small" href={`#/portail/${c.id}/${x}`}>portail</a></>)
              })}</tr>
              {c.visite && row('Visite sur place', r => r.visite ? 'Faite le ' + fd(r.visite) : 'Non')}
              {row('Montant HT', r => <strong>{feur(r.montantHT)}</strong>)}
              {row('Montant TTC', r => <>{feur((r.montantHT ?? 0) * (1 + (r.tva ?? 0) / 100))} <span className="muted">(TVA {fnum(r.tva ?? 0, (r.tva ?? 0) % 1 ? 1 : 0)} %)</span></>)}
              {row("Délai d'intervention", r => `${r.delai} jour${(r.delai ?? 0) > 1 ? 's' : ''}`)}
              {row('Durée des travaux', r => `${r.duree} jour${(r.duree ?? 0) > 1 ? 's' : ''}`)}
              {row('Validité du devis', r => `${r.validite} mois`)}
              {row('Postes couverts', (r, s) => s.complet ? `${(r.postes || []).length} / ${c.lignes.length}` : <Chip tone="wa">{`${(r.postes || []).length} / ${c.lignes.length} · ${c.lignes.filter(i => !(r.postes || []).includes(i)).map(i => d.lignes[i].nature.toLowerCase()).join(', ')} absent`}</Chip>)}
              {row('Documents administratifs', (_r, s) => <Chip tone={s.docsOk ? 'ok' : 'ko'}>{s.docsOk ? 'Conformes' : s.docsLabel}</Chip>)}
              {row('Devis PDF', r => <span className="small">{r.pdf || 'devis.pdf'}</span>)}
              {row(`Note prix /${c.criteres.prix}`, (_r, s) => bar(s.prix, c.criteres.prix))}
              {row(`Note délai /${c.criteres.delai}`, (_r, s) => bar(s.delai, c.criteres.delai))}
              <tr><td className="rl">Note qualité /{c.criteres.qualite}<small className="block">saisie coordination</small></td>{c.entreprises.map(x => cell(x, recOr(x, r => (
                <input className="in sm !min-h-[30px] !w-[76px]" type="number" step={0.5} min={0} max={c.criteres.qualite} value={r.qualite == null ? '' : r.qualite} disabled={locked}
                  onChange={e => upd(cc => { cc.reponses[x].qualite = Math.min(cc.criteres.qualite, Math.max(0, Number(e.target.value) || 0)) })} />
              ))))}</tr>
              {row('Note totale /100', (_r, s) => <><strong>{fnum(s.total, 1)}</strong>{!s.retenable && <> <Chip tone="ko">non retenable</Chip></>}</>)}
            </tbody></table></div>
          <p className="muted small mb-0 mt-3">Notes calculées automatiquement : prix = devis le moins cher ÷ devis × {c.criteres.prix} ; délai = délai le plus court ÷ délai × {c.criteres.delai} ; qualité saisie par la coordination (références, historique, visite). Non retenable : documents non conformes ou poste manquant.</p>
        </section>
        <aside className="col-side">
          <section className="card pad">
            <h2 className="h2 mb-3.5">Décision</h2>
            {dec.statut === 'validee' ? (
              <>
                <div className="note !border-good-line !bg-good-soft">Commande {dec.bc} passée à <strong>{getEnt(S, dec.entrepriseId)?.nom}</strong>{chosen && chosen.montantHT ? ` pour ${feur(chosen.montantHT)} HT` : ''}. {dec.motif}</div>
                <p className="muted small mb-0 mt-2.5">Bon de commande envoyé, mission planifiée côté prestataire{d.dateIntervention ? ` (intervention prévue ${fday(d.dateIntervention)})` : ''}, mail automatique aux entreprises non retenues.</p>
                <a className="btn btn-w mt-3" href={`#/demande/${d.id}`}>Suivre la demande</a>
              </>
            ) : (
              <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
                <div><label className="lbl" htmlFor="dvent">Entreprise retenue</label><select className="in" id="dvent" value={dec.entrepriseId} disabled={locked} onChange={e => setDec('entrepriseId', e.target.value)}>
                  <Opts placeholder="Choisir…" list={rec.map(x => ({ v: x, l: `${getEnt(S, x)?.nom}${sc.res[x].retenable ? '' : ' (non retenable)'}` }))} /></select></div>
                <div><label className="lbl" htmlFor="dvmot">Motif du choix (obligatoire)</label><textarea className="in" id="dvmot" value={dec.motif} disabled={locked} placeholder="Meilleure note globale, délai, devis complet…" onChange={e => setDec('motif', e.target.value)} /></div>
                <div><label className="lbl" htmlFor="dvimp">Imputation</label><select className="in" id="dvimp" value={dec.imputation} disabled={locked} onChange={e => setDec('imputation', e.target.value)}><Opts list={S.ref.imputations} /></select></div>
                {needDir && <div className="note warn"><div><strong>Validation de la direction requise</strong><div>Montant supérieur à {feur(S.ref.seuils.direction)} HT</div></div></div>}
                {dec.statut === 'a_valider' ? (
                  <>
                    <button className="btn btnp btn-w" disabled={S.profil !== 'dir'} onClick={validerDirection}>Valider (direction)</button>
                    <button className="btn btn-w" onClick={() => { upd(x => { if (x.decision) x.decision.statut = 'brouillon'; hist(x, 'Choix refusé par la direction : à revoir') }, true) }}>Refuser et revoir</button>
                    {S.profil !== 'dir' && <p className="muted small m-0">Basculez sur le profil « Direction Immobilier » (en haut à droite) pour valider.</p>}
                  </>
                ) : <button className="btn btnp btn-w" disabled={!rec.length} onClick={soumettre}>{needDir ? 'Soumettre à validation' : 'Valider et commander'}</button>}
                <p className="muted small m-0">Après validation : bon de commande généré et envoyé, mission planifiée côté prestataire, mail automatique aux entreprises non retenues.</p>
              </div>
            )}
          </section>
          {c.questions.length > 0 && (
            <section className="card pad"><h2 className="h2 mb-1.5">Questions des entreprises</h2>
              {c.questions.map((q, i) => (
                <div key={i} className="qa"><strong>{q.q}</strong>
                  <div className="mt-1.5">{q.a ? <><span className="muted">Réponse :</span> {q.a}</> : (
                    <div className="row flex-nowrap !gap-1.5"><input className="in sm" placeholder="Réponse partagée avec toutes les entreprises" value={answers[i] || ''} onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))} /><button className="btn btn-sm" onClick={() => answer(i)}>Répondre</button></div>
                  )}</div></div>
              ))}
            </section>
          )}
          <section className="card pad"><h2 className="h2 mb-3">Historique de la consultation</h2>
            <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>{c.historique.slice().sort((a, b) => b.at.localeCompare(a.at)).map((h, i) => (
              <div key={i} className="row s13 flex-nowrap items-start !gap-2"><Chip tone={/reçu|émis|passée/.test(h.t) ? 'ok' : /envoyée à/.test(h.t) ? 'bl' : 'gr'}>{fd(h.at)}</Chip><span>{h.t}</span></div>
            ))}</div>
          </section>
          <section className="card pad s13"><strong>Portail entreprise</strong><p className="muted mb-2.5 mt-1.5">Lien personnel envoyé à chaque entreprise (démonstration) :</p>
            {ents.map(e => <div key={e.id} className="row between py-1"><span>{e.nom}</span><a href={`#/portail/${c.id}/${e.id}`}>Ouvrir le portail</a></div>)}</section>
        </aside>
      </div>
    </Layout>
  )
}

export default Quotes
