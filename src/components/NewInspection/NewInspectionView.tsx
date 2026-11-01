import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field from '@/components/ui/Field'
import Icon from '@/components/ui/Icon'
import Opts from '@/components/ui/Opts'
import Seg from '@/components/ui/Seg'
import AddPhoto from '@/components/ui/AddPhoto'
import PageHead from '@/components/ui/PageHead'
import { PhotoView } from '@/components/Photo'
import Followups from './Followups'
import type { NewInspectionViewProps } from './types'

/** Formulaire de saisie d'un constat d'état (présentation seule : brouillon, listes et actions viennent du conteneur). */
const NewInspectionView = ({ model, onPatch, onSave, onAddFiles, onOpenPhoto }: NewInspectionViewProps) => {
  const { draft: c, logements, contextes, contexte, propreteLabel, groupes } = model
  const n = c.signalements.length
  return (
    <>
      <PageHead title="Nouveau constat d'état" subtitle="Ouvert à tout salarié. Décrire le logement, jamais le ménage." />
      <Card className="mx-auto flex max-w-[720px] flex-col gap-5 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Logement" htmlFor="cl"><select className="in" id="cl" value={c.logementId} onChange={e => onPatch({ logementId: e.target.value })}>
            <Opts placeholder="Choisir…" list={logements} /></select></Field>
          <Field label="Contexte de la visite" htmlFor="cc"><select className="in" id="cc" value={contexte} onChange={e => onPatch({ contexte: e.target.value })}><Opts list={contextes} /></select></Field>
        </div>
        <div><span className="lbl">Propreté · note de 0 à 6</span>
          <div className="pnote" role="group" aria-label="Note de propreté">{[0, 1, 2, 3, 4, 5, 6].map(i => <button key={i} type="button" className={c.proprete === i ? 'on' + (i <= 2 ? ' low' : '') : ''} onClick={() => onPatch({ proprete: i })}>{i}</button>)}</div>
          <div className="row between small muted mt-1.5"><span>0 insalubre</span><strong className="text-ink">{propreteLabel}</strong><span>6 impeccable</span></div>
          {c.proprete != null && c.proprete <= 2 && <p className="small mb-0 mt-1.5 text-danger">Note ≤ 2 : la coordination sera alertée.</p>}</div>
        <div><span className="lbl">État général du bâti</span><Seg values={['Bon', 'Moyen', 'Dégradé']} sel={c.bati} onPick={v => onPatch({ bati: v })} /></div>
        <div><span className="lbl">Signalements</span>
          <button type="button" className="in text-left" aria-expanded={c.open} onClick={() => onPatch({ open: !c.open })}>{n ? `${n} sélectionné${n > 1 ? 's' : ''}` : 'Aucun signalement'}<Icon name="chev" /></button>
          {c.open ? groupes.map(([g, arr]) => (
            <div key={g}><div className="small muted mb-0.5 mt-3 font-bold tracking-[.04em]">{g.toUpperCase()}</div>
              {arr.map(sg => <label key={sg} className="chkrow"><input type="checkbox" checked={c.signalements.includes(sg)} onChange={e => onPatch({ signalements: e.target.checked ? [...c.signalements, sg] : c.signalements.filter(x => x !== sg) })} /> {sg}</label>)}</div>
          )) : (n > 0 && <div className="mt-2">{c.signalements.map(sg => <span key={sg} className="tag">{sg}</span>)}</div>)}
        </div>
        <div><span className="lbl">Photos ({c.photos.length}) · pas de personne sur les photos</span>
          <div className="row !gap-2">{c.photos.map((ph, j) => <PhotoView key={j} src={ph} w={72} h={72} onOpen={onOpenPhoto} onDelete={() => onPatch({ photos: c.photos.filter((_x, k) => k !== j) })} />)}
            <AddPhoto label="+" w={72} h={72} onFiles={onAddFiles} /></div></div>
        <Field label="Commentaire" htmlFor="cm"><textarea className="in" id="cm" value={c.commentaire} placeholder="Décrire le logement" onChange={e => onPatch({ commentaire: e.target.value })} /></Field>
        <Followups model={model} onPatch={onPatch} />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => onSave(true)}>Enregistrer et créer une demande</Button>
          <Button variant="primary" onClick={() => onSave(false)}>Enregistrer le constat</Button>
        </div>
      </Card>
    </>
  )
}

export default NewInspectionView
