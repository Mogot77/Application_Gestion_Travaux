import type { ObjEntry } from './types'

/** Corps de modale : un champ texte unique (renommer une valeur, un groupe, un libellé). */
export const NameBody = ({ defaultValue, label }: { defaultValue: string; label: string }) => (
  <input className="in" name="v" defaultValue={defaultValue} aria-label={label} />
)

/** Corps de modale : libellé et description d'une valeur structurante. */
export const ObjBody = ({ entry }: { entry: ObjEntry }) => (
  <>
    <div><label className="lbl" htmlFor="ro-l">Libellé</label><input className="in" id="ro-l" name="l" defaultValue={entry.l} /></div>
    <div><label className="lbl" htmlFor="ro-d">Description</label><textarea className="in" id="ro-d" name="d" rows={3} defaultValue={entry.d} /></div>
  </>
)

/** Corps de modale : ville (nom + latitude + longitude) ou département (code + libellé). */
export const RowBody = ({ isVille, a, b, c }: { isVille: boolean; a: string; b: string; c: string }) => isVille ? (
  <>
    <div><label className="lbl" htmlFor="rw-a">Ville</label><input className="in" id="rw-a" name="a" defaultValue={a} /></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div><label className="lbl" htmlFor="rw-b">Latitude</label><input className="in" id="rw-b" name="b" inputMode="decimal" defaultValue={b} /></div>
      <div><label className="lbl" htmlFor="rw-c">Longitude</label><input className="in" id="rw-c" name="c" inputMode="decimal" defaultValue={c} /></div>
    </div>
  </>
) : (
  <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
    <div><label className="lbl" htmlFor="rw-a">Code</label><input className="in" id="rw-a" name="a" defaultValue={a} /></div>
    <div><label className="lbl" htmlFor="rw-b">Libellé du dossier</label><input className="in" id="rw-b" name="b" defaultValue={b} /></div>
  </div>
)
