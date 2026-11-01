import Icon from '@/components/ui/Icon'
import { isRealPhoto } from './helpers'
import type { PhotoViewProps } from './types'

/** Vignette de photo (présentation seule) ; une photo « seed » affiche un pictogramme. `onOpen` agrandit l'image. */
const PhotoView = ({ src, w = 96, h = 72, onOpen, onDelete }: PhotoViewProps) => {
  const real = isRealPhoto(src)
  return (
    <div
      className={`ph${real && onOpen ? ' cursor-zoom-in' : ''}`}
      style={{ width: w, height: h }}
      onClick={real && onOpen ? () => onOpen(src) : undefined}
    >
      {real ? <img src={src} alt="Photo" /> : <Icon name="photo" s={Math.min(22, w / 3)} />}
      {onDelete && (
        <button type="button" className="x" aria-label="Supprimer la photo" onClick={e => { e.stopPropagation(); onDelete() }}>×</button>
      )}
    </div>
  )
}

export default PhotoView
