import Icon from '@/components/ui/Icon'
import { useApp } from '@/hooks/useApp'
import { isRealPhoto } from './helpers'
import type { PhotoProps } from './types'

/** Vignette de photo ; une photo « seed » (donnée de démo) affiche un pictogramme. Cliquer ouvre l'aperçu. */
const Photo = ({ src, w = 96, h = 72, onDelete }: PhotoProps) => {
  const { openModal } = useApp()
  const real = isRealPhoto(src)
  return (
    <div
      className={`ph${real ? ' cursor-zoom-in' : ''}`}
      style={{ width: w, height: h }}
      onClick={real ? () => openModal({
        title: 'Photo', wide: true, noFooter: true,
        body: <img src={src} alt="Photo" className="w-full rounded-lg" />,
      }) : undefined}
    >
      {real ? <img src={src} alt="Photo" /> : <Icon name="photo" s={Math.min(22, w / 3)} />}
      {onDelete && (
        <button type="button" className="x" aria-label="Supprimer la photo" onClick={e => { e.stopPropagation(); onDelete() }}>×</button>
      )}
    </div>
  )
}

export default Photo
