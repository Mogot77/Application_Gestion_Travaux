import { useState, type CSSProperties, type ReactNode } from 'react'
import type { ReponseDevis } from '@/types'
import Chip from '@/components/ui/Chip'
import Opts from '@/components/ui/Opts'
import Kpi from '@/components/ui/Kpi'
import Crumb from '@/components/ui/Crumb'
import { fd, fday, feur, fnum } from '@/helpers/dates'
import type { EntScore, QuotesViewProps } from './types'

const Muted = () => <span className="muted">—</span>

/** Comparaison des devis et décision (présentation seule) : tableau comparatif, décision, questions et historique. */
const QuotesView = ({ model, error, onRelance, onExport, onSetDecision, onSubmit, onValidate, onRefuse, onQuality, onAnswer }: QuotesViewProps) => {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  if (!model) return <div className="card pad empty">{error}</div>
  const { c, d, log, sc, ents, declined, waitingCount, ecart, dec, decEntNom, chosenMontant, needDir, locked, lotsLabel, recOptions, imputations, seuilDirection, isDir, historique } = model
  const rec = sc.rec
  const stChip = c.statut === 'commande' ? <Chip tone="ok">Commande passée</Chip> : dec.statut === 'a_valider' ? <Chip tone="h48">En attente de validation direction</Chip> : <Chip tone="bl">{waitingCount ? 'Réponses en cours' : 'Analyse en cours'}</Chip>

  const answer = (i: number) => {
    const v = (answers[i] || '').trim()
    if (!v) return
    onAnswer(i, v)
  }

  const cell = (x: string, content: ReactNode) => <td key={x} className={x === sc.best ? 'best' : ''}>{content}</td>
  const recOr = (x: string, fn: (r: ReponseDevis, s: EntScore) => ReactNode) => {
    const r = c.reponses[x]
    return r && r.statut === 'recu' ? fn(r, sc.res[x]) : <Muted />
  }
  const row = (label: ReactNode, fn: Parameters<typeof recOr>[1]) => <tr><td className="rl">{label}</td>{c.entreprises.map(x => cell(x, recOr(x, fn)))}</tr>
  const bar = (v: number, max: number) => <>{fnum(v, 1)}<div className="mbar"><span style={{ width: `${Math.round(v / max * 100)}%` }}></span></div></>

  return (
    <>
      <Crumb items={[{ label: 'Demandes', href: '#/demandes' }, { label: d.id, href: `#/demande/${d.id}` }, { label: `Consultation ${c.id}` }]} />
      <div className="pagehead">
        <div className="t"><h1>Devis reçus et décision</h1>{stChip}<span className="muted s13">{lotsLabel} · {log?.id} · {log?.ville} · clôture des réponses le {fd(c.dateLimite)} à {c.heureLimite}</span></div>
        <div className="row !gap-2">
          {waitingCount > 0 && c.statut !== 'commande' && <button className="btn" onClick={onRelance}>Relancer les non-répondants ({waitingCount})</button>}
          <button className="btn" onClick={onExport}>Exporter le tableau</button>
        </div>
      </div>
      <div className="kpis">
        <Kpi label="Entreprises consultées" value={c.entreprises.length} sub={<>mode : {{ devis: 'mise en concurrence', unique: 'entreprise unique', accord: 'accord-cadre' }[c.mode]}</>} />
        <Kpi label="Devis reçus" value={rec.length} sub={<>{declined ? declined + ' a décliné · ' : ''}{waitingCount} en attente</>} />
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
                  onChange={e => onQuality(x, e.target.value)} />
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
                <div className="note !border-good-line !bg-good-soft">Commande {dec.bc} passée à <strong>{decEntNom}</strong>{chosenMontant ? ` pour ${feur(chosenMontant)} HT` : ''}. {dec.motif}</div>
                <p className="muted small mb-0 mt-2.5">Bon de commande envoyé, mission planifiée côté prestataire{d.dateIntervention ? ` (intervention prévue ${fday(d.dateIntervention)})` : ''}, mail automatique aux entreprises non retenues.</p>
                <a className="btn btn-w mt-3" href={`#/demande/${d.id}`}>Suivre la demande</a>
              </>
            ) : (
              <div className="stack" style={{ '--gap': '14px' } as CSSProperties}>
                <div><label className="lbl" htmlFor="dvent">Entreprise retenue</label><select className="in" id="dvent" value={dec.entrepriseId} disabled={locked} onChange={e => onSetDecision('entrepriseId', e.target.value)}>
                  <Opts placeholder="Choisir…" list={recOptions} /></select></div>
                <div><label className="lbl" htmlFor="dvmot">Motif du choix (obligatoire)</label><textarea className="in" id="dvmot" value={dec.motif} disabled={locked} placeholder="Meilleure note globale, délai, devis complet…" onChange={e => onSetDecision('motif', e.target.value)} /></div>
                <div><label className="lbl" htmlFor="dvimp">Imputation</label><select className="in" id="dvimp" value={dec.imputation} disabled={locked} onChange={e => onSetDecision('imputation', e.target.value)}><Opts list={imputations} /></select></div>
                {needDir && <div className="note warn"><div><strong>Validation de la direction requise</strong><div>Montant supérieur à {feur(seuilDirection)} HT</div></div></div>}
                {dec.statut === 'a_valider' ? (
                  <>
                    <button className="btn btnp btn-w" disabled={!isDir} onClick={onValidate}>Valider (direction)</button>
                    <button className="btn btn-w" onClick={onRefuse}>Refuser et revoir</button>
                    {!isDir && <p className="muted small m-0">Basculez sur le profil « Direction Immobilier » (en haut à droite) pour valider.</p>}
                  </>
                ) : <button className="btn btnp btn-w" disabled={!rec.length} onClick={onSubmit}>{needDir ? 'Soumettre à validation' : 'Valider et commander'}</button>}
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
            <div className="stack" style={{ '--gap': '8px' } as CSSProperties}>{historique.map((h, i) => (
              <div key={i} className="row s13 flex-nowrap items-start !gap-2"><Chip tone={/reçu|émis|passée/.test(h.t) ? 'ok' : /envoyée à/.test(h.t) ? 'bl' : 'gr'}>{fd(h.at)}</Chip><span>{h.t}</span></div>
            ))}</div>
          </section>
          <section className="card pad s13"><strong>Portail entreprise</strong><p className="muted mb-2.5 mt-1.5">Lien personnel envoyé à chaque entreprise (démonstration) :</p>
            {ents.map(e => <div key={e.id} className="row between py-1"><span>{e.nom}</span><a href={`#/portail/${c.id}/${e.id}`}>Ouvrir le portail</a></div>)}</section>
        </aside>
      </div>
    </>
  )
}

export default QuotesView
