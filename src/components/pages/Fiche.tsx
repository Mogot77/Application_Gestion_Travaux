import { useApp } from '../../hooks/useApp'
import type { AppState, Demande } from '../../types'
import { Layout } from '../layout/Layout'
import { IcPhoto } from '../ui/Icons'
import { URG, dureeST, getD, getLog, getOuv, logAdr, shortLot } from '../../lib/domain'
import { TODAY, fd, fday, fdur, fdy, ftime, toMin, toTime } from '../../lib/dates'

/** Motif décoratif façon QR code (lien vers la mission sur mobile) — ce n'est pas un vrai QR code. */
function FakeQr({ seed }: { seed: string }) {
  let h = [...seed].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7)
  const n = 21
  const cells: { x: number; y: number }[] = []
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue
      h = (h * 1103515245 + 12345) >>> 0
      if ((h >> 16) & 1) cells.push({ x, y })
    }
  }
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#111" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" /><rect x={x + 2} y={y + 2} width="3" height="3" fill="#111" />
    </g>
  )
  return (
    <svg viewBox="-1 -1 23 23" width="84" height="84" aria-label="Code de saisie mobile">
      {cells.map(c => <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill="#111" />)}
      {finder(0, 0)}{finder(14, 0)}{finder(0, 14)}
    </svg>
  )
}

const Box = ({ on }: { on?: boolean }) => <span className="box">{on ? '✕' : ''}</span>
const Dots = '……………'
const Blank = () => <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>

function Pages({ S, d }: { S: AppState; d: Demande }) {
  const log = getLog(S, d.logementId)
  const r = S.rdvs.filter(x => x.demandeId === d.id && x.etat !== 'imp').sort((a, b) => b.date.localeCompare(a.date))[0]
  const imp = S.rdvs.find(x => x.demandeId === d.id && x.etat === 'imp')
  const o = r && getOuv(S, r.ouvrierId)
  const rp = r?.rapport
  const lignes = d.lignes.filter(l => l.circuit === 'ST' || !l.circuit)
  const urg = URG[d.urgence]
  const supps = rp ? rp.supps || [] : []
  const urgColor = d.urgence === 'urgent' ? '#B42318' : '#111'

  return (
    <>
      <div className="a4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[13px] font-bold text-muted">Equalis · Service technique</div>
            <div className="mt-1 text-[22px] font-bold">FICHE D'INTERVENTION</div>
            <div className="mt-1 text-[15px]"><strong>{d.id}</strong>{d.ft ? ' · ' + d.ft : ''}</div>
            <div className="mt-2"><span className="inline-block rounded px-2.5 py-0.5 font-bold" style={{ border: `2px solid ${urgColor}`, color: urgColor }}>{urg[2]}</span> <span className="ml-2 text-muted">Imprimée le {fdy(TODAY)}</span></div>
          </div>
          <div className="text-center"><FakeQr seed={d.id} /><div className="text-[10px] text-muted">Saisie mobile</div></div>
        </div>
        <div className="grid grid-cols-[1.4fr_1fr] gap-5">
          <div><h3>Logement</h3><dl className="mt-2">
            <dt>Logement</dt><dd>{log?.id} · {log?.typo} · {log?.ville} ({log?.dept})</dd>
            <dt>Adresse</dt><dd>{logAdr(log)}, {log?.etage}</dd>
            <dt>Accès</dt><dd>{d.acces || log?.acces || '—'}</dd>
            <dt>Clés</dt><dd>{d.numCles || '—'} · {(d.lieuCles || '').toLowerCase()}</dd>
            <dt>Établissement</dt><dd>{log?.etab} · {log?.section}</dd>
            <dt>Demandeur</dt><dd>{d.auteur}, {d.fonction.toLowerCase()} · {d.tel || '[téléphone]'}</dd></dl></div>
          <div><h3>Planification</h3><dl className="mt-2">
            <dt>Ouvrier</dt><dd>{o ? o.nom : Dots}</dd>
            <dt>Date</dt><dd>{r ? fday(r.date) : Dots}</dd>
            <dt>Créneau</dt><dd>{r ? `${r.debut} – ${toTime(toMin(r.debut) + r.duree)}` : Dots}</dd>
            <dt>Durée est.</dt><dd>{fdur(dureeST(d))}</dd></dl></div>
        </div>
        <div><h3>Travaux à réaliser</h3>
          <table className="mt-2"><thead><tr><th className="w-[30px]">N°</th><th>Pièce · lot · nature</th><th>Description</th><th className="w-[60px]">Durée</th><th className="w-16">Photo</th><th className="w-10">Fait</th></tr></thead><tbody>
            {lignes.map((l, i) => (
              <tr key={i}><td>{i + 1}</td><td><strong>{l.piece}</strong><br />{shortLot(l.lot)} · {l.nature}</td><td>{l.description}</td><td>{fdur(l.duree)}</td>
                <td>{l.photos[0] && l.photos[0] !== 'seed' ? <img src={l.photos[0]} alt="" className="h-[42px] w-14 object-cover" /> : <IcPhoto s={18} />}</td><td><Box on={l.statut === 'realisee'} /></td></tr>
            ))}
          </tbody></table></div>
        <div><h3>Consommables à emporter <span className="font-normal normal-case tracking-normal text-muted">· cocher au chargement</span></h3>
          <table className="mt-2"><thead><tr><th className="w-10">Pris</th><th>Désignation</th><th className="w-[50px]">Qté</th><th className="w-[90px]">Origine</th><th className="w-[60px]">Utilisé</th></tr></thead><tbody>
            {d.consommables.map((c, i) => <tr key={i}><td><Box on={c.pris} /></td><td>{c.nom}</td><td>{c.qte}</td><td>{c.origine}</td><td></td></tr>)}
            <tr><td><Box /></td><td>…………………………………</td><td></td><td></td><td></td></tr><tr><td><Box /></td><td>…………………………………</td><td></td><td></td><td></td></tr>
          </tbody></table></div>
        {d.observations && <div><h3>Observations du demandeur</h3><p className="mb-0 mt-2">{d.observations}</p></div>}
        <div className="foot"><span>Saisir heures, consommables et photos « après » sur mobile sous 48 h (QR code)</span><span>Recto 1/2</span></div>
      </div>

      <div className="a4">
        <div><div className="text-xl font-bold">COMPTE RENDU D'INTERVENTION</div>
          <div className="mt-1 text-sm"><strong>{d.id}</strong>{d.ft ? ' · ' + d.ft : ''}{rp && r && <> · <span className="font-bold text-good">saisi sur mobile le {fd(r.date)}</span></>}</div></div>
        <div><h3>Accès au logement</h3><div className="mt-2.5 flex flex-wrap gap-[22px]">
          <span><Box on={!!rp} />Intervention réalisée</span><span><Box on={!!imp} />Accès impossible</span>
          {S.ref.motifsAcces.slice(0, 3).map(m => <span key={m}><Box on={!!imp && imp.motifImp === m} />{m}</span>)}</div></div>
        <div><h3>Main d'œuvre</h3><table className="mt-2"><thead><tr><th>Ouvrier</th><th>Début</th><th>Fin</th><th>Heures</th><th>Déplacements</th></tr></thead><tbody>
          {rp && r && o ? <tr><td>{o.nom}</td><td>{ftime(r.debutReel) || r.debut}</td><td>{ftime(r.finReel)}</td><td>{fdur(rp.tempsMin)}</td><td>1</td></tr> : <Blank />}
          <Blank /></tbody></table></div>
        <div><h3>Statut des travaux</h3><table className="mt-2"><thead><tr><th className="w-[30px]">N°</th><th>Ligne</th><th className="w-20">Réalisée</th><th className="w-20">Partielle</th><th className="w-[90px]">Non réalisée</th></tr></thead><tbody>
          {lignes.map((l, i) => { const st = rp ? rp.lignes[i] : ''; return <tr key={i}><td>{i + 1}</td><td>{l.piece} · {l.nature}</td><td><Box on={st === 'realisee'} /></td><td><Box on={st === 'partielle'} /></td><td><Box on={st === 'non_realisee'} /></td></tr> })}
        </tbody></table></div>
        <div><h3>Travaux supplémentaires constatés sur place <span className="font-normal normal-case tracking-normal text-muted">(photo obligatoire sur mobile)</span></h3>
          <table className="mt-2"><thead><tr><th>Pièce</th><th>Travaux</th><th className="w-[70px]">Temps</th><th className="w-[110px]">Fait / à prog.</th></tr></thead><tbody>
            {supps.map((s, i) => <tr key={i}><td>{s.piece}</td><td>{shortLot(s.lot)} · {s.nature} — {s.description}</td><td>{fdur(s.duree)}</td><td>{s.suiteLabel}</td></tr>)}
            {!supps.length && <><tr><td>&nbsp;</td><td></td><td></td><td></td></tr><tr><td>&nbsp;</td><td></td><td></td><td></td></tr></>}</tbody></table></div>
        <div><h3>Matériel utilisé</h3><p className="mb-0 mt-2 min-h-9">{rp ? rp.conso.map(c => `${c.nom} × ${c.qte}`).join(' · ') || 'aucun' : ''}</p></div>
        <div><h3>Observations</h3><p className="mb-0 mt-2 min-h-12">{rp ? rp.obs || '—' : ''}</p></div>
        <div className="grid grid-cols-2 gap-5">
          <div><div className="mb-1 text-[11px] text-muted">Signature de l'ouvrier</div><div className="sigbox">{rp && o && <span className="italic">{o.nom}</span>}</div></div>
          <div><div className="mb-1 text-[11px] text-muted">Signature occupant ou référent (facultatif)</div><div className="sigbox">{rp && rp.signature ? <img src={rp.signature} alt="Signature" /> : rp && rp.signataire ? <span className="italic">{rp.signataire}</span> : null}</div></div>
        </div>
        <div className="foot"><span>À reporter sur mobile sous 48 h · à défaut, photo de cette fiche jointe par le chef d'équipe</span><span>Verso 2/2</span></div>
      </div>
    </>
  )
}

export function Fiche({ ids }: { ids: string }) {
  const { S } = useApp()
  const list = ids.split(',').map(i => getD(S, i)).filter((d): d is Demande => !!d)
  return (
    <Layout>
      <div className="pagehead noprint">
        <div><div className="crumb"><a href="#/demandes">Demandes</a> › Fiche{list.length > 1 ? 's' : ''} imprimable{list.length > 1 ? 's' : ''}</div><h1>{list.length === 1 ? list[0].id : `${list.length} fiches d'intervention`}</h1></div>
        <div className="row !gap-2">{list.length === 1 && <a className="btn" href={`#/demande/${list[0].id}`}>Ouvrir la demande</a>}<button className="btn btnp" disabled={!list.length} onClick={() => window.print()}>Imprimer (recto / verso)</button></div>
      </div>
      {list.length ? <div className="a4wrap">{list.map(d => <Pages key={d.id} S={S} d={d} />)}</div> : <div className="card pad empty">Aucune fiche à imprimer.</div>}
    </Layout>
  )
}
