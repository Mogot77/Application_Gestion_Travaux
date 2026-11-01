import type { ReactNode } from 'react'

export type AddPhotoProps = {
  onFiles: (files: FileList) => void
  label?: ReactNode
  w?: number | string
  h?: number
  req?: boolean
  multiple?: boolean
}
