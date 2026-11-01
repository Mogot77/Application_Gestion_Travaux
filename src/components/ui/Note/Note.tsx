import type { NoteProps } from './types'

const Note = ({ tone = '', children, className = '' }: NoteProps) => (
  <div className={`note ${tone} ${className}`}>{children}</div>
)

export default Note
