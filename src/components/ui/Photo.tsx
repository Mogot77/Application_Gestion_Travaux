import type { ChangeEvent, ReactNode } from 'react'
import { IcCam, IcPhoto } from './Icons'
import { useApp } from '../../hooks/useApp'

/** Vignette de photo ; une photo « seed » (donnée de démo) affiche un pictogramme. Cliquer ouvre l'aperçu. */
export function Photo({ src, w = 96, h = 72, onDelete }: { src?: string; w?: number; h?: number; onDelete?: () => void }) {
  const { openModal } = useApp()
  const real = !!src && src !== 'seed'
  return (
    <div
      className={`ph${real ? ' cursor-zoom-in' : ''}`}
      style={{ width: w, height: h }}
      onClick={real ? () => openModal({
        title: 'Photo', wide: true, noFooter: true,
        body: <img src={src} alt="Photo" className="w-full rounded-lg" />,
      }) : undefined}
    >
      {real ? <img src={src} alt="Photo" /> : <IcPhoto s={Math.min(22, w / 3)} />}
      {onDelete && (
        <button type="button" className="x" aria-label="Supprimer la photo" onClick={e => { e.stopPropagation(); onDelete() }}>×</button>
      )}
    </div>
  )
}

/** Bouton d'ajout de photo(s) (appareil photo sur mobile). */
export function AddPhoto({ onFiles, label = '+ Photo', w = 96, h = 72, req = false, multiple = true }: {
  onFiles: (files: FileList) => void; label?: ReactNode; w?: number | string; h?: number; req?: boolean; multiple?: boolean
}) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length) onFiles(files)
    e.target.value = ''
  }
  return (
    <label className={`addph${req ? ' req' : ''}`} style={{ width: w, height: h }}>
      {req && <IcCam c="#B42318" />}{label}
      <input type="file" accept="image/*" capture="environment" multiple={multiple} onChange={onChange} />
    </label>
  )
}
