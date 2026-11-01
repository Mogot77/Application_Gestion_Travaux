import type { ChangeEvent } from 'react'
import Icon from '@/components/ui/Icon'
import type { AddPhotoProps } from './types'

/** Bouton d'ajout de photo(s) (appareil photo sur mobile). */
const AddPhoto = ({ onFiles, label = '+ Photo', w = 96, h = 72, req = false, multiple = true }: AddPhotoProps) => {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length) onFiles(files)
    e.target.value = ''
  }
  return (
    <label className={`addph${req ? ' req' : ''}`} style={{ width: w, height: h }}>
      {req && <Icon name="cam" c="var(--color-danger)" />}{label}
      <input type="file" accept="image/*" capture="environment" multiple={multiple} onChange={onChange} />
    </label>
  )
}

export default AddPhoto
