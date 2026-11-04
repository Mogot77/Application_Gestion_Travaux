import { useState } from 'react'
import AddPhoto from '@/components/ui/AddPhoto'
import { PhotoView } from '@/components/Photo'
import { readPhotos } from '@/helpers/photos'
import type { PhotoPickerProps } from './types'

/** Prise de photos dans une modale : les photos sont renvoyées au formulaire par des champs cachés de même `name`. */
const PhotoPicker = ({ name, legend, hint, required = false }: PhotoPickerProps) => {
  const [photos, setPhotos] = useState<string[]>([])
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="lbl">{legend}{required && <span className="text-danger"> *</span>}</legend>
      {hint && <p className="muted m-0 mb-2 text-sm">{hint}</p>}
      <div className="row !gap-2">
        {photos.map((p, i) => <PhotoView key={i} src={p} w={96} h={72} onDelete={() => setPhotos(a => a.filter((_, j) => j !== i))} />)}
        <AddPhoto req={required && photos.length === 0} onFiles={files => { void readPhotos(files).then(a => setPhotos(cur => [...cur, ...a])) }} />
      </div>
      {photos.map((p, i) => <input key={i} type="hidden" name={name} value={p} />)}
    </fieldset>
  )
}

export default PhotoPicker
