import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Field from '@/components/ui/Field'
import Note from '@/components/ui/Note'
import { fdy } from '@/helpers/dates'
import { FACTURE_STATUT, TVA_RATES, fmoney, lineHT } from '@/helpers/billing'
import type { InvoiceViewProps } from './types'

const num = (v: string): number => (v === '' || isNaN(Number(v.replace(',', '.'))) ? 0 : Number(v.replace(',', '.')))
const taux = (n: number): string => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %'

/** Facture de refacturation (vue) : formulaire d'édition du brouillon (non imprimé) + facture A4 prête à imprimer ou à enregistrer en PDF. */
const InvoiceView = ({ model, onMeta, onEmetteur, onDestinataire, onLigne, onAddLigne, onRemoveLigne, onEmit, onPaid, onCancel, onPrint }: InvoiceViewProps) => {
  if (!model) return <div className="card pad empty">Facture introuvable. <a href="#/facturation">Retour à la refacturation</a></div>
  const { f, totals, errors, editable } = model
  const [statutLabel, statutTone] = FACTURE_STATUT[f.statut]

  return (
    <>
      <div className="pagehead noprint">
        <div>
          <div className="crumb"><a href="#/facturation">Refacturation</a> › {f.id}</div>
          <h1 className="mb-1">Facture {f.id} <Chip tone={statutTone}>{statutLabel}</Chip></h1>
          <p className="muted m-0">Demande <a href={`#/demande/${f.demandeId}`}>{f.demandeId}</a></p>
        </div>
        <div className="row !gap-2">
          {editable && <Button variant="primary" onClick={onEmit}>Émettre la facture</Button>}
          {f.statut === 'emise' && <Button variant="primary" onClick={onPaid}>Marquer payée</Button>}
          {(f.statut === 'brouillon' || f.statut === 'emise') && <Button variant="danger" onClick={onCancel}>Annuler la facture</Button>}
          <Button onClick={onPrint}>Imprimer / PDF</Button>
        </div>
      </div>

      {editable && (
        <div className="noprint mb-6 stack">
          {errors.length > 0 && <Note tone="warn">À compléter avant l'émission : {errors.join(' · ')}.</Note>}
          <section className="card pad">
            <h2 className="h2">Émetteur</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nom ou raison sociale" htmlFor="em-nom"><input className="in" id="em-nom" value={f.emetteur.nom} onChange={e => onEmetteur({ nom: e.target.value })} /></Field>
              <Field label="SIRET" htmlFor="em-siret"><input className="in" id="em-siret" value={f.emetteur.siret} onChange={e => onEmetteur({ siret: e.target.value })} /></Field>
              <Field label="Adresse" htmlFor="em-adr"><input className="in" id="em-adr" value={f.emetteur.adresse} onChange={e => onEmetteur({ adresse: e.target.value })} /></Field>
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <Field label="Code postal" htmlFor="em-cp"><input className="in" id="em-cp" value={f.emetteur.cp} onChange={e => onEmetteur({ cp: e.target.value })} /></Field>
                <Field label="Ville" htmlFor="em-ville"><input className="in" id="em-ville" value={f.emetteur.ville} onChange={e => onEmetteur({ ville: e.target.value })} /></Field>
              </div>
              <Field label="N° de TVA intracommunautaire" htmlFor="em-tva"><input className="in" id="em-tva" value={f.emetteur.tvaIntra} onChange={e => onEmetteur({ tvaIntra: e.target.value })} /></Field>
              <Field label="IBAN (règlement par virement)" htmlFor="em-iban"><input className="in" id="em-iban" value={f.emetteur.iban} onChange={e => onEmetteur({ iban: e.target.value })} /></Field>
              <Field label="E-mail" htmlFor="em-mail"><input className="in" id="em-mail" type="email" value={f.emetteur.email} onChange={e => onEmetteur({ email: e.target.value })} /></Field>
              <Field label="Téléphone" htmlFor="em-tel"><input className="in" id="em-tel" value={f.emetteur.tel} onChange={e => onEmetteur({ tel: e.target.value })} /></Field>
            </div>
          </section>
          <section className="card pad">
            <h2 className="h2">Destinataire</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nom" htmlFor="de-nom"><input className="in" id="de-nom" value={f.destinataire.nom} onChange={e => onDestinataire({ nom: e.target.value })} /></Field>
              <Field label="Adresse" htmlFor="de-adr"><input className="in" id="de-adr" value={f.destinataire.adresse} onChange={e => onDestinataire({ adresse: e.target.value })} /></Field>
              <Field label="Code postal" htmlFor="de-cp"><input className="in" id="de-cp" value={f.destinataire.cp} onChange={e => onDestinataire({ cp: e.target.value })} /></Field>
              <Field label="Ville" htmlFor="de-ville"><input className="in" id="de-ville" value={f.destinataire.ville} onChange={e => onDestinataire({ ville: e.target.value })} /></Field>
            </div>
          </section>
          <section className="card pad">
            <h2 className="h2">Facture</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Date d'émission" htmlFor="f-date"><input className="in" id="f-date" type="date" value={f.date} onChange={e => onMeta({ date: e.target.value })} /></Field>
              <Field label="Date d'échéance" htmlFor="f-ech"><input className="in" id="f-ech" type="date" value={f.echeance} onChange={e => onMeta({ echeance: e.target.value })} /></Field>
              <Field label="Date de la prestation" htmlFor="f-prest"><input className="in" id="f-prest" type="date" value={f.prestation} onChange={e => onMeta({ prestation: e.target.value })} /></Field>
            </div>
            <Field className="mt-3" label="Objet" htmlFor="f-objet"><input className="in" id="f-objet" value={f.objet} onChange={e => onMeta({ objet: e.target.value })} /></Field>
            <h3 className="mb-2 mt-5 text-sm font-bold">Lignes</h3>
            <div className="tbl-wrap">
              <table className="t min-w-[760px]">
                <thead><tr><th>Désignation</th><th className="w-20">Qté</th><th className="w-24">Unité</th><th className="w-28">PU HT (€)</th><th className="w-28">TVA</th><th className="w-28 text-right">Total HT</th><th className="w-10"></th></tr></thead>
                <tbody>
                  {f.lignes.map((l, i) => (
                    <tr key={i}>
                      <td><input className="in" aria-label={`Désignation ligne ${i + 1}`} value={l.libelle} onChange={e => onLigne(i, { libelle: e.target.value })} /></td>
                      <td><input className="in" type="number" min="0" step="any" aria-label={`Quantité ligne ${i + 1}`} value={l.qte} onChange={e => onLigne(i, { qte: num(e.target.value) })} /></td>
                      <td><input className="in" aria-label={`Unité ligne ${i + 1}`} value={l.unite} onChange={e => onLigne(i, { unite: e.target.value })} /></td>
                      <td><input className="in" type="number" min="0" step="0.01" aria-label={`Prix unitaire HT ligne ${i + 1}`} value={l.puHT} onChange={e => onLigne(i, { puHT: num(e.target.value) })} /></td>
                      <td>
                        <select className="in" aria-label={`Taux de TVA ligne ${i + 1}`} value={l.tva} onChange={e => onLigne(i, { tva: Number(e.target.value) })}>
                          {TVA_RATES.map(t => <option key={t} value={t}>{taux(t)}</option>)}
                        </select>
                      </td>
                      <td className="text-right">{fmoney(lineHT(l))}</td>
                      <td><button type="button" className="btn btn-sm" aria-label={`Supprimer la ligne ${i + 1}`} onClick={() => onRemoveLigne(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button className="mt-3" size="sm" onClick={onAddLigne}>+ Ajouter une ligne</Button>
            <Field className="mt-4" label="Conditions de paiement et mentions" htmlFor="f-notes"><textarea className="in" id="f-notes" rows={3} value={f.notes} onChange={e => onMeta({ notes: e.target.value })} /></Field>
          </section>
        </div>
      )}

      <div className="a4wrap">
        <div className="a4">
          <div className="flex justify-between gap-6">
            <div>
              <div className="text-base font-bold">{f.emetteur.nom || 'Émetteur'}</div>
              <div>{f.emetteur.adresse}</div>
              <div>{[f.emetteur.cp, f.emetteur.ville].filter(Boolean).join(' ')}</div>
              {f.emetteur.siret && <div>SIRET : {f.emetteur.siret}</div>}
              {f.emetteur.tvaIntra && <div>TVA intracommunautaire : {f.emetteur.tvaIntra}</div>}
              {f.emetteur.email && <div>{f.emetteur.email}</div>}
              {f.emetteur.tel && <div>{f.emetteur.tel}</div>}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">FACTURE</div>
              <div>N° {f.id}</div>
              <div>Date : {fdy(f.date)}</div>
              <div>Échéance : {fdy(f.echeance)}</div>
              <div>Prestation : {fdy(f.prestation)}</div>
              {f.statut === 'annulee' && <div className="font-bold">ANNULÉE</div>}
              {f.statut === 'payee' && <div className="font-bold">ACQUITTÉE{f.payeeLe ? ` le ${fdy(f.payeeLe)}` : ''}</div>}
            </div>
          </div>
          <div className="self-end text-left sm:w-[46%]">
            <h3>Destinataire</h3>
            <div className="mt-1 font-bold">{f.destinataire.nom}</div>
            <div>{f.destinataire.adresse}</div>
            <div>{[f.destinataire.cp, f.destinataire.ville].filter(Boolean).join(' ')}</div>
          </div>
          <div><strong>Objet :</strong> {f.objet} <span className="muted">(réf. demande {f.demandeId})</span></div>
          <table>
            <thead><tr><th>Désignation</th><th className="text-right">Qté</th><th>Unité</th><th className="text-right">PU HT</th><th className="text-right">TVA</th><th className="text-right">Total HT</th></tr></thead>
            <tbody>
              {f.lignes.map((l, i) => (
                <tr key={i}>
                  <td>{l.libelle}</td><td className="text-right">{l.qte.toLocaleString('fr-FR')}</td><td>{l.unite}</td>
                  <td className="text-right">{fmoney(l.puHT)}</td><td className="text-right">{taux(l.tva)}</td><td className="text-right">{fmoney(lineHT(l))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="self-end sm:w-[55%]">
            <table>
              <tbody>
                <tr><td>Total HT</td><td className="text-right">{fmoney(totals.totalHT)}</td></tr>
                {totals.parTaux.map(g => <tr key={g.taux}><td>TVA {taux(g.taux)} <span className="muted">(base {fmoney(g.baseHT)})</span></td><td className="text-right">{fmoney(g.tva)}</td></tr>)}
                <tr><td><strong>Total TTC</strong></td><td className="text-right"><strong>{fmoney(totals.totalTTC)}</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div className="mt-auto flex flex-col gap-1 text-[11.5px]">
            {f.notes && <p className="m-0">{f.notes}</p>}
            {f.emetteur.iban && <p className="m-0">Règlement par virement — IBAN : {f.emetteur.iban}</p>}
          </div>
        </div>
      </div>
    </>
  )
}

export default InvoiceView
