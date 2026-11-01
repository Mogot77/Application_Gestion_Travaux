import { useApp } from '@/hooks/useApp'
import PhotoView from './PhotoView'
import type { PhotoProps } from './types'

/** Vignette de photo ; cliquer ouvre l'aperçu dans une modale. */
const Photo = (props: PhotoProps) => {
  const { openModal } = useApp()
  return (
    <PhotoView
      {...props}
      onOpen={src => openModal({ title: 'Photo', wide: true, noFooter: true, body: <img src={src} alt="Photo" className="w-full rounded-lg" /> })}
    />
  )
}

export default Photo
